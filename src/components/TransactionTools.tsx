"use client";

import { useState } from "react";
import { Calculator, ArrowDownUp, Baby, Info, Copy, Check } from "lucide-react";
import { formatSats, formatBTC, estimateTxFee, getFeeColor } from "@/lib/utils";
import type { RecommendedFees } from "@/types";

interface TransactionToolsProps {
  fees: RecommendedFees | null;
}

export default function TransactionTools({ fees }: TransactionToolsProps) {
  const [activeTool, setActiveTool] = useState<"estimator" | "rbf-calc" | "cpfp-calc">("estimator");
  const [inputs, setInputs] = useState(1);
  const [outputs, setOutputs] = useState(2);
  const [inputType, setInputType] = useState<"p2wpkh" | "p2tr" | "p2pkh">("p2wpkh");
  const [customFeeRate, setCustomFeeRate] = useState("");
  const [rbfCurrentFee, setRbfCurrentFee] = useState("");
  const [rbfTargetRate, setRbfTargetRate] = useState("");
  const [rbfSize, setRbfSize] = useState("");
  const [cpfpParentFee, setCpfpParentFee] = useState("");
  const [cpfpParentSize, setCpfpParentSize] = useState("");
  const [cpfpChildSize, setCpfpChildSize] = useState("");
  const [cpfpTargetRate, setCpfpTargetRate] = useState("");
  const [copied, setCopied] = useState(false);

  const getRate = () => {
    if (customFeeRate) return parseFloat(customFeeRate);
    return fees?.hourFee || 5;
  };

  const estimatedFee = estimateTxFee(getRate(), inputs, outputs, inputType);

  const rbfNewFee = () => {
    const size = parseFloat(rbfSize) || 150;
    const rate = parseFloat(rbfTargetRate) || getRate();
    return Math.ceil(size * rate);
  };

  const rbfAdditionalFee = () => {
    const current = parseFloat(rbfCurrentFee) || 0;
    return Math.max(0, rbfNewFee() - current);
  };

  const cpfpRequiredFee = () => {
    const parentFee = parseFloat(cpfpParentFee) || 0;
    const parentSize = parseFloat(cpfpParentSize) || 150;
    const childSize = parseFloat(cpfpChildSize) || 150;
    const targetRate = parseFloat(cpfpTargetRate) || getRate();
    const totalSize = parentSize + childSize;
    const totalFeeNeeded = Math.ceil(totalSize * targetRate);
    return Math.max(0, totalFeeNeeded - parentFee);
  };

  const copyResult = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-bitcoin-green/10 rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4 text-bitcoin-green" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Outils de calcul</h3>
            <p className="text-xs text-bitcoin-dim">Estimateur et calculateurs</p>
          </div>
        </div>

        <div className="flex gap-1 bg-bitcoin-dark rounded-xl p-1 mb-6">
          {[
            { id: "estimator" as const, label: "Estimateur", icon: Calculator },
            { id: "rbf-calc" as const, label: "RBF", icon: ArrowDownUp },
            { id: "cpfp-calc" as const, label: "CPFP", icon: Baby },
          ].map((tool) => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTool === tool.id ? "bg-bitcoin-green/15 text-bitcoin-green border border-bitcoin-green/30" : "text-bitcoin-dim hover:text-bitcoin-text"
              }`}>
              <tool.icon className="w-4 h-4" />
              {tool.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Fee rate (sat/vB)</label>
          <div className="flex gap-2">
            <input type="number" value={customFeeRate} onChange={(e) => setCustomFeeRate(e.target.value)} placeholder={fees?.hourFee?.toString() || "5"}
              className="flex-1 bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
            {fees && (
              <div className="flex gap-1">
                {[
                  { label: "R", value: fees.fastestFee, color: "#FF4560" },
                  { label: "M", value: fees.halfHourFee, color: "#FFB800" },
                  { label: "N", value: fees.hourFee, color: "#F7931A" },
                  { label: "E", value: fees.economyFee, color: "#00C896" },
                ].map((f) => (
                  <button key={f.label} onClick={() => setCustomFeeRate(f.value.toString())}
                    className="w-9 h-10 rounded-xl bg-bitcoin-dark border border-bitcoin-border text-xs font-mono font-bold hover:border-bitcoin-orange/50 transition-colors"
                    style={{ color: f.color }} title={`${f.label}: ${f.value} sat/vB`}>
                    {f.value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {activeTool === "estimator" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Inputs</label>
                <input type="number" min={1} max={20} value={inputs} onChange={(e) => setInputs(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Outputs</label>
                <input type="number" min={1} max={10} value={outputs} onChange={(e) => setOutputs(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Type</label>
              <div className="flex gap-2">
                {(["p2wpkh", "p2tr", "p2pkh"] as const).map((t) => (
                  <button key={t} onClick={() => setInputType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      inputType === t ? "border-bitcoin-orange bg-bitcoin-orange/10 text-bitcoin-orange" : "border-bitcoin-border text-bitcoin-dim hover:text-bitcoin-text"
                    }`}>
                    {t === "p2wpkh" ? "SegWit" : t === "p2tr" ? "Taproot" : "Legacy"}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-bitcoin-dim">Frais estimés</span>
                <button onClick={() => copyResult(estimatedFee.toString())} className="text-xs text-bitcoin-orange flex items-center gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-2xl font-mono font-bold" style={{ color: getFeeColor(getRate()) }}>
                {formatSats(estimatedFee)}
              </div>
              <div className="text-sm text-bitcoin-dim mt-1">≈ {formatBTC(estimatedFee, 8)} à {getRate()} sat/vB</div>
              <div className="text-xs text-bitcoin-dim mt-2">Taille: ~{estimateTxFee(getRate(), inputs, outputs, inputType) / getRate()} vBytes ({inputType})</div>
            </div>
          </div>
        )}

        {activeTool === "rbf-calc" && (
          <div className="space-y-4">
            <div className="bg-bitcoin-yellow/10 border border-bitcoin-yellow/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-bitcoin-yellow mt-0.5 shrink-0" />
                <p className="text-xs text-bitcoin-yellow leading-relaxed">Le RBF nécessite un fee rate supérieur et des frais absolus couvrant le relay fee.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Frais actuels (sats)</label>
                <input type="number" value={rbfCurrentFee} onChange={(e) => setRbfCurrentFee(e.target.value)} placeholder="1500"
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Taille (vB)</label>
                <input type="number" value={rbfSize} onChange={(e) => setRbfSize(e.target.value)} placeholder="150"
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Fee rate cible</label>
              <input type="number" value={rbfTargetRate} onChange={(e) => setRbfTargetRate(e.target.value)} placeholder={getRate().toString()}
                className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border space-y-2">
              <div className="flex justify-between text-sm"><span className="text-bitcoin-dim">Nouveaux frais</span><span className="font-mono font-bold text-bitcoin-text">{formatSats(rbfNewFee())}</span></div>
              <div className="flex justify-between text-sm"><span className="text-bitcoin-dim">Additionnels</span><span className="font-mono font-bold text-bitcoin-yellow">{formatSats(rbfAdditionalFee())}</span></div>
              <div className="flex justify-between text-sm"><span className="text-bitcoin-dim">Nouveau rate</span><span className="font-mono font-bold" style={{ color: getFeeColor(parseFloat(rbfTargetRate) || getRate()) }}>{rbfTargetRate || getRate()} sat/vB</span></div>
            </div>
          </div>
        )}

        {activeTool === "cpfp-calc" && (
          <div className="space-y-4">
            <div className="bg-bitcoin-blue/10 border border-bitcoin-blue/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-bitcoin-blue mt-0.5 shrink-0" />
                <p className="text-xs text-bitcoin-blue leading-relaxed">Le CPFP calcule le fee rate combiné du package. Les mineurs trient par package rate.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Frais parent</label>
                <input type="number" value={cpfpParentFee} onChange={(e) => setCpfpParentFee(e.target.value)} placeholder="500"
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Taille parent</label>
                <input type="number" value={cpfpParentSize} onChange={(e) => setCpfpParentSize(e.target.value)} placeholder="150"
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Taille enfant</label>
                <input type="number" value={cpfpChildSize} onChange={(e) => setCpfpChildSize(e.target.value)} placeholder="110"
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
              <div>
                <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Rate cible</label>
                <input type="number" value={cpfpTargetRate} onChange={(e) => setCpfpTargetRate(e.target.value)} placeholder={getRate().toString()}
                  className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              </div>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border space-y-2">
              <div className="flex justify-between text-sm"><span className="text-bitcoin-dim">Rate parent actuel</span><span className="font-mono text-bitcoin-red">{cpfpParentSize ? (parseFloat(cpfpParentFee || "0") / parseFloat(cpfpParentSize)).toFixed(1) : "0"} sat/vB</span></div>
              <div className="flex justify-between text-sm"><span className="text-bitcoin-dim">Frais enfant requis</span><span className="font-mono font-bold text-bitcoin-blue">{formatSats(cpfpRequiredFee())}</span></div>
              <div className="flex justify-between text-sm"><span className="text-bitcoin-dim">Rate package</span><span className="font-mono font-bold" style={{ color: getFeeColor(parseFloat(cpfpTargetRate) || getRate()) }}>{cpfpTargetRate || getRate()} sat/vB</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
