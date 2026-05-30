// RecentBlocks.tsx
"use client";

import { Block } from "@/types";
import { formatTime, formatBytes } from "@/lib/utils";
import { History, Pickaxe } from "lucide-react";

interface RecentBlocksProps {
  blocks: Block[];
}

export default function RecentBlocks({ blocks }: RecentBlocksProps) {
  if (!blocks.length) {
    return (
      <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-6 animate-pulse">
        <div className="h-8 bg-bitcoin-muted rounded-lg w-1/3 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-bitcoin-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-4 border-b border-bitcoin-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-bitcoin-blue/10 rounded-lg flex items-center justify-center">
            <History className="w-4 h-4 text-bitcoin-blue" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Blocs récents</h3>
            <p className="text-xs text-bitcoin-dim">{blocks.length} derniers blocs</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-bitcoin-dim border-b border-bitcoin-border">
              <th className="px-4 py-2 text-xs uppercase tracking-wider">Hauteur</th>
              <th className="px-4 py-2 text-xs uppercase tracking-wider">Pool</th>
              <th className="px-4 py-2 text-xs uppercase tracking-wider">Tx</th>
              <th className="px-4 py-2 text-xs uppercase tracking-wider">Taille</th>
              <th className="px-4 py-2 text-xs uppercase tracking-wider">Frais</th>
              <th className="px-4 py-2 text-xs uppercase tracking-wider">Il y a</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr 
                key={block.id} 
                className="border-t border-bitcoin-border/50 hover:bg-bitcoin-border/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-bitcoin-text">
                  #{block.height.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Pickaxe className="w-3 h-3 text-bitcoin-dim" />
                    <span className="text-bitcoin-text text-sm">{block.extras?.pool?.name || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{block.tx_count.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-bitcoin-dim text-sm">{formatBytes(block.size)}</td>
                <td className="px-4 py-3 font-mono text-bitcoin-orange text-sm">
                  {block.extras ? ((block.extras.totalFees || 0) / 1e8).toFixed(4) : "—"} BTC
                </td>
                <td className="px-4 py-3 text-bitcoin-dim text-sm">{formatTime(block.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}