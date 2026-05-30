"use client";

import { MempoolInfo } from "@/types";
import { getMempoolUsagePercent, formatBytes, formatVBytes, formatSats, analyzeMempoolCongestion } from "@/lib/utils";
import { Database, ArrowDown, ArrowUp, Gauge } from "lucide-react";

interface MempoolStatsCardProps {
  mempoolInfo: MempoolInfo | null;
  vBytesPerSecond: number;
}

export default function MempoolStatsCard({ mempoolInfo, vBytesPerSecond }: MempoolStatsCardProps) {
  if (!mempoolInfo) {
    return (
      <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-6 animate-pulse">
        <div className="h-8 bg-bitcoin-muted rounded-lg w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-bitcoin-muted rounded-lg" />
          <div className="h-24 bg-bitcoin-muted rounded-xl" />
          <div className="h-4 bg-bitcoin-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const usagePercent = getMempoolUsagePercent(mempoolInfo.bytes);
  const maxMempoolMB = mempoolInfo.maxmempool / (1024 * 1024);
  const currentMB = mempoolInfo.bytes / (1024 * 1024);
  const analysis = analyzeMempoolCongestion(mempoolInfo, vBytesPerSecond);

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-bitcoin-blue/10 rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-bitcoin-blue" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Mempool</h3>
            <p className="text-xs text-bitcoin-dim">{mempoolInfo.size.toLocaleString()} transactions en attente</p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-bitcoin-dim">Utilisation mémoire</span>
            <span className="font-mono text-bitcoin-text">
              {currentMB.toFixed(0)} / {maxMempoolMB.toFixed(0)} MB
            </span>
          </div>
          <div className="w-full bg-bitcoin-dark rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 relative"
              style={{ 
                width: `${usagePercent}%`,
                backgroundColor: analysis.color
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-bitcoin-dim">{usagePercent.toFixed(1)}% plein</span>
            <span style={{ color: analysis.color }} className="font-medium">{analysis.label}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDown className="w-3 h-3 text-bitcoin-green" />
              <span className="text-xs text-bitcoin-dim">Entrée</span>
            </div>
            <p className="font-mono text-sm text-bitcoin-green">{formatVBytes(vBytesPerSecond)}</p>
          </div>
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUp className="w-3 h-3 text-bitcoin-orange" />
              <span className="text-xs text-bitcoin-dim">Frais totaux</span>
            </div>
            <p className="font-mono text-sm text-bitcoin-orange">{formatSats(mempoolInfo.total_fee)}</p>
          </div>
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge className="w-3 h-3 text-bitcoin-yellow" />
              <span className="text-xs text-bitcoin-dim">Fee moyen</span>
            </div>
            <p className="font-mono text-sm text-bitcoin-yellow">
              {analysis.avgFeeRate.toFixed(1)} sat/vB
            </p>
          </div>
          <div className="bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Database className="w-3 h-3 text-bitcoin-blue" />
              <span className="text-xs text-bitcoin-dim">Min relay fee</span>
            </div>
            <p className="font-mono text-sm text-bitcoin-blue">
              {mempoolInfo.mempoolminfee.toFixed(2)} sat/vB
            </p>
          </div>
        </div>
      </div>

      {analysis.estimatedClearTime !== "—" && (
        <div 
          className="px-6 py-3 border-t border-bitcoin-border"
          style={{ backgroundColor: `${analysis.color}08` }}
        >
          <p className="text-xs text-center" style={{ color: analysis.color }}>
            Temps estimé pour vider le mempool : ~{analysis.estimatedClearTime}
          </p>
        </div>
      )}
    </div>
  );
}
