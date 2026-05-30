"use client";

import { useState, useCallback } from "react";
import type { TrackedAddress, Alert, Transaction } from "@/types";
import { generateId, mempoolApiUrl } from "@/lib/utils";

export interface AddressTxEvent {
  address: string;
  tx: Transaction;
  type: "mempool" | "confirmed";
  timestamp: number;
}

export function useAddressTracker() {
  const [trackedAddresses, setTrackedAddresses] = useState<TrackedAddress[]>([]);
  const [addressEvents, setAddressEvents] = useState<AddressTxEvent[]>([]);
  const [addressAlerts, setAddressAlerts] = useState<Alert[]>([]);

  const addAddress = useCallback((address: string, label?: string) => {
    setTrackedAddresses((prev) => {
      if (prev.find((a) => a.address === address)) return prev;
      return [...prev, { address, label, addedAt: Date.now() }];
    });
  }, []);

  const removeAddress = useCallback((address: string) => {
    setTrackedAddresses((prev) => prev.filter((a) => a.address !== address));
    setAddressEvents((prev) => prev.filter((e) => e.address !== address));
  }, []);

  const updateAddressInfo = useCallback(async (address: string) => {
    try {
      const res = await fetch(mempoolApiUrl(`/api/address/${address}`));
      if (!res.ok) return;
      const info = await res.json();
      setTrackedAddresses((prev) =>
        prev.map((a) =>
          a.address === address
            ? {
                ...a,
                balance: info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum,
                txCount: info.chain_stats.tx_count,
              }
            : a
        )
      );
    } catch {
      // silent
    }
  }, []);

  const handleAddressActivity = useCallback(
    (event: { address: string; transactions: Transaction[]; type: "mempool" | "confirmed" }) => {
      const now = Date.now();

      const newEvents: AddressTxEvent[] = event.transactions.map((tx) => ({
        address: event.address,
        tx,
        type: event.type,
        timestamp: now,
      }));

      setAddressEvents((prev) => [...newEvents, ...prev].slice(0, 200));

      const newAlerts: Alert[] = event.transactions.map((tx) => {
        const totalOut = tx.vout.reduce((sum, o) => sum + o.value, 0);
        const isConfirmed = event.type === "confirmed";
        return {
          id: generateId(),
          type: "address" as const,
          message: `${isConfirmed ? "✅ Confirmé" : "⏳ Mempool"} — ${event.address.slice(0, 12)}... — ${(totalOut / 1e8).toFixed(6)} BTC`,
          timestamp: now,
          read: false,
          severity: isConfirmed ? ("success" as const) : ("info" as const),
          data: { txid: tx.txid, address: event.address },
        };
      });

      setAddressAlerts((prev) => [...newAlerts, ...prev].slice(0, 100));
    },
    []
  );

  const fetchAddressTransactions = useCallback(async (address: string) => {
    try {
      const [txsRes, infoRes] = await Promise.all([
        fetch(mempoolApiUrl(`/api/address/${address}/txs`)),
        fetch(mempoolApiUrl(`/api/address/${address}`)),
      ]);

      if (!txsRes.ok || !infoRes.ok) throw new Error("Erreur réseau");

      const txs: Transaction[] = await txsRes.json();
      const info = await infoRes.json();
      const now = Date.now();

      const events: AddressTxEvent[] = txs.slice(0, 20).map((tx) => ({
        address,
        tx,
        type: tx.status.confirmed ? "confirmed" : "mempool",
        timestamp: now,
      }));

      setAddressEvents((prev) => {
        const existing = new Set(prev.map((e) => e.tx.txid + e.address));
        const fresh = events.filter((e) => !existing.has(e.tx.txid + e.address));
        return [...fresh, ...prev].slice(0, 200);
      });

      setTrackedAddresses((prev) =>
        prev.map((a) =>
          a.address === address
            ? {
                ...a,
                balance: info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum,
                txCount: info.chain_stats.tx_count,
              }
            : a
        )
      );
    } catch {
      // silent fail
    }
  }, []);

  return {
    trackedAddresses,
    addressEvents,
    addressAlerts,
    addAddress,
    removeAddress,
    handleAddressActivity,
    fetchAddressTransactions,
    updateAddressInfo,
  };
}
