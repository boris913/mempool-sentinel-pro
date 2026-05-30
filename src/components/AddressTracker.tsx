// AddressTracker.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, MapPin, Wallet, Loader2 } from "lucide-react";
import { truncateAddress, formatBTC } from "@/lib/utils";
import type { TrackedAddress } from "@/types";

interface AddressTrackerProps {
  trackedAddresses: TrackedAddress[];
  onAddAddress: (address: string, label?: string) => void;
  onRemoveAddress: (address: string) => void;
  onRefreshAddress: (address: string) => void;
}

export default function AddressTracker({
  trackedAddresses,
  onAddAddress,
  onRemoveAddress,
  onRefreshAddress,
}: AddressTrackerProps) {
  const [input, setInput] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    const addr = input.trim();
    if (addr && !trackedAddresses.find((a) => a.address === addr)) {
      setLoading(true);
      onAddAddress(addr, label.trim() || undefined);
      setInput("");
      setLabel("");
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-bitcoin-purple/10 rounded-lg flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-bitcoin-purple" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text text-sm">Surveillance</h3>
            <p className="text-[10px] text-bitcoin-dim">{trackedAddresses.length} adresse(s)</p>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="bc1q... ou 1A..."
            className="w-full bg-bitcoin-dark border border-bitcoin-border rounded-lg px-3 py-2 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 font-mono"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optionnel)"
              className="flex-1 bg-bitcoin-dark border border-bitcoin-border rounded-lg px-3 py-2 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60"
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim() || loading}
              className="bg-bitcoin-orange hover:bg-bitcoin-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-bitcoin-dark p-2 rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 max-h-64">
        {trackedAddresses.length === 0 ? (
          <div className="text-center py-6 text-bitcoin-dim">
            <Wallet className="w-6 h-6 mx-auto mb-2 text-bitcoin-dim/30" />
            <p className="text-xs">Aucune adresse</p>
            <p className="text-[10px] mt-1">Ajoutez une adresse pour surveiller ses transactions</p>
          </div>
        ) : (
          <div className="divide-y divide-bitcoin-border/50">
            {trackedAddresses.map((addr) => (
              <div
                key={addr.address}
                className="py-2 hover:bg-bitcoin-border/20 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-bitcoin-text truncate">
                        {truncateAddress(addr.address, 6)}
                      </span>
                      {addr.label && (
                        <span className="text-[10px] bg-bitcoin-border/50 text-bitcoin-dim px-1.5 py-0.5 rounded">
                          {addr.label}
                        </span>
                      )}
                    </div>
                    {addr.balance !== undefined && (
                      <p className="text-xs text-bitcoin-green mt-0.5 font-mono">
                        {formatBTC(addr.balance)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onRefreshAddress(addr.address)}
                      className="p-1 text-bitcoin-dim hover:text-bitcoin-text rounded-md hover:bg-bitcoin-border/50 transition-colors"
                      title="Rafraîchir"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <a
                      href={`https://mempool.space/address/${addr.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-bitcoin-dim hover:text-bitcoin-text rounded-md hover:bg-bitcoin-border/50 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => onRemoveAddress(addr.address)}
                      className="p-1 text-bitcoin-dim hover:text-bitcoin-red rounded-md hover:bg-bitcoin-red/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}