// useMempoolWebSocket.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  RecommendedFees,
  MempoolBlock,
  Block,
  MempoolInfo,
  FeeHistoryPoint,
  Alert,
  DifficultyAdjustment,
  HashrateInfo,
  PriceInfo,
  LightningStats,
  FeeDistribution,
  DashboardState,
} from "@/types";
import { generateId } from "@/lib/utils";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_MEMPOOL_WS ?? "wss://mempool.space/api/v1/ws")
    : "";

const MAX_HISTORY = 120;
const MAX_ALERTS = 100;

export interface AddressEvent {
  address: string;
  transactions: import("@/types").Transaction[];
  type: "mempool" | "confirmed";
}

interface UseMempoolWebSocketOptions {
  trackAddresses?: string[];
  feeAlertThreshold?: number;
  mempoolAlertThreshold?: number;
  onAddressActivity?: (event: AddressEvent) => void;
}

export function useMempoolWebSocket(options: UseMempoolWebSocketOptions = {}) {
  const { 
    trackAddresses = [], 
    feeAlertThreshold = 50, 
    mempoolAlertThreshold = 200 * 1024 * 1024,
    onAddressActivity 
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCount = useRef(0);
  const feeAlertSent = useRef(false);
  const mempoolAlertSent = useRef(false);
  const prevBlockHeight = useRef<number>(0);
  const feeHistoryRef = useRef<FeeHistoryPoint[]>([]);

  const [data, setData] = useState<DashboardState>({
    fees: null,
    mempoolInfo: null,
    mempoolBlocks: [],
    latestBlock: null,
    recentBlocks: [],
    vBytesPerSecond: 0,
    feeHistory: [],
    alerts: [],
    connected: false,
    lastUpdate: 0,
    difficultyAdjustment: null,
    hashrateInfo: null,
    priceInfo: null,
    lightningStats: null,
    mempoolDistribution: null,
  });

  const addAlert = useCallback((alert: Omit<Alert, "id" | "timestamp" | "read">) => {
    setData((prev) => ({
      ...prev,
      alerts: [
        { ...alert, id: generateId(), timestamp: Date.now(), read: false },
        ...prev.alerts.slice(0, MAX_ALERTS - 1),
      ],
    }));
  }, []);

  const markAllRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => ({ ...a, read: true })),
    }));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== id),
    }));
  }, []);

  const connect = useCallback(() => {
    if (!WS_URL) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCount.current = 0;
      setData((prev) => ({ ...prev, connected: true }));

      // Souscription aux données nécessaires incluant les frais
      ws.send(JSON.stringify({ 
        action: "want", 
        data: ["blocks", "stats", "mempool-blocks", "live-2h-chart", "fees"] 
      }));

      if (trackAddresses.length > 0) {
        ws.send(JSON.stringify({ "track-addresses": trackAddresses }));
      }
    };

    ws.onclose = () => {
      setData((prev) => ({ ...prev, connected: false }));
      const delay = Math.min(1000 * 2 ** reconnectCount.current, 30000);
      reconnectCount.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const now = Date.now();

        setData((prev) => {
          const updates: Partial<DashboardState> = { lastUpdate: now };

          if (msg.mempoolInfo) {
            updates.mempoolInfo = msg.mempoolInfo;

            // Alert mempool congestion
            if (mempoolAlertThreshold && msg.mempoolInfo.bytes > mempoolAlertThreshold && !mempoolAlertSent.current) {
              mempoolAlertSent.current = true;
              updates.alerts = [
                {
                  id: generateId(),
                  type: "mempool",
                  message: `⚠️ Mempool critique : ${(msg.mempoolInfo.bytes / 1024 / 1024).toFixed(0)} MB utilisés`,
                  timestamp: now,
                  read: false,
                  severity: "warning",
                },
                ...prev.alerts.slice(0, MAX_ALERTS - 1),
              ];
            } else if (mempoolAlertThreshold && msg.mempoolInfo.bytes <= mempoolAlertThreshold * 0.8) {
              mempoolAlertSent.current = false;
            }
          }

          if (msg.vBytesPerSecond !== undefined) {
            updates.vBytesPerSecond = msg.vBytesPerSecond;
          }

          if (msg.fees) {
            updates.fees = msg.fees;

            const newPoint: FeeHistoryPoint = {
              time: now,
              fastest: msg.fees.fastestFee,
              halfHour: msg.fees.halfHourFee,
              hour: msg.fees.hourFee,
              economy: msg.fees.economyFee,
            };
            
            // Mettre à jour l'historique de manière cohérente
            const updatedHistory = [...prev.feeHistory.slice(-(MAX_HISTORY - 1)), newPoint];
            updates.feeHistory = updatedHistory;
            feeHistoryRef.current = updatedHistory;

            if (feeAlertThreshold && msg.fees.fastestFee > feeAlertThreshold && !feeAlertSent.current) {
              feeAlertSent.current = true;
              updates.alerts = [
                {
                  id: generateId(),
                  type: "fee",
                  message: `🔥 Frais en explosion : ${msg.fees.fastestFee} sat/vB (seuil: ${feeAlertThreshold})`,
                  timestamp: now,
                  read: false,
                  severity: "warning",
                },
                ...prev.alerts.slice(0, MAX_ALERTS - 1),
              ];
            } else if (feeAlertThreshold && msg.fees.fastestFee <= feeAlertThreshold * 0.7) {
              feeAlertSent.current = false;
            }
          }

          // Gestion des données du graphique live-2h-chart si envoyées séparément
          if (msg["live-2h-chart"]) {
            const chartData = msg["live-2h-chart"];
            if (Array.isArray(chartData) && chartData.length > 0) {
              const historyPoints: FeeHistoryPoint[] = chartData.map((point: any) => ({
                time: point.timestamp ? point.timestamp * 1000 : now,
                fastest: point.fastestFee || point.fastest || 0,
                halfHour: point.halfHourFee || point.halfHour || 0,
                hour: point.hourFee || point.hour || 0,
                economy: point.economyFee || point.economy || 0,
              }));
              updates.feeHistory = historyPoints;
              feeHistoryRef.current = historyPoints;
            }
          }

          if (msg["mempool-blocks"]) {
            updates.mempoolBlocks = msg["mempool-blocks"];
          }

          if (msg.block) {
            updates.latestBlock = msg.block;
            updates.recentBlocks = [msg.block, ...prev.recentBlocks].slice(0, 10);

            if (msg.block.height !== prevBlockHeight.current) {
              prevBlockHeight.current = msg.block.height;
              updates.alerts = [
                {
                  id: generateId(),
                  type: "block",
                  message: `✅ Bloc #${msg.block.height.toLocaleString()} miné — ${msg.block.tx_count.toLocaleString()} tx — ${(msg.block.extras?.pool?.name || "Inconnu")}`,
                  timestamp: now,
                  read: false,
                  severity: "success",
                  data: { block: msg.block },
                },
                ...(updates.alerts ?? prev.alerts).slice(0, MAX_ALERTS - 1),
              ];
            }
          }

          return { ...prev, ...updates };
        });

        if (msg["address-transactions"] && onAddressActivity) {
          Object.entries(msg["address-transactions"]).forEach(([addr, txs]) => {
            onAddressActivity({
              address: addr,
              transactions: txs as import("@/types").Transaction[],
              type: "mempool",
            });
          });
        }
        if (msg["block-transactions"] && onAddressActivity) {
          Object.entries(msg["block-transactions"]).forEach(([addr, txs]) => {
            onAddressActivity({
              address: addr,
              transactions: txs as import("@/types").Transaction[],
              type: "confirmed",
            });
          });
        }
      } catch {
        // ignore malformed
      }
    };
  }, [trackAddresses, feeAlertThreshold, mempoolAlertThreshold, onAddressActivity]);

  const updateTrackedAddresses = useCallback((addresses: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && addresses.length > 0) {
      wsRef.current.send(JSON.stringify({ "track-addresses": addresses }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    updateTrackedAddresses(trackAddresses);
  }, [trackAddresses, updateTrackedAddresses]);

  return { data, markAllRead, dismissAlert, updateTrackedAddresses };
}