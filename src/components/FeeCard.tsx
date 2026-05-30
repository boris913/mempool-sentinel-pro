// FeeCard.tsx
"use client";

import { RecommendedFees } from "@/types";
import { getFeeColor, getFeeLevel } from "@/lib/utils";
import { Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo } from "react";

interface FeeCardProps {
  fees: RecommendedFees | null;
  previousFees?: RecommendedFees | null;
}

// Mapping entre les clés courtes et les vraies propriétés de RecommendedFees
const feeKeyMap = {
  fastestFee: "fastestFee",
  halfHourFee: "halfHourFee",
  hourFee: "hourFee",
  economyFee: "economyFee",
} as const;

export default function FeeCard({ fees, previousFees }: FeeCardProps) {
  const feeLevel = useMemo(() => {
    if (!fees) return null;
    return getFeeLevel(fees.fastestFee);
  }, [fees]);

  const getTrend = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = current - previous;
    if (diff > 2) return <TrendingUp className="w-3 h-3 text-bitcoin-red" />;
    if (diff < -2) return <TrendingDown className="w-3 h-3 text-bitcoin-green" />;
    return <Minus className="w-3 h-3 text-bitcoin-dim" />;
  };

  if (!fees) {
    return (
      <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-6 animate-pulse">
        <div className="h-8 bg-bitcoin-muted rounded-lg w-1/3 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-bitcoin-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    { label: "Rapide", sublabel: "Prochain bloc", value: fees.fastestFee, key: "fastestFee" as const },
    { label: "Moyen", sublabel: "~30 min", value: fees.halfHourFee, key: "halfHourFee" as const },
    { label: "Normal", sublabel: "~1 heure", value: fees.hourFee, key: "hourFee" as const },
    { label: "Économique", sublabel: ">1 heure", value: fees.economyFee, key: "economyFee" as const },
  ];

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-bitcoin-orange/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-bitcoin-orange" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-bitcoin-text">Frais du marché</h3>
              <p className="text-xs text-bitcoin-dim">sat/vByte</p>
            </div>
          </div>
          {feeLevel && (
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={{ 
                color: feeLevel.color, 
                borderColor: `${feeLevel.color}40`,
                backgroundColor: `${feeLevel.color}10`
              }}
            >
              {feeLevel.label}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.key} 
              className="flex items-center justify-between p-3 rounded-xl bg-bitcoin-dark/50 border border-bitcoin-border/50 hover:border-bitcoin-orange/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-1 h-8 rounded-full"
                  style={{ backgroundColor: getFeeColor(item.value) }}
                />
                <div>
                  <p className="text-sm font-medium text-bitcoin-text">{item.label}</p>
                  <p className="text-xs text-bitcoin-dim">{item.sublabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTrend(item.value, previousFees?.[item.key])}
                <span
                  className="font-mono font-bold text-xl"
                  style={{ color: getFeeColor(item.value) }}
                >
                  {item.value}
                </span>
                <span className="text-xs text-bitcoin-dim">sat/vB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {feeLevel && (
        <div 
          className="px-6 py-3 border-t border-bitcoin-border"
          style={{ backgroundColor: `${feeLevel.color}08` }}
        >
          <p className="text-xs text-center" style={{ color: feeLevel.color }}>
            {feeLevel.urgency} — Les mineurs priorisent les transactions à {fees.fastestFee}+ sat/vB
          </p>
        </div>
      )}
    </div>
  );
}