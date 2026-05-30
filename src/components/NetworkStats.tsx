// NetworkStats.tsx
"use client";

import { DifficultyAdjustment, HashrateInfo, PriceInfo } from "@/types";
import { formatDifficulty, formatHashrate, formatDuration, formatUSD, formatEUR } from "@/lib/utils";
import { Activity, TrendingUp, TrendingDown, Minus, DollarSign, Pickaxe } from "lucide-react";

interface NetworkStatsProps {
  difficultyAdjustment: DifficultyAdjustment | null;
  hashrateInfo: HashrateInfo | null;
  priceInfo: PriceInfo | null;
  latestBlock: { timestamp: number; height: number } | null;
}

export default function NetworkStats({ difficultyAdjustment, hashrateInfo, priceInfo, latestBlock }: NetworkStatsProps) {
  const getDifficultyTrend = () => {
    if (!difficultyAdjustment) return null;
    const change = difficultyAdjustment.difficultyChange;
    if (change > 2) return { icon: TrendingUp, color: "text-bitcoin-green", label: `+${change.toFixed(1)}%` };
    if (change < -2) return { icon: TrendingDown, color: "text-bitcoin-red", label: `${change.toFixed(1)}%` };
    return { icon: Minus, color: "text-bitcoin-dim", label: `${change.toFixed(1)}%` };
  };

  const diffTrend = getDifficultyTrend();

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-bitcoin-green/10 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-bitcoin-green" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Réseau Bitcoin</h3>
            <p className="text-xs text-bitcoin-dim">Métriques on-chain en temps réel</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Hashrate */}
          <div className="bg-bitcoin-dark/50 rounded-xl p-4 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Pickaxe className="w-3 h-3 text-bitcoin-orange" />
              <span className="text-xs text-bitcoin-dim">Hashrate</span>
            </div>
            <p className="font-mono text-lg text-bitcoin-text">
              {hashrateInfo ? formatHashrate(hashrateInfo.hashrate) : "—"}
            </p>
            <p className="text-xs text-bitcoin-dim mt-1">
              {hashrateInfo ? `Difficulté: ${formatDifficulty(hashrateInfo.currentDifficulty)}` : ""}
            </p>
          </div>

          {/* Difficulty Adjustment */}
          <div className="bg-bitcoin-dark/50 rounded-xl p-4 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3 h-3 text-bitcoin-blue" />
              <span className="text-xs text-bitcoin-dim">Ajustement diff.</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg text-bitcoin-text">
                {difficultyAdjustment ? `${difficultyAdjustment.difficultyChange > 0 ? "+" : ""}${difficultyAdjustment.difficultyChange.toFixed(1)}%` : "—"}
              </p>
              {diffTrend && <diffTrend.icon className={`w-4 h-4 ${diffTrend.color}`} />}
            </div>
            <p className="text-xs text-bitcoin-dim mt-1">
              {difficultyAdjustment ? `Dans ${difficultyAdjustment.remainingBlocks} blocs` : ""}
            </p>
          </div>

          {/* BTC Price */}
          <div className="bg-bitcoin-dark/50 rounded-xl p-4 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3 h-3 text-bitcoin-green" />
              <span className="text-xs text-bitcoin-dim">Prix BTC</span>
            </div>
            <p className="font-mono text-lg text-bitcoin-text">
              {priceInfo ? formatUSD(priceInfo.USD) : "—"}
            </p>
            <p className="text-xs text-bitcoin-dim mt-1">
              {priceInfo ? formatEUR(priceInfo.EUR) : ""}
            </p>
          </div>

          {/* Block Time */}
          <div className="bg-bitcoin-dark/50 rounded-xl p-4 border border-bitcoin-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-3 h-3 text-bitcoin-purple" />
              <span className="text-xs text-bitcoin-dim">Temps moyen</span>
            </div>
            <p className="font-mono text-lg text-bitcoin-text">
              {difficultyAdjustment ? formatDuration(difficultyAdjustment.timeAvg / 1000) : "—"}
            </p>
            <p className="text-xs text-bitcoin-dim mt-1">
              {difficultyAdjustment ? `Cible: 10 min` : ""}
            </p>
          </div>
        </div>

        {/* Difficulty Progress Bar */}
        {difficultyAdjustment && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-bitcoin-dim">Progression de l'ère</span>
              <span className="font-mono text-bitcoin-text">{difficultyAdjustment.progressPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-bitcoin-dark rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-bitcoin-orange transition-all duration-500"
                style={{ width: `${difficultyAdjustment.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-bitcoin-dim mt-1.5 text-center">
              Prochain ajustement estimé: {new Date(difficultyAdjustment.estimatedRetargetDate * 1000).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}