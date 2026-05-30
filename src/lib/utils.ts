// ═════════════════════════════════════════════════════════════════════════════
// Mempool Sentinel Pro — Utilities
// ═════════════════════════════════════════════════════════════════════════════

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Formatage Monétaire ────────────────────────────────────────────────────

export function formatBTC(satoshis: number, decimals = 8): string {
  const btc = satoshis / 1e8;
  return btc.toFixed(decimals).replace(/\.?0+$/, "") + " BTC";
}

export function formatSats(satoshis: number): string {
  if (satoshis >= 1e8) return formatBTC(satoshis, 4);
  return satoshis.toLocaleString("fr-FR") + " sats";
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Formatage Données ──────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function formatVBytes(vbytes: number): string {
  if (vbytes < 1000) return vbytes.toFixed(0) + " vB/s";
  return (vbytes / 1000).toFixed(1) + " kvB/s";
}

export function formatHashrate(hashrate: number | undefined | null): string {
  if (hashrate == null || typeof hashrate !== "number" || isNaN(hashrate)) return "—";
  if (hashrate >= 1e18) return (hashrate / 1e18).toFixed(2) + " EH/s";
  if (hashrate >= 1e15) return (hashrate / 1e15).toFixed(2) + " PH/s";
  if (hashrate >= 1e12) return (hashrate / 1e12).toFixed(2) + " TH/s";
  if (hashrate >= 1e9) return (hashrate / 1e9).toFixed(2) + " GH/s";
  return hashrate.toFixed(2) + " H/s";
}

export function formatDifficulty(diff: number | undefined | null): string {
  if (diff == null || typeof diff !== "number" || isNaN(diff)) return "—";
  if (diff >= 1e12) return (diff / 1e12).toFixed(2) + " T";
  if (diff >= 1e9) return (diff / 1e9).toFixed(2) + " G";
  if (diff >= 1e6) return (diff / 1e6).toFixed(2) + " M";
  return diff.toFixed(2);
}

// ── Formatage Temps ────────────────────────────────────────────────────────

export function formatTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Troncature ─────────────────────────────────────────────────────────────

export function truncateAddress(address: string, length = 8): string {
  if (!address) return "";
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function truncateTxid(txid: string, length = 8): string {
  if (!txid) return "";
  return `${txid.slice(0, length)}...${txid.slice(-length)}`;
}

// ── Conversions ────────────────────────────────────────────────────────────

export function satsToBTC(sats: number): number {
  return sats / 1e8;
}

export function btcToSats(btc: number): number {
  return Math.round(btc * 1e8);
}

// ── Estimation Frais ───────────────────────────────────────────────────────

export function estimateTxFee(feeRate: number, inputCount = 1, outputCount = 2, inputType: "p2wpkh" | "p2tr" | "p2pkh" = "p2wpkh"): number {
  const sizes = {
    p2wpkh: { input: 68, output: 31 },
    p2tr: { input: 58, output: 43 },
    p2pkh: { input: 148, output: 34 },
  };
  const { input, output } = sizes[inputType];
  const overhead = 10; // version + marker + flag + locktime
  const estimatedVBytes = overhead + input * inputCount + output * outputCount;
  return Math.ceil(estimatedVBytes * feeRate);
}

export function getMempoolUsagePercent(bytes: number, maxBytes = 300 * 1024 * 1024): number {
  return Math.min(100, (bytes / maxBytes) * 100);
}

// ── Couleurs ───────────────────────────────────────────────────────────────

export function getFeeColor(fee: number): string {
  if (fee >= 100) return "#FF2D55";      // Très élevé - rouge vif
  if (fee >= 50) return "#FF4560";       // Élevé - rouge
  if (fee >= 20) return "#FFB800";       // Moyen - jaune
  if (fee >= 10) return "#F7931A";       // Normal - orange
  if (fee >= 5) return "#34C759";        // Bas - vert
  return "#00C896";                      // Très bas - vert vif
}

export function getFeeLevel(fee: number): { label: string; color: string; urgency: string } {
  if (fee >= 100) return { label: "CRITIQUE", color: "#FF2D55", urgency: "Extrême congestion" };
  if (fee >= 50) return { label: "ÉLEVÉ", color: "#FF4560", urgency: "Forte congestion" };
  if (fee >= 20) return { label: "MOYEN", color: "#FFB800", urgency: "Congestion modérée" };
  if (fee >= 10) return { label: "NORMAL", color: "#F7931A", urgency: "Trafic normal" };
  if (fee >= 5) return { label: "BAS", color: "#34C759", urgency: "Faible congestion" };
  return { label: "TRÈS BAS", color: "#00C896", urgency: "Mempool vide" };
}

export function getConfirmationTimeLabel(feeType: string): string {
  switch (feeType) {
    case "fastest": return "~10 min (prochain bloc)";
    case "halfHour": return "~30 min (3 blocs)";
    case "hour": return "~1 heure (6 blocs)";
    case "economy": return "~plusieurs heures";
    default: return "inconnu";
  }
}

// ── Générateurs ────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

// ── Mempool Analysis ───────────────────────────────────────────────────────

export function analyzeMempoolCongestion(
  mempoolInfo: { size: number; bytes: number; total_fee: number } | null,
  vBytesPerSecond: number
): {
  level: "low" | "moderate" | "high" | "critical";
  label: string;
  color: string;
  estimatedClearTime: string;
  avgFeeRate: number;
} {
  if (!mempoolInfo) {
    return { level: "low", label: "Inconnu", color: "#7B7E96", estimatedClearTime: "—", avgFeeRate: 0 };
  }

  const avgFeeRate = mempoolInfo.total_fee / mempoolInfo.bytes;
  const clearSeconds = mempoolInfo.bytes / Math.max(vBytesPerSecond, 1);

  let level: "low" | "moderate" | "high" | "critical";
  let label: string;
  let color: string;

  if (avgFeeRate >= 50) {
    level = "critical";
    label = "CRITIQUE";
    color = "#FF2D55";
  } else if (avgFeeRate >= 20) {
    level = "high";
    label = "ÉLEVÉE";
    color = "#FF4560";
  } else if (avgFeeRate >= 10) {
    level = "moderate";
    label = "MODÉRÉE";
    color = "#FFB800";
  } else {
    level = "low";
    label = "FAIBLE";
    color = "#00C896";
  }

  return {
    level,
    label,
    color,
    estimatedClearTime: formatDuration(clearSeconds),
    avgFeeRate: Math.round(avgFeeRate * 100) / 100,
  };
}

export function calculateFeePercentile(feeRate: number, histogram: Array<[number, number]>): number {
  if (!histogram.length) return 0;

  const totalVsize = histogram.reduce((sum, [, vsize]) => sum + vsize, 0);
  let cumulativeVsize = 0;

  for (const [rate, vsize] of histogram) {
    cumulativeVsize += vsize;
    if (feeRate <= rate) {
      return Math.round((cumulativeVsize / totalVsize) * 100);
    }
  }

  return 100;
}

// ── URL Helper ─────────────────────────────────────────────────────────────

export function mempoolApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_MEMPOOL_API || "https://mempool.bitdevsyde.org";
  return `${base}${path}`;
}

export function getMempoolSpaceUrl(path: string): string {
  return `https://mempool.space${path}`;
}