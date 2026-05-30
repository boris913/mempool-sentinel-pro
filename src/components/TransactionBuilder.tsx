"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  ArrowRightLeft, RefreshCw, Baby, Info, Copy, Check, AlertTriangle,
  Send, ChevronDown, ChevronUp, Wallet, Loader2, Trash2, Plus
} from "lucide-react";
import { 
  formatSats, formatBTC, estimateTxFee, getFeeColor, truncateAddress,
  mempoolApiUrl, generateId
} from "@/lib/utils";
import type { RecommendedFees, Transaction, UTXO } from "@/types";

type TxType = "standard" | "rbf" | "cpfp";

interface TransactionBuilderProps {
  fees: RecommendedFees | null;
}

interface BuiltTx {
  id: string;
  type: TxType;
  inputs: { txid: string; vout: number; value: number; address: string }[];
  outputs: { address: string; value: number }[];
  fee: number;
  feeRate: number;
  totalSize: number;
  psbtBase64?: string;
  parentTxid?: string;
  originalFeeRate?: number;
}

export default function TransactionBuilder({ fees }: TransactionBuilderProps) {
  const [activeTab, setActiveTab] = useState<TxType>("standard");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [selectedUtxos, setSelectedUtxos] = useState<Set<string>>(new Set());
  const [loadingUtxos, setLoadingUtxos] = useState(false);
  const [builtTx, setBuiltTx] = useState<BuiltTx | null>(null);
  const [feeRate, setFeeRate] = useState<number | null>(null);
  const [customFeeRate, setCustomFeeRate] = useState("");
  const [useCustomFee, setUseCustomFee] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rbfOriginalTxid, setRbfOriginalTxid] = useState("");
  const [rbfOriginalFeeRate, setRbfOriginalFeeRate] = useState("");
  const [cpfpParentTxid, setCpfpParentTxid] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputType, setInputType] = useState<"p2wpkh" | "p2tr" | "p2pkh">("p2wpkh");
  const [isBuilding, setIsBuilding] = useState(false);

  const fetchUtxos = useCallback(async () => {
    if (!senderAddress || !senderAddress.match(/^(bc1|1|3)/)) return;
    setLoadingUtxos(true);
    try {
      const res = await fetch(mempoolApiUrl(`/api/address/${senderAddress}/utxo`));
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUtxos(data);
      setSelectedUtxos(new Set(data.map((u: UTXO) => `${u.txid}:${u.vout}`)));
    } catch {
      setUtxos([]);
    } finally {
      setLoadingUtxos(false);
    }
  }, [senderAddress]);

  useEffect(() => { if (senderAddress) fetchUtxos(); }, [senderAddress, fetchUtxos]);

  const selectedUtxoList = utxos.filter(u => selectedUtxos.has(`${u.txid}:${u.vout}`));
  const totalSelected = selectedUtxoList.reduce((sum, u) => sum + u.value, 0);

  const getEffectiveFeeRate = useCallback(() => {
    if (useCustomFee && customFeeRate) return parseFloat(customFeeRate);
    if (feeRate !== null) return feeRate;
    return fees?.hourFee ?? 5;
  }, [useCustomFee, customFeeRate, feeRate, fees]);

  const buildTransaction = useCallback(() => {
    const rate = getEffectiveFeeRate();
    const amt = Math.floor(parseFloat(amount) * 1e8);
    if (!amt || amt <= 0 || !recipient || selectedUtxoList.length === 0) return;

    const estimatedFee = estimateTxFee(rate, selectedUtxoList.length, 2, inputType);
    if (totalSelected < amt + estimatedFee) return;

    const change = totalSelected - amt - estimatedFee;
    const tx: BuiltTx = {
      id: generateId(),
      type: "standard",
      inputs: selectedUtxoList.map(u => ({
        txid: u.txid, vout: u.vout, value: u.value, address: senderAddress,
      })),
      outputs: [{ address: recipient, value: amt }],
      fee: estimatedFee,
      feeRate: rate,
      totalSize: Math.ceil(estimatedFee / rate),
    };

    if (change > 546) tx.outputs.push({ address: senderAddress, value: change });
    tx.psbtBase64 = generatePseudoPsbt(tx);
    setBuiltTx(tx);
  }, [amount, recipient, selectedUtxoList, totalSelected, senderAddress, getEffectiveFeeRate, inputType]);

  const buildRBF = useCallback(async () => {
    if (!rbfOriginalTxid || !rbfOriginalFeeRate) return;
    setIsBuilding(true);
    try {
      const originalRate = parseFloat(rbfOriginalFeeRate);
      const newRate = Math.max(Math.ceil(originalRate * 1.5), getEffectiveFeeRate());

      const res = await fetch(mempoolApiUrl(`/api/tx/${rbfOriginalTxid}`));
      if (!res.ok) throw new Error("Not found");
      const originalTx: Transaction = await res.json();

      const inputCount = originalTx.vin.length;
      const outputCount = originalTx.vout.length;
      const estimatedVBytes = 10 + 68 * inputCount + 31 * outputCount;
      const newFee = Math.ceil(estimatedVBytes * newRate);
      const totalIn = originalTx.vin.reduce((sum, vin) => sum + (vin.prevout?.value || 0), 0);
      const totalOut = originalTx.vout.reduce((sum, vout) => sum + vout.value, 0);
      const originalFee = totalIn - totalOut;

      const tx: BuiltTx = {
        id: generateId(), type: "rbf",
        inputs: originalTx.vin.map(vin => ({
          txid: vin.txid, vout: vin.vout, value: vin.prevout?.value || 0, address: vin.prevout?.scriptpubkey_address || "",
        })),
        outputs: originalTx.vout.map(vout => ({
          address: vout.scriptpubkey_address || "", value: vout.value,
        })),
        fee: newFee, feeRate: newRate, totalSize: estimatedVBytes,
        parentTxid: rbfOriginalTxid, originalFeeRate: originalRate,
      };

      const feeDiff = newFee - originalFee;
      const changeIdx = tx.outputs.findIndex(o => o.address === senderAddress);
      if (changeIdx >= 0 && tx.outputs[changeIdx].value > feeDiff + 546) {
        tx.outputs[changeIdx].value -= feeDiff;
      }

      tx.psbtBase64 = generatePseudoPsbt(tx);
      setBuiltTx(tx);
    } catch {
      alert("Erreur lors de la récupération de la transaction");
    } finally {
      setIsBuilding(false);
    }
  }, [rbfOriginalTxid, rbfOriginalFeeRate, getEffectiveFeeRate, senderAddress]);

  const buildCPFP = useCallback(async () => {
    if (!cpfpParentTxid || !senderAddress) return;
    setIsBuilding(true);
    try {
      const res = await fetch(mempoolApiUrl(`/api/tx/${cpfpParentTxid}`));
      if (!res.ok) throw new Error("Not found");
      const parentTx: Transaction = await res.json();

      const spendableOutput = parentTx.vout.find(v => v.scriptpubkey_address === senderAddress);
      if (!spendableOutput) {
        alert("Aucune sortie dépensable trouvée"); return;
      }

      const rate = Math.max(getEffectiveFeeRate() * 2, 20);
      const childVBytes = 10 + 68 + 31;
      const parentVBytes = parentTx.weight / 4;
      const totalVBytes = parentVBytes + childVBytes;
      const totalFeeNeeded = Math.ceil(totalVBytes * rate);
      const childFee = Math.max(Math.ceil(childVBytes * rate), totalFeeNeeded - (parentTx.fee || 0));
      const recipientAddr = recipient || senderAddress;
      const amt = Math.max(0, spendableOutput.value - childFee);

      if (amt <= 546) { alert("Montant restant trop faible (dust)"); return; }

      const tx: BuiltTx = {
        id: generateId(), type: "cpfp",
        inputs: [{ txid: cpfpParentTxid, vout: parentTx.vout.indexOf(spendableOutput), value: spendableOutput.value, address: senderAddress }],
        outputs: [{ address: recipientAddr, value: amt }],
        fee: childFee, feeRate: rate, totalSize: childVBytes,
        parentTxid: cpfpParentTxid,
      };

      tx.psbtBase64 = generatePseudoPsbt(tx);
      setBuiltTx(tx);
    } catch {
      alert("Erreur lors de la récupération");
    } finally {
      setIsBuilding(false);
    }
  }, [cpfpParentTxid, senderAddress, recipient, getEffectiveFeeRate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const feePresets = [
    { key: "fastest", label: "Rapide", rate: fees?.fastestFee || 0, time: "~10 min" },
    { key: "halfHour", label: "Moyen", rate: fees?.halfHourFee || 0, time: "~30 min" },
    { key: "hour", label: "Normal", rate: fees?.hourFee || 0, time: "~1h" },
    { key: "economy", label: "Économique", rate: fees?.economyFee || 0, time: ">1h" },
  ];

  return (
    <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-bitcoin-orange/10 rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-bitcoin-orange" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text">Constructeur de transactions</h3>
            <p className="text-xs text-bitcoin-dim">Standard, RBF et CPFP</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bitcoin-dark rounded-xl p-1 mb-6">
          {[
            { id: "standard" as TxType, label: "Standard", icon: ArrowRightLeft },
            { id: "rbf" as TxType, label: "RBF", icon: RefreshCw },
            { id: "cpfp" as TxType, label: "CPFP", icon: Baby },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setBuiltTx(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-bitcoin-orange/15 text-bitcoin-orange border border-bitcoin-orange/30"
                  : "text-bitcoin-dim hover:text-bitcoin-text"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sender */}
        <div className="mb-4">
          <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Adresse expéditeur</label>
          <input
            type="text" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)}
            placeholder="bc1q..."
            className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono"
          />
          {loadingUtxos && <p className="text-xs text-bitcoin-dim mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Chargement UTXOs...</p>}
        </div>

        {/* UTXOs */}
        {utxos.length > 0 && activeTab === "standard" && (
          <div className="mb-4 bg-bitcoin-dark/50 rounded-xl p-3 border border-bitcoin-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-bitcoin-dim uppercase tracking-wider">UTXOs ({utxos.length})</span>
              <span className="text-xs text-bitcoin-orange font-mono">Total: {formatSats(totalSelected)}</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {utxos.map((utxo) => (
                <label key={`${utxo.txid}:${utxo.vout}`} className="flex items-center gap-2 p-2 hover:bg-bitcoin-border/30 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={selectedUtxos.has(`${utxo.txid}:${utxo.vout}`)} onChange={(e) => {
                    const key = `${utxo.txid}:${utxo.vout}`;
                    setSelectedUtxos(prev => { const next = new Set(prev); e.target.checked ? next.add(key) : next.delete(key); return next; });
                  }} className="accent-bitcoin-orange rounded" />
                  <span className="font-mono text-xs text-bitcoin-text flex-1">{truncateAddress(utxo.txid, 6)}:{utxo.vout}</span>
                  <span className="font-mono text-xs text-bitcoin-green">{formatSats(utxo.value)}</span>
                  {utxo.status.confirmed ? (
                    <span className="text-[10px] bg-bitcoin-green/20 text-bitcoin-green px-1.5 rounded">✓</span>
                  ) : (
                    <span className="text-[10px] bg-bitcoin-yellow/20 text-bitcoin-yellow px-1.5 rounded">mp</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* RBF */}
        {activeTab === "rbf" && (
          <div className="space-y-3 mb-4">
            <div className="bg-bitcoin-yellow/10 border border-bitcoin-yellow/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-bitcoin-yellow mt-0.5 shrink-0" />
                <p className="text-xs text-bitcoin-yellow leading-relaxed">
                  Replace-By-Fee remplace une transaction non confirmée par une version à frais supérieurs. 
                  La tx originale doit avoir le flag RBF (sequence &lt; 0xFFFFFFFE).
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">TXID à remplacer</label>
              <input type="text" value={rbfOriginalTxid} onChange={(e) => setRbfOriginalTxid(e.target.value)} placeholder="abcd1234..."
                className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Fee rate actuel (sat/vB)</label>
              <input type="number" value={rbfOriginalFeeRate} onChange={(e) => setRbfOriginalFeeRate(e.target.value)} placeholder="5"
                className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
            </div>
          </div>
        )}

        {/* CPFP */}
        {activeTab === "cpfp" && (
          <div className="space-y-3 mb-4">
            <div className="bg-bitcoin-blue/10 border border-bitcoin-blue/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-bitcoin-blue mt-0.5 shrink-0" />
                <p className="text-xs text-bitcoin-blue leading-relaxed">
                  Child-Pays-For-Parent accélère une tx bloquée en créant une tx enfant avec des frais élevés. 
                  Les mineurs évaluent le fee rate du package entier (parent + enfant).
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">TXID parent bloqué</label>
              <input type="text" value={cpfpParentTxid} onChange={(e) => setCpfpParentTxid(e.target.value)} placeholder="abcd1234..."
                className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
            </div>
          </div>
        )}

        {/* Recipient / Amount */}
        {activeTab !== "rbf" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Destinataire</label>
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="bc1q..."
                className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Montant (BTC)</label>
              <input type="number" step="0.00000001" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.001"
                className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
            </div>
          </div>
        )}

        {/* Input Type */}
        {activeTab === "standard" && (
          <div className="mb-4">
            <label className="block text-xs text-bitcoin-dim uppercase tracking-wider mb-1.5">Type d'adresse</label>
            <div className="flex gap-2">
              {(["p2wpkh", "p2tr", "p2pkh"] as const).map((t) => (
                <button key={t} onClick={() => setInputType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    inputType === t ? "border-bitcoin-orange bg-bitcoin-orange/10 text-bitcoin-orange" : "border-bitcoin-border text-bitcoin-dim hover:text-bitcoin-text"
                  }`}>
                  {t === "p2wpkh" ? "SegWit (bc1q)" : t === "p2tr" ? "Taproot (bc1p)" : "Legacy (1/3)"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fee Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-bitcoin-dim uppercase tracking-wider">Frais de transaction</label>
            <button onClick={() => setUseCustomFee(!useCustomFee)} className="text-xs text-bitcoin-orange hover:underline">
              {useCustomFee ? "Utiliser les présets" : "Fee personnalisé"}
            </button>
          </div>

          {useCustomFee ? (
            <div className="flex items-center gap-2">
              <input type="number" value={customFeeRate} onChange={(e) => setCustomFeeRate(e.target.value)} placeholder="10"
                className="flex-1 bg-bitcoin-dark border border-bitcoin-border rounded-xl px-4 py-2.5 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono" />
              <span className="text-sm text-bitcoin-dim">sat/vB</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {feePresets.map((preset) => (
                <button key={preset.key} onClick={() => setFeeRate(preset.rate)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    feeRate === preset.rate && !useCustomFee
                      ? "border-bitcoin-orange bg-bitcoin-orange/10"
                      : "border-bitcoin-border hover:border-bitcoin-orange/50"
                  }`}>
                  <div className="text-xs text-bitcoin-dim">{preset.label}</div>
                  <div className="font-mono font-bold text-lg" style={{ color: getFeeColor(preset.rate) }}>{preset.rate}</div>
                  <div className="text-[10px] text-bitcoin-dim">{preset.time}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Build Button */}
        <button
          onClick={() => { setIsBuilding(true); activeTab === "rbf" ? buildRBF() : activeTab === "cpfp" ? buildCPFP() : buildTransaction(); setIsBuilding(false); }}
          disabled={isBuilding || (activeTab === "standard" && (!recipient || !amount || selectedUtxoList.length === 0)) || (activeTab === "rbf" && (!rbfOriginalTxid || !rbfOriginalFeeRate)) || (activeTab === "cpfp" && !cpfpParentTxid)}
          className="w-full bg-bitcoin-orange hover:bg-bitcoin-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-bitcoin-dark font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {activeTab === "standard" && "Construire la transaction"}
          {activeTab === "rbf" && "Construire le RBF"}
          {activeTab === "cpfp" && "Construire le CPFP"}
        </button>

        {/* Result */}
        {builtTx && (
          <div className="mt-6 bg-bitcoin-dark rounded-2xl border border-bitcoin-border p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-bitcoin-text flex items-center gap-2">
                {builtTx.type === "standard" && <ArrowRightLeft className="w-4 h-4 text-bitcoin-orange" />}
                {builtTx.type === "rbf" && <RefreshCw className="w-4 h-4 text-bitcoin-yellow" />}
                {builtTx.type === "cpfp" && <Baby className="w-4 h-4 text-bitcoin-blue" />}
                Transaction construite
              </h4>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                builtTx.type === "standard" ? "bg-bitcoin-orange/20 text-bitcoin-orange" :
                builtTx.type === "rbf" ? "bg-bitcoin-yellow/20 text-bitcoin-yellow" :
                "bg-bitcoin-blue/20 text-bitcoin-blue"
              }`}>{builtTx.type.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bitcoin-surface/50 rounded-xl p-3 border border-bitcoin-border/50">
                <span className="text-xs text-bitcoin-dim block mb-1">Taille estimée</span>
                <p className="font-mono text-bitcoin-text">{builtTx.totalSize} vBytes</p>
              </div>
              <div className="bg-bitcoin-surface/50 rounded-xl p-3 border border-bitcoin-border/50">
                <span className="text-xs text-bitcoin-dim block mb-1">Fee rate</span>
                <p className="font-mono" style={{ color: getFeeColor(builtTx.feeRate) }}>{builtTx.feeRate} sat/vB</p>
              </div>
              <div className="bg-bitcoin-surface/50 rounded-xl p-3 border border-bitcoin-border/50">
                <span className="text-xs text-bitcoin-dim block mb-1">Frais totaux</span>
                <p className="font-mono text-bitcoin-text">{formatSats(builtTx.fee)}</p>
              </div>
              <div className="bg-bitcoin-surface/50 rounded-xl p-3 border border-bitcoin-border/50">
                <span className="text-xs text-bitcoin-dim block mb-1">En BTC</span>
                <p className="font-mono text-bitcoin-text">{formatBTC(builtTx.fee, 8)}</p>
              </div>
            </div>

            {builtTx.type === "rbf" && builtTx.originalFeeRate && (
              <div className="bg-bitcoin-yellow/10 rounded-xl p-3 border border-bitcoin-yellow/30">
                <p className="text-xs text-bitcoin-yellow">
                  Augmentation: {builtTx.originalFeeRate} → {builtTx.feeRate} sat/vB (+{(((builtTx.feeRate - builtTx.originalFeeRate) / builtTx.originalFeeRate) * 100).toFixed(0)}%)
                </p>
              </div>
            )}

            {builtTx.type === "cpfp" && (
              <div className="bg-bitcoin-blue/10 rounded-xl p-3 border border-bitcoin-blue/30">
                <p className="text-xs text-bitcoin-blue">
                  Fee rate package cible: ~{builtTx.feeRate} sat/vB — Les mineurs verront le package entier.
                </p>
              </div>
            )}

            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-xs text-bitcoin-dim hover:text-bitcoin-text">
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Détails avancés
            </button>

            {showAdvanced && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-bitcoin-dim uppercase tracking-wider mb-1">Entrées ({builtTx.inputs.length})</p>
                  {builtTx.inputs.map((inp, i) => (
                    <div key={i} className="font-mono text-xs text-bitcoin-text bg-bitcoin-surface/50 p-2 rounded-lg border border-bitcoin-border/50 mb-1">
                      {truncateAddress(inp.txid, 8)}:{inp.vout} — {formatSats(inp.value)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-bitcoin-dim uppercase tracking-wider mb-1">Sorties ({builtTx.outputs.length})</p>
                  {builtTx.outputs.map((out, i) => (
                    <div key={i} className="font-mono text-xs text-bitcoin-text bg-bitcoin-surface/50 p-2 rounded-lg border border-bitcoin-border/50 mb-1">
                      {truncateAddress(out.address, 10)} — {formatSats(out.value)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-bitcoin-dim uppercase tracking-wider">PSBT (Base64)</span>
                    <button onClick={() => builtTx.psbtBase64 && copyToClipboard(builtTx.psbtBase64)} className="text-xs text-bitcoin-orange flex items-center gap-1">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copié!" : "Copier"}
                    </button>
                  </div>
                  <div className="bg-bitcoin-surface p-3 rounded-xl border border-bitcoin-border font-mono text-[10px] text-bitcoin-dim break-all max-h-32 overflow-y-auto">
                    {builtTx.psbtBase64}
                  </div>
                  <p className="text-[10px] text-bitcoin-dim mt-2 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    PSBT non signée. Signez dans Sparrow, Electrum ou Bitcoin Core avant diffusion.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function generatePseudoPsbt(tx: BuiltTx): string {
  const header = "cHNidP8B";
  const txData = btoa(JSON.stringify({ version: 2, inputs: tx.inputs, outputs: tx.outputs, fee: tx.fee, feeRate: tx.feeRate, type: tx.type }));
  return header + txData;
}
