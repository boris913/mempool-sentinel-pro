"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X, ExternalLink, CheckCircle, Clock, Copy, Check } from "lucide-react";
import { SearchResult } from "@/lib/mempool-api";
import { truncateTxid, truncateAddress, formatBTC, formatSats, formatTime, formatDateTime } from "@/lib/utils";
import { useState } from "react";

interface SearchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SearchResult | null;
}

export default function SearchResultModal({ isOpen, onClose, result }: SearchResultModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) return null;

  const renderContent = () => {
    if (result.type === "error") {
      return (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-bitcoin-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-bitcoin-red" />
          </div>
          <p className="text-bitcoin-red font-medium">{result.message}</p>
        </div>
      );
    }

    if (result.type === "tx") {
      const tx = result.data;
      const totalOut = tx.vout.reduce((sum, o) => sum + o.value, 0);
      const totalIn = tx.vin.reduce((sum, vin) => sum + (vin.prevout?.value || 0), 0);
      const isConfirmed = tx.status.confirmed;
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConfirmed ? (
                <CheckCircle className="w-5 h-5 text-bitcoin-green" />
              ) : (
                <Clock className="w-5 h-5 text-bitcoin-yellow" />
              )}
              <span className={`text-sm font-medium ${isConfirmed ? "text-bitcoin-green" : "text-bitcoin-yellow"}`}>
                {isConfirmed ? "Confirmée" : "En attente de confirmation"}
              </span>
            </div>
            {isConfirmed && (
              <span className="text-xs text-bitcoin-dim">Bloc #{tx.status.block_height?.toLocaleString()}</span>
            )}
          </div>

          <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-bitcoin-dim uppercase tracking-wider">TXID</span>
              <button onClick={() => copyToClipboard(tx.txid)} className="text-bitcoin-orange hover:text-bitcoin-orange/80">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="font-mono text-xs text-bitcoin-text break-all">{tx.txid}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Montant total</span>
              <p className="font-mono text-lg text-bitcoin-text">{formatBTC(totalOut)}</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Frais</span>
              <p className="font-mono text-lg text-bitcoin-orange">{tx.fee ? formatSats(tx.fee) : "N/A"}</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Taille / Poids</span>
              <p className="font-mono text-sm text-bitcoin-text">{tx.size} B / {tx.weight} WU</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Fee rate</span>
              <p className="font-mono text-sm text-bitcoin-text">{tx.fee ? (tx.fee / (tx.weight / 4)).toFixed(1) : "—"} sat/vB</p>
            </div>
          </div>

          <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
            <span className="text-xs text-bitcoin-dim uppercase tracking-wider block mb-3">Entrées / Sorties</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-bitcoin-dim mb-1">{tx.vin.length} entrée(s)</p>
                <p className="font-mono text-xs text-bitcoin-text">{formatSats(totalIn)}</p>
              </div>
              <div>
                <p className="text-xs text-bitcoin-dim mb-1">{tx.vout.length} sortie(s)</p>
                <p className="font-mono text-xs text-bitcoin-text">{formatSats(totalOut)}</p>
              </div>
            </div>
          </div>

          <a
            href={`https://mempool.space/tx/${tx.txid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-bitcoin-orange/10 hover:bg-bitcoin-orange/20 text-bitcoin-orange rounded-xl transition-colors font-medium"
          >
            Voir sur Mempool.space <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      );
    }

    if (result.type === "address") {
      const addr = result.data;
      const chainStats = addr.chain_stats;
      const mempoolStats = addr.mempool_stats;
      const balance = chainStats.funded_txo_sum - chainStats.spent_txo_sum;
      const mempoolBalance = mempoolStats.funded_txo_sum - mempoolStats.spent_txo_sum;

      return (
        <div className="space-y-5">
          <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-bitcoin-dim uppercase tracking-wider">Adresse</span>
              <button onClick={() => copyToClipboard(addr.address)} className="text-bitcoin-orange hover:text-bitcoin-orange/80">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="font-mono text-xs text-bitcoin-text break-all">{addr.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Solde confirmé</span>
              <p className="font-mono text-lg text-bitcoin-green">{formatBTC(balance)}</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">En mempool</span>
              <p className="font-mono text-lg text-bitcoin-yellow">{formatBTC(mempoolBalance)}</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Transactions</span>
              <p className="font-mono text-lg text-bitcoin-text">{chainStats.tx_count.toLocaleString()}</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">UTXOs</span>
              <p className="font-mono text-lg text-bitcoin-text">{chainStats.funded_txo_count - chainStats.spent_txo_count}</p>
            </div>
          </div>

          <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-bitcoin-dim">Total reçu</span>
              <span className="font-mono text-bitcoin-text">{formatBTC(chainStats.funded_txo_sum)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-bitcoin-dim">Total envoyé</span>
              <span className="font-mono text-bitcoin-text">{formatBTC(chainStats.spent_txo_sum)}</span>
            </div>
          </div>

          <a
            href={`https://mempool.space/address/${addr.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-bitcoin-orange/10 hover:bg-bitcoin-orange/20 text-bitcoin-orange rounded-xl transition-colors font-medium"
          >
            Voir sur Mempool.space <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      );
    }

    if (result.type === "block") {
      const block = result.data;
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-bitcoin-orange/10 rounded-xl flex items-center justify-center">
              <span className="font-mono font-bold text-bitcoin-orange">#{block.height.toLocaleString()}</span>
            </div>
            <div>
              <p className="text-sm text-bitcoin-dim">Hauteur</p>
              <p className="font-mono text-bitcoin-text">{formatDateTime(block.timestamp)}</p>
            </div>
          </div>

          <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
            <span className="text-xs text-bitcoin-dim uppercase tracking-wider block mb-2">Hash</span>
            <p className="font-mono text-xs text-bitcoin-text break-all">{block.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Transactions</span>
              <p className="font-mono text-lg text-bitcoin-text">{block.tx_count.toLocaleString()}</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Taille</span>
              <p className="font-mono text-lg text-bitcoin-text">{(block.size / 1024).toFixed(2)} KB</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Poids</span>
              <p className="font-mono text-lg text-bitcoin-text">{(block.weight / 1000).toFixed(2)} kWU</p>
            </div>
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Difficulté</span>
              <p className="font-mono text-lg text-bitcoin-text">{(block.difficulty / 1e12).toFixed(2)} T</p>
            </div>
          </div>

          {block.extras?.pool && (
            <div className="bg-bitcoin-dark rounded-xl p-4 border border-bitcoin-border">
              <span className="text-xs text-bitcoin-dim block mb-1">Pool de minage</span>
              <p className="font-mono text-bitcoin-text">{block.extras.pool.name}</p>
            </div>
          )}

          <a
            href={`https://mempool.space/block/${block.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-bitcoin-orange/10 hover:bg-bitcoin-orange/20 text-bitcoin-orange rounded-xl transition-colors font-medium"
          >
            Voir sur Mempool.space <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-bitcoin-surface border border-bitcoin-border shadow-2xl transition-all">
                <div className="flex justify-between items-center p-6 border-b border-bitcoin-border">
                  <Dialog.Title className="text-lg font-display font-semibold text-bitcoin-text">
                    {result.type === "error" ? "Erreur" : `Détail ${result.type}`}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1 text-bitcoin-dim hover:text-bitcoin-text rounded-lg hover:bg-bitcoin-border/50 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {renderContent()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
