// ═════════════════════════════════════════════════════════════════════════════
// Mempool Sentinel Pro — Types Complets
// ═════════════════════════════════════════════════════════════════════════════

// ── Mempool Core ────────────────────────────────────────────────────────────

export interface MempoolStats {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: Array<[number, number]>; // [feeRate, vSize]
}

export interface MempoolInfo {
  loaded: boolean;
  size: number;
  bytes: number;
  usage: number;
  total_fee: number;
  maxmempool: number;
  mempoolminfee: number;
  minrelaytxfee: number;
  incrementalrelayfee: number;
  unbroadcastcount: number;
  fullrbf: boolean;
}

export interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

// ── Blocks ──────────────────────────────────────────────────────────────────

export interface MempoolBlock {
  blockSize: number;
  blockVSize: number;
  nTx: number;
  totalFees: number;
  medianFee: number;
  feeRange: number[];
}

export interface Block {
  id: string;
  height: number;
  version: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  merkle_root: string;
  previousblockhash: string;
  mediantime: number;
  nonce: number;
  bits: number;
  difficulty: number;
  extras?: BlockExtras;
}

export interface BlockExtras {
  coinbaseRaw: string;
  medianFee: number;
  feeRange: number[];
  reward: number;
  totalFees: number;
  avgFee: number;
  avgFeeRate: number;
  pool?: MiningPool;
  matchRate: number;
  expectedFees: number;
  expectedWeight: number;
}

export interface MiningPool {
  id: number;
  name: string;
  slug: string;
}

// ── Transactions ────────────────────────────────────────────────────────────

export interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  vin: TxInput[];
  vout: TxOutput[];
  size: number;
  weight: number;
  fee: number;
  status: TxStatus;
  firstSeen?: number;
}

export interface TxInput {
  txid: string;
  vout: number;
  prevout: PrevOut | null;
  scriptsig: string;
  scriptsig_asm: string;
  witness: string[];
  is_coinbase: boolean;
  sequence: number;
  inner_redeemscript_asm?: string;
  inner_witnessscript_asm?: string;
}

export interface PrevOut {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: ScriptPubKeyType;
  scriptpubkey_address: string;
  value: number;
}

export interface TxOutput {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: ScriptPubKeyType;
  scriptpubkey_address?: string;
  value: number;
}

export type ScriptPubKeyType =
  | "p2pk"
  | "p2pkh"
  | "p2sh"
  | "v0_p2wpkh"
  | "v0_p2wsh"
  | "v1_p2tr"
  | "op_return"
  | "multisig"
  | string;

export interface TxStatus {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

// ── Addresses ───────────────────────────────────────────────────────────────

export interface AddressInfo {
  address: string;
  chain_stats: AddressStats;
  mempool_stats: AddressStats;
}

export interface AddressStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: TxStatus;
}

// ── Prices & Markets ────────────────────────────────────────────────────────

export interface PriceInfo {
  time: number;
  USD: number;
  EUR: number;
  GBP: number;
  CAD: number;
  CHF: number;
  AUD: number;
  JPY: number;
}

// ── Fee Market ──────────────────────────────────────────────────────────────

export interface FeeHistoryPoint {
  time: number;
  fastest: number;
  halfHour: number;
  hour: number;
  economy: number;
}

export interface FeeDistribution {
  ranges: Array<{
    min: number;
    max: number;
    count: number;
    vsize: number;
  }>;
}

// ── Alerts & Tracking ───────────────────────────────────────────────────────

export interface Alert {
  id: string;
  type: "fee" | "block" | "tx" | "address" | "mempool" | "price";
  message: string;
  timestamp: number;
  read: boolean;
  severity: "info" | "warning" | "success" | "error";
  data?: Record<string, unknown>;
}

export interface TrackedAddress {
  address: string;
  label?: string;
  addedAt: number;
  balance?: number;
  txCount?: number;
}

export interface AddressTxEvent {
  address: string;
  tx: Transaction;
  type: "mempool" | "confirmed";
  timestamp: number;
}

// ── WebSocket Data ──────────────────────────────────────────────────────────

export interface WsStats {
  vBytesPerSecond: number;
  mempoolInfo: MempoolInfo;
  fees: RecommendedFees;
}

export interface WsBlock {
  block: Block;
}

export interface WsMempoolBlocks {
  "mempool-blocks": MempoolBlock[];
}

// ── Mining & Network ────────────────────────────────────────────────────────

export interface DifficultyAdjustment {
  progressPercent: number;
  difficultyChange: number;
  estimatedRetargetDate: number;
  remainingBlocks: number;
  remainingTime: number;
  previousRetarget: number;
  nextRetargetHeight: number;
  timeAvg: number;
  adjustedTimeAvg: number;
}

export interface HashrateInfo {
  hashrate: number;
  hashrate3d: number;
  currentDifficulty: number;
}

// ── Lightning Network ───────────────────────────────────────────────────────

export interface LightningStats {
  channel_count: number;
  node_count: number;
  total_capacity: number;
  avg_capacity: number;
  med_capacity: number;
}

// ── Dashboard State ─────────────────────────────────────────────────────────

export interface DashboardState {
  fees: RecommendedFees | null;
  mempoolInfo: MempoolInfo | null;
  mempoolBlocks: MempoolBlock[];
  latestBlock: Block | null;
  recentBlocks: Block[];
  vBytesPerSecond: number;
  feeHistory: FeeHistoryPoint[];
  alerts: Alert[];
  connected: boolean;
  lastUpdate: number;
  difficultyAdjustment: DifficultyAdjustment | null;
  hashrateInfo: HashrateInfo | null;
  priceInfo: PriceInfo | null;
  lightningStats: LightningStats | null;
  mempoolDistribution: FeeDistribution | null;
}
