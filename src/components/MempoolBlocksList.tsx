// MempoolBlocksList.tsx
"use client";

import { MempoolBlock } from "@/types";
import { formatBTC, getFeeColor } from "@/lib/utils";
import { Layers } from "lucide-react";

interface MempoolBlocksListProps {
  blocks: MempoolBlock[];
}

export default function MempoolBlocksList({ blocks }: MempoolBlocksListProps) {
  if (!blocks.length) {
    return (
      <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-12 text-center text-bitcoin-dim">
        <Layers className="w-8 h-8 mx-auto mb-3 text-bitcoin-dim/50" />
        <p>Chargement des blocs projetés...</p>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6 border-b border-bitcoin-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-bitcoin-purple/10 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-bitcoin-purple" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Blocs projetés</h3>
            <p className="text-xs text-bitcoin-dim">{blocks.length} blocs estimés depuis le mempool</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-bitcoin-dim border-b border-bitcoin-border">
              <th className="px-6 py-3 text-xs uppercase tracking-wider font-medium">Position</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider font-medium">Taille (vB)</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider font-medium">Transactions</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider font-medium">Frais totaux</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider font-medium">Fee médian</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider font-medium">Fourchette</th>
              <th className="px-6 py-3 text-xs uppercase tracking-wider font-medium">Remplissage</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block, idx) => {
              const medianFee = block.medianFee;
              const feeColor = getFeeColor(medianFee);
              const fillPercent = (block.blockVSize / 1000000) * 100;

              return (
                <tr 
                  key={idx} 
                  className="border-t border-bitcoin-border/50 hover:bg-bitcoin-border/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-bitcoin-dark border border-bitcoin-border flex items-center justify-center text-xs font-mono text-bitcoin-dim">
                        {idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] bg-bitcoin-green/20 text-bitcoin-green px-1.5 py-0.5 rounded font-medium">Prochain</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-bitcoin-text">{block.blockVSize.toLocaleString()}</td>
                  <td className="px-6 py-4 text-bitcoin-text">{block.nTx.toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-bitcoin-orange">{formatBTC(block.totalFees, 6)}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold" style={{ color: feeColor }}>
                      {medianFee.toFixed(1)}
                    </span>
                    <span className="text-xs text-bitcoin-dim ml-1">sat/vB</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-bitcoin-dim text-xs">
                    {block.feeRange[0]} – {block.feeRange[block.feeRange.length - 1]}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-bitcoin-dark rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(fillPercent, 100)}%`,
                            backgroundColor: feeColor
                          }}
                        />
                      </div>
                      <span className="text-xs text-bitcoin-dim">{Math.min(fillPercent, 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}