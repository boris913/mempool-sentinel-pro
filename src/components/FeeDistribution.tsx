"use client";

import { FeeDistribution as FeeDistType } from "@/types";
import { getFeeColor } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface FeeDistributionProps {
  distribution: FeeDistType | null;
  mempoolInfo: { size: number; bytes: number } | null;
}

export default function FeeDistribution({ distribution, mempoolInfo }: FeeDistributionProps) {
  if (!distribution || !mempoolInfo) {
    return (
      <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-6 animate-pulse">
        <div className="h-8 bg-bitcoin-muted rounded-lg w-1/3 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-bitcoin-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalVsize = mempoolInfo.bytes;

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-bitcoin-yellow/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-bitcoin-yellow" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Distribution des frais</h3>
            <p className="text-xs text-bitcoin-dim">Répartition des transactions par fee rate</p>
          </div>
        </div>

        <div className="space-y-3">
          {distribution.ranges.map((range, idx) => {
            const percent = (range.vsize / totalVsize) * 100;
            const label = range.max === Infinity 
              ? `${range.min}+ sat/vB` 
              : `${range.min}-${range.max} sat/vB`;
            const color = getFeeColor(range.min);

            return (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-bitcoin-dim">{label}</span>
                  <span className="font-mono text-bitcoin-text">{percent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-bitcoin-dark rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percent, 0.5)}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-[10px] text-bitcoin-dim mt-0.5">{range.count.toLocaleString()} tx — {(range.vsize / 1e6).toFixed(2)} MvB</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
