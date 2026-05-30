// FeeEstimatorCard.tsx
"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { estimateTxFee, formatSats, getFeeColor } from "@/lib/utils";
import type { RecommendedFees } from "@/types";

interface FeeEstimatorCardProps {
  fees: RecommendedFees | null;
}

export default function FeeEstimatorCard({ fees }: FeeEstimatorCardProps) {
  const [txSize, setTxSize] = useState("142");
  const [selectedPreset, setSelectedPreset] = useState<"fastest" | "halfHour" | "hour" | "economy">("halfHour");

  if (!fees) return null;

  const presets = {
    fastest: { label: "Rapide", rate: fees.fastestFee, time: "~10 min" },
    halfHour: { label: "Moyen", rate: fees.halfHourFee, time: "~30 min" },
    hour: { label: "Normal", rate: fees.hourFee, time: "~1h" },
    economy: { label: "Éco", rate: fees.economyFee, time: ">1h" },
  };

  const current = presets[selectedPreset];
  const estimatedFee = Math.ceil(parseInt(txSize || "142") * current.rate);

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-bitcoin-orange" />
        <h3 className="font-display font-semibold text-bitcoin-text">Estimateur rapide</h3>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Taille transaction (vBytes)</label>
        <input
          type="number"
          value={txSize}
          onChange={(e) => setTxSize(e.target.value)}
          className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono"
        />
        <p className="text-xs text-bitcoin-dim mt-1">P2WPKH: ~110-142 vB | P2TR: ~120-154 vB</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {(Object.keys(presets) as Array<keyof typeof presets>).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedPreset(key)}
            className={`p-2 rounded-xl border text-center transition-all ${
              selectedPreset === key
                ? "border-bitcoin-orange bg-bitcoin-orange/10"
                : "border-bitcoin-border hover:border-bitcoin-orange/30"
            }`}
          >
            <div className="text-[10px] text-bitcoin-dim">{presets[key].label}</div>
            <div className="font-mono font-bold text-sm" style={{ color: getFeeColor(presets[key].rate) }}>
              {presets[key].rate}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-bitcoin-dim">Frais estimés</p>
            <p className="text-2xl font-mono font-bold" style={{ color: getFeeColor(current.rate) }}>
              {formatSats(estimatedFee)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-bitcoin-dim">{current.time}</p>
            <p className="text-sm font-mono text-bitcoin-text">{current.rate} sat/vB</p>
          </div>
        </div>
      </div>
    </div>
  );
}