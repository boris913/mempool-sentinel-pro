// ═════════════════════════════════════════════════════════════════════════════
// Mempool Sentinel Pro — Client API REST
// ═════════════════════════════════════════════════════════════════════════════

import type {
  RecommendedFees,
  MempoolBlock,
  Block,
  Transaction,
  AddressInfo,
  PriceInfo,
  MempoolStats,
  DifficultyAdjustment,
  HashrateInfo,
  LightningStats,
  FeeDistribution,
  UTXO,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_MEMPOOL_API || "https://mempool.bitdevsyde.org";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 0 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── Fees ───────────────────────────────────────────────────────────────────

export async function getRecommendedFees(): Promise<RecommendedFees> {
  return get<RecommendedFees>("/api/v1/fees/recommended");
}

export async function getMempoolBlocks(): Promise<MempoolBlock[]> {
  return get<MempoolBlock[]>("/api/v1/fees/mempool-blocks");
}

// ── Mempool ────────────────────────────────────────────────────────────────

export async function getMempoolStats(): Promise<MempoolStats> {
  return get<MempoolStats>("/api/mempool");
}

export async function getMempoolRaw(): Promise<Record<string, { vsize: number; ancestor_vsize: number; fees: { base: number; ancestor: number } }>> {
  return get("/api/mempool/txids").then(async (txids: string[]) => {
    const entries: Record<string, any> = {};
    // On limite à 100 pour éviter de surcharger
    for (const txid of txids.slice(0, 100)) {
      try {
        const tx = await getTransaction(txid);
        entries[txid] = {
          vsize: tx.weight / 4,
          fee: tx.fee,
          feeRate: tx.fee / (tx.weight / 4),
        };
      } catch { /* skip */ }
    }
    return entries;
  });
}

// ── Blocks ─────────────────────────────────────────────────────────────────

export async function getRecentBlocks(): Promise<Block[]> {
  return get<Block[]>("/api/v1/blocks");
}

export async function getBlock(hashOrHeight: string): Promise<Block> {
  if (/^\d+$/.test(hashOrHeight)) {
    const hash = await get<string>(`/api/block-height/${hashOrHeight}`);
    return get<Block>(`/api/v1/block/${hash}`);
  }
  return get<Block>(`/api/v1/block/${hashOrHeight}`);
}

export async function getBlockTxs(hash: string): Promise<Transaction[]> {
  return get<Transaction[]>(`/api/v1/block/${hash}/txs`);
}

// ── Difficulty & Hashrate ──────────────────────────────────────────────────

export async function getDifficultyAdjustment(): Promise<DifficultyAdjustment> {
  return get<DifficultyAdjustment>("/api/v1/difficulty-adjustment");
}

export async function getHashrateInfo(): Promise<HashrateInfo> {
  return get<HashrateInfo>("/api/v1/mining/hashrate/3d");
}

// ── Transactions ───────────────────────────────────────────────────────────

export async function getTransaction(txid: string): Promise<Transaction> {
  return get<Transaction>(`/api/tx/${txid}`);
}

export async function getTransactionStatus(txid: string): Promise<Transaction["status"]> {
  return get<Transaction["status"]>(`/api/tx/${txid}/status`);
}

export async function getTransactionTimes(txids: string[]): Promise<number[]> {
  const params = txids.map(id => `txId[]=${id}`).join("&");
  return get<number[]>(`/api/v1/transaction-times?${params}`);
}

export async function getAddressTransactions(address: string, lastTxid?: string): Promise<Transaction[]> {
  const path = lastTxid 
    ? `/api/address/${address}/txs/chain/${lastTxid}`
    : `/api/address/${address}/txs`;
  return get<Transaction[]>(path);
}

export async function getAddressMempoolTxs(address: string): Promise<Transaction[]> {
  return get<Transaction[]>(`/api/address/${address}/txs/mempool`);
}

// ── Addresses ─────────────────────────────────────────────────────────────

export async function getAddressInfo(address: string): Promise<AddressInfo> {
  return get<AddressInfo>(`/api/address/${address}`);
}

export async function getAddressUTXOs(address: string): Promise<UTXO[]> {
  return get<UTXO[]>(`/api/address/${address}/utxo`);
}

export async function validateAddress(address: string): Promise<{ isvalid: boolean }> {
  return get<{ isvalid: boolean }>(`/api/v1/validate-address/${address}`);
}

// ── Prices ─────────────────────────────────────────────────────────────────

export async function getBTCPrice(): Promise<PriceInfo> {
  return get<PriceInfo>("/api/v1/prices");
}

// ── Lightning ──────────────────────────────────────────────────────────────

export async function getLightningStats(): Promise<LightningStats> {
  return get<LightningStats>("/api/v1/lightning/statistics/latest");
}

// ── Fee Distribution ───────────────────────────────────────────────────────

export async function getFeeDistribution(): Promise<FeeDistribution> {
  // On construit la distribution depuis l'histogramme
  const stats = await getMempoolStats();
  const ranges: FeeDistribution["ranges"] = [];

  const buckets = [
    { min: 0, max: 1 },
    { min: 1, max: 2 },
    { min: 2, max: 5 },
    { min: 5, max: 10 },
    { min: 10, max: 20 },
    { min: 20, max: 50 },
    { min: 50, max: 100 },
    { min: 100, max: Infinity },
  ];

  for (const bucket of buckets) {
    const txs = stats.fee_histogram.filter(([rate]) => rate >= bucket.min && rate < bucket.max);
    const totalVsize = txs.reduce((sum, [, vsize]) => sum + vsize, 0);
    if (totalVsize > 0) {
      ranges.push({
        min: bucket.min,
        max: bucket.max,
        count: txs.length,
        vsize: totalVsize,
      });
    }
  }

  return { ranges };
}

// ── Search helper ──────────────────────────────────────────────────────────

export type SearchResult =
  | { type: "tx"; data: Transaction }
  | { type: "address"; data: AddressInfo }
  | { type: "block"; data: Block }
  | { type: "error"; message: string };

export async function universalSearch(query: string): Promise<SearchResult> {
  const q = query.trim();

  // TXID: 64 hex chars
  if (/^[a-f0-9]{64}$/i.test(q)) {
    try {
      const tx = await getTransaction(q);
      return { type: "tx", data: tx };
    } catch {
      try {
        const block = await getBlock(q);
        return { type: "block", data: block };
      } catch {
        return { type: "error", message: "Transaction ou bloc introuvable" };
      }
    }
  }

  // Block height: numeric
  if (/^\d+$/.test(q)) {
    try {
      const block = await getBlock(q);
      return { type: "block", data: block };
    } catch {
      return { type: "error", message: "Bloc introuvable à cette hauteur" };
    }
  }

  // Bitcoin address
  if (q.startsWith("bc1") || q.startsWith("1") || q.startsWith("3")) {
    try {
      const addr = await getAddressInfo(q);
      return { type: "address", data: addr };
    } catch {
      return { type: "error", message: "Adresse introuvable" };
    }
  }

  return { type: "error", message: "Format non reconnu. Entrez un TXID, une adresse ou une hauteur de bloc." };
}

// ── URL Helper ─────────────────────────────────────────────────────────────

export function mempoolApiUrl(path: string): string {
  return `${BASE}${path}`;
}
