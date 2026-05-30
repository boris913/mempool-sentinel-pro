// FeeChart.tsx
"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FeeHistoryPoint } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo } from "react";

interface FeeChartProps {
  feeHistory: FeeHistoryPoint[];
}

export default function FeeChart({ feeHistory }: FeeChartProps) {
  if (feeHistory.length === 0) {
    return (
      <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-6 h-[400px] flex items-center justify-center text-bitcoin-dim">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-bitcoin-dim/50" />
          <p>Collecte des données en cours...</p>
        </div>
      </div>
    );
  }

  const data = feeHistory.map((p) => ({
    time: new Date(p.time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    rapide: p.fastest,
    moyen: p.halfHour,
    normal: p.hour,
    eco: p.economy,
  }));

  const current = feeHistory[feeHistory.length - 1];
  const firstPoint = feeHistory[0];
  
  const trend = useMemo(() => {
    if (feeHistory.length < 2) return 0;
    return current.fastest - firstPoint.fastest;
  }, [current, firstPoint, feeHistory.length]);

  const trendPercent = useMemo(() => {
    if (!firstPoint || firstPoint.fastest === 0 || feeHistory.length < 2) return 0;
    return ((current.fastest - firstPoint.fastest) / firstPoint.fastest) * 100;
  }, [current, firstPoint, feeHistory.length]);

  // Calculer le domaine Y pour un meilleur scaling
  const allValues = feeHistory.flatMap(p => [p.fastest, p.halfHour, p.hour, p.economy]);
  const minValue = Math.min(...allValues) * 0.8;
  const maxValue = Math.max(...allValues) * 1.2;

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border p-6 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-bitcoin-orange/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-bitcoin-orange" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Évolution des frais</h3>
            <p className="text-xs text-bitcoin-dim">{feeHistory.length} points • {feeHistory.length > 1 ? Math.round((feeHistory[feeHistory.length - 1].time - feeHistory[0].time) / 60000) : 0} min</p>
          </div>
        </div>
        <div className={`text-sm font-mono flex items-center gap-1 px-3 py-1.5 rounded-lg ${
          trend > 0 ? "text-bitcoin-red bg-bitcoin-red/10" : 
          trend < 0 ? "text-bitcoin-green bg-bitcoin-green/10" : 
          "text-bitcoin-dim bg-bitcoin-border/30"
        }`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend > 0 ? "+" : ""}{trend.toFixed(2)} ({trendPercent > 0 ? "+" : ""}{trendPercent.toFixed(1)}%)
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradRapide" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4560" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FF4560" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradMoyen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB800" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F7931A" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradEco" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C896" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#00C896" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#2A2D40" 
              tick={{ fill: "#7B7E96", fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              stroke="#2A2D40" 
              tick={{ fill: "#7B7E96", fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
              width={45}
              domain={[Math.max(0, minValue), maxValue]}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#13141C",
                borderColor: "#1E2030",
                borderRadius: 12,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                border: "1px solid #1E2030",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "#E8E9F0", marginBottom: 8 }}
              itemStyle={{ fontSize: 11 }}
            />
            <Area type="monotone" dataKey="rapide" stroke="#FF4560" strokeWidth={2} fill="url(#gradRapide)" dot={false} name="Rapide" />
            <Area type="monotone" dataKey="moyen" stroke="#FFB800" strokeWidth={2} fill="url(#gradMoyen)" dot={false} name="Moyen" />
            <Area type="monotone" dataKey="normal" stroke="#F7931A" strokeWidth={1.5} fill="url(#gradNormal)" dot={false} name="Normal" />
            <Area type="monotone" dataKey="eco" stroke="#00C896" strokeWidth={1.5} fill="url(#gradEco)" dot={false} name="Éco" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-3 shrink-0">
        {[
          { label: "Rapide", color: "#FF4560", value: current.fastest },
          { label: "Moyen", color: "#FFB800", value: current.halfHour },
          { label: "Normal", color: "#F7931A", value: current.hour },
          { label: "Éco", color: "#00C896", value: current.economy },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-bitcoin-dim">{item.label}</span>
            <span className="text-xs font-mono text-bitcoin-text">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}