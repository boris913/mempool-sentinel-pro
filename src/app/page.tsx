// page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useMempoolWebSocket } from "@/hooks/useMempoolWebSocket";
import { useAddressTracker } from "@/hooks/useAddressTracker";
import Header from "@/components/Header";
import FeeCard from "@/components/FeeCard";
import MempoolStatsCard from "@/components/MempoolStatsCard";
import BlockCard from "@/components/BlockCard";
import FeeChart from "@/components/FeeChart";
import MempoolBlocksList from "@/components/MempoolBlocksList";
import AddressTracker from "@/components/AddressTracker";
import AlertList from "@/components/AlertList";
import NetworkStats from "@/components/NetworkStats";
import FeeDistribution from "@/components/FeeDistribution";
import RecentBlocks from "@/components/RecentBlocks";
import TransactionBuilder from "@/components/TransactionBuilder";
import TransactionTools from "@/components/TransactionTools";
import FeeEstimatorCard from "@/components/FeeEstimatorCard";
import ConnectionStatus from "@/components/ConnectionStatus";
import { ToastProvider } from "@/components/ToastProvider";
import { 
  getDifficultyAdjustment, 
  getHashrateInfo, 
  getBTCPrice, 
  getFeeDistribution,
  getRecentBlocks,
} from "@/lib/mempool-api";
import type { DifficultyAdjustment, HashrateInfo, PriceInfo, FeeDistribution as FeeDistType, Block, RecommendedFees } from "@/types";

export default function Home() {
  const [trackedAddresses, setTrackedAddresses] = useState<string[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [difficultyAdjustment, setDifficultyAdjustment] = useState<DifficultyAdjustment | null>(null);
  const [hashrateInfo, setHashrateInfo] = useState<HashrateInfo | null>(null);
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [feeDistribution, setFeeDistribution] = useState<FeeDistType | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [previousFees, setPreviousFees] = useState<RecommendedFees | null>(null);
  const [activeToolsTab, setActiveToolsTab] = useState<"estimator" | "builder" | "distribution">("estimator");

  const addressTracker = useAddressTracker();

  const handleAddAddress = useCallback((addr: string, label?: string) => {
    setTrackedAddresses((prev) => {
      if (prev.includes(addr)) return prev;
      addressTracker.addAddress(addr, label);
      addressTracker.fetchAddressTransactions(addr);
      return [...prev, addr];
    });
  }, [addressTracker]);

  const handleRemoveAddress = useCallback((addr: string) => {
    setTrackedAddresses((prev) => prev.filter((a) => a !== addr));
    addressTracker.removeAddress(addr);
  }, [addressTracker]);

  const { data, markAllRead, dismissAlert } = useMempoolWebSocket({
    trackAddresses: trackedAddresses,
    feeAlertThreshold: 50,
    mempoolAlertThreshold: 250 * 1024 * 1024,
    onAddressActivity: addressTracker.handleAddressActivity,
  });

  useEffect(() => {
    if (data.fees && !previousFees) {
      setPreviousFees(data.fees);
    }
  }, [data.fees, previousFees]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [diff, hash, price, dist, blocks] = await Promise.all([
          getDifficultyAdjustment(),
          getHashrateInfo(),
          getBTCPrice(),
          getFeeDistribution(),
          getRecentBlocks(),
        ]);
        setDifficultyAdjustment(diff);
        setHashrateInfo(hash);
        setPriceInfo(price);
        setFeeDistribution(dist);
        setRecentBlocks(blocks.slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch static data:", err);
      }
    };
    fetchStaticData();
  }, []);

  const allAlerts = [...data.alerts, ...addressTracker.addressAlerts].sort((a, b) => b.timestamp - a.timestamp);
  const unreadCount = allAlerts.filter((a) => !a.read).length;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bitcoin-dark">
        <Header 
          alertCount={unreadCount} 
          onToggleAlerts={() => setShowAlerts(!showAlerts)} 
        />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* ═════════════════════════════════════════════════════════════
              ROW 1: KPIs CRITIQUES — Bandeau supérieur compact
              Les 5 métriques les plus importantes, visibles en un coup d'œil
          ═════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard 
              label="Frais Rapide" 
              value={data.fees?.fastestFee} 
              unit="sat/vB" 
              color="text-bitcoin-red"
              trend={previousFees ? (data.fees?.fastestFee ?? 0) - previousFees.fastestFee : 0}
            />
            <KpiCard 
              label="Frais Moyen" 
              value={data.fees?.halfHourFee} 
              unit="sat/vB" 
              color="text-bitcoin-yellow"
            />
            <KpiCard 
              label="Mempool" 
              value={data.mempoolInfo ? Math.round(data.mempoolInfo.bytes / 1024 / 1024) : null} 
              unit="MB" 
              color="text-bitcoin-blue"
            />
            <KpiCard 
              label="Prix BTC" 
              value={priceInfo ? Math.round(priceInfo.USD) : null} 
              unit="$" 
              color="text-bitcoin-green"
            />
            <KpiCard 
              label="Dernier Bloc" 
              value={data.latestBlock?.height} 
              unit="#" 
              color="text-bitcoin-orange"
              subvalue={data.latestBlock ? `${data.latestBlock.tx_count} tx` : undefined}
            />
          </section>

          {/* ═════════════════════════════════════════════════════════════
              ROW 2: VISUALISATION PRINCIPALE + SIDEBAR
              2/3 pour le graphique (focus principal), 1/3 pour surveillance
          ═════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Graphique principal — 8 colonnes */}
            <div className="lg:col-span-8">
              <FeeChart feeHistory={data.feeHistory} />
            </div>
            
            {/* Sidebar droite — 4 colonnes: Surveillance + Alertes */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
                {/* Tabs pour basculer entre Surveillance et Alertes */}
                <div className="flex border-b border-bitcoin-border">
                  <button
                    onClick={() => setShowAlerts(false)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      !showAlerts 
                        ? "text-bitcoin-orange border-b-2 border-bitcoin-orange bg-bitcoin-orange/5" 
                        : "text-bitcoin-dim hover:text-bitcoin-text"
                    }`}
                  >
                    Surveillance
                  </button>
                  <button
                    onClick={() => setShowAlerts(true)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                      showAlerts 
                        ? "text-bitcoin-orange border-b-2 border-bitcoin-orange bg-bitcoin-orange/5" 
                        : "text-bitcoin-dim hover:text-bitcoin-text"
                    }`}
                  >
                    Alertes
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-4 w-2 h-2 bg-bitcoin-red rounded-full animate-pulse" />
                    )}
                  </button>
                </div>
                
                <div className="p-4">
                  {showAlerts ? (
                    <AlertList 
                      alerts={allAlerts} 
                      onMarkAllRead={markAllRead}
                      onDismiss={dismissAlert}
                    />
                  ) : (
                    <AddressTracker
                      trackedAddresses={addressTracker.trackedAddresses}
                      onAddAddress={handleAddAddress}
                      onRemoveAddress={handleRemoveAddress}
                      onRefreshAddress={addressTracker.fetchAddressTransactions}
                    />
                  )}
                </div>
              </div>

              {/* Dernier bloc mini-card dans la sidebar */}
              <BlockCard block={data.latestBlock} compact />
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════
              ROW 3: RÉSEAU + BLOCKS RÉCENTS
              50/50 pour équilibrer l'information
          ═════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NetworkStats 
              difficultyAdjustment={difficultyAdjustment}
              hashrateInfo={hashrateInfo}
              priceInfo={priceInfo}
              latestBlock={data.latestBlock ? { timestamp: data.latestBlock.timestamp, height: data.latestBlock.height } : null}
            />
            <RecentBlocks blocks={recentBlocks} />
          </section>

          {/* ═════════════════════════════════════════════════════════════
              ROW 4: OUTILS — Onglets pour économiser l'espace
              Un seul outil visible à la fois, pas de surcharge visuelle
          ═════════════════════════════════════════════════════════════ */}
          {/* <section className="bg-bitcoin-surface rounded-2xl border border-bitcoin-border overflow-hidden">
            <div className="border-b border-bitcoin-border">
              <div className="flex">
                {[
                  { id: "estimator" as const, label: "Estimateur Rapide", icon: "⚡" },
                  { id: "builder" as const, label: "Constructeur TX", icon: "🔧" },
                  { id: "distribution" as const, label: "Distribution", icon: "📊" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveToolsTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                      activeToolsTab === tab.id
                        ? "text-bitcoin-orange border-bitcoin-orange bg-bitcoin-orange/5"
                        : "text-bitcoin-dim border-transparent hover:text-bitcoin-text hover:bg-bitcoin-border/20"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {activeToolsTab === "estimator" && <FeeEstimatorCard fees={data.fees} />}
              {activeToolsTab === "builder" && <TransactionBuilder fees={data.fees} />}
              {activeToolsTab === "distribution" && (
                <FeeDistribution 
                  distribution={feeDistribution} 
                  mempoolInfo={data.mempoolInfo ? { size: data.mempoolInfo.size, bytes: data.mempoolInfo.bytes } : null}
                />
              )}
            </div>
          </section> */}

          {/* ═════════════════════════════════════════════════════════════
              ROW 5: MÉMOIRE PROFONDE — Blocs projetés (collapsible)
              Section avancée, moins prioritaire, pleine largeur
          ═════════════════════════════════════════════════════════════ */}
          <section>
            <MempoolBlocksList blocks={data.mempoolBlocks} />
          </section>
        </main>

        <ConnectionStatus connected={data.connected} lastUpdate={data.lastUpdate} />
      </div>
    </ToastProvider>
  );
}

// ═════════════════════════════════════════════════════════════════
// COMPOSANT KPI CARD — Mini carte pour le bandeau supérieur
// ═════════════════════════════════════════════════════════════════
interface KpiCardProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  color: string;
  trend?: number;
  subvalue?: string;
}

function KpiCard({ label, value, unit, color, trend, subvalue }: KpiCardProps) {
  return (
    <div className="bg-bitcoin-surface rounded-xl border border-bitcoin-border p-4 hover:border-bitcoin-orange/30 transition-colors">
      <p className="text-[10px] text-bitcoin-dim uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        {value !== null && value !== undefined ? (
          <>
            <span className={`text-xl font-mono font-bold ${color}`}>
              {unit === "$" ? `$${value.toLocaleString()}` : unit === "#" ? `#${value.toLocaleString()}` : value}
            </span>
            <span className="text-xs text-bitcoin-dim">{unit === "$" || unit === "#" ? "" : unit}</span>
          </>
        ) : (
          <span className="text-xl font-mono text-bitcoin-muted">—</span>
        )}
      </div>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-[10px] ${trend > 0 ? "text-bitcoin-red" : "text-bitcoin-green"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}
        </span>
      )}
      {subvalue && <p className="text-[10px] text-bitcoin-dim mt-1">{subvalue}</p>}
    </div>
  );
}