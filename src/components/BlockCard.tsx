// BlockCard.tsx
"use client";

import { Block } from "@/types";
import { formatTime, truncateTxid } from "@/lib/utils";
import { Box, Pickaxe, Clock, Hash } from "lucide-react";

interface BlockCardProps {
  block: Block | null;
  compact?: boolean;
}

export default function BlockCard({ block, compact = false }: BlockCardProps) {
  if (!block) {
    return (
      <div className={`bg-bitcoin-surface rounded-2xl border border-bitcoin-border animate-pulse ${compact ? "p-4" : "p-6"}`}>
        <div className={`bg-bitcoin-muted rounded-lg w-1/3 mb-4 ${compact ? "h-4" : "h-8"}`} />
        {!compact && (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-bitcoin-muted rounded-xl" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-4 hover:border-bitcoin-orange/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-bitcoin-green/10 rounded-lg flex items-center justify-center">
              <Box className="w-3.5 h-3.5 text-bitcoin-green" />
            </div>
            <span className="text-xs text-bitcoin-dim">Dernier bloc</span>
          </div>
          <span className="px-2 py-0.5 bg-bitcoin-green/10 text-bitcoin-green rounded-full text-[10px] font-bold">
            #{block.height.toLocaleString()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-bitcoin-dark/50 rounded-lg p-2 border border-bitcoin-border/50">
            <span className="text-bitcoin-dim block text-[10px]">Tx</span>
            <span className="font-mono text-bitcoin-text">{block.tx_count.toLocaleString()}</span>
          </div>
          <div className="bg-bitcoin-dark/50 rounded-lg p-2 border border-bitcoin-border/50">
            <span className="text-bitcoin-dim block text-[10px]">Pool</span>
            <span className="font-mono text-bitcoin-text truncate block">{block.extras?.pool?.name || "—"}</span>
          </div>
        </div>
        <p className="text-[10px] text-bitcoin-dim mt-2">Il y a {formatTime(block.timestamp)}</p>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-bitcoin-green/10 rounded-lg flex items-center justify-center">
              <Box className="w-4 h-4 text-bitcoin-green" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-bitcoin-text">Dernier bloc</h3>
              <p className="text-xs text-bitcoin-dim">Il y a {formatTime(block.timestamp)}</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-bitcoin-green/10 text-bitcoin-green rounded-full text-xs font-bold">
            #{block.height.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash className="w-3 h-3 text-bitcoin-dim" />
              <span className="text-xs text-bitcoin-dim">Transactions</span>
            </div>
            <p className="font-mono text-lg text-bitcoin-text">{block.tx_count.toLocaleString()}</p>
          </div>
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-bitcoin-dim" />
              <span className="text-xs text-bitcoin-dim">Taille</span>
            </div>
            <p className="font-mono text-lg text-bitcoin-text">{formatBytes(block.size)}</p>
          </div>
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Pickaxe className="w-3 h-3 text-bitcoin-dim" />
              <span className="text-xs text-bitcoin-dim">Pool</span>
            </div>
            <p className="font-mono text-sm text-bitcoin-text truncate">
              {block.extras?.pool?.name || "Inconnu"}
            </p>
          </div>
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Box className="w-3 h-3 text-bitcoin-dim" />
              <span className="text-xs text-bitcoin-dim">Frais</span>
            </div>
            <p className="font-mono text-sm text-bitcoin-orange">
              {block.extras ? ((block.extras.totalFees || 0) / 1e8).toFixed(4) : "—"} BTC
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-bitcoin-dark/30 rounded-xl border border-bitcoin-border/30">
          <p className="text-xs text-bitcoin-dim font-mono break-all">
            {truncateTxid(block.id, 16)}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}