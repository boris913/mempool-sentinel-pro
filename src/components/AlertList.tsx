// AlertList.tsx
"use client";

import { Alert } from "@/types";
import { Bell, CheckCheck, X, Clock, Flame, Box, Wallet, TrendingUp } from "lucide-react";

interface AlertListProps {
  alerts: Alert[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

const alertIcons = {
  fee: Flame,
  block: Box,
  tx: Wallet,
  address: Wallet,
  mempool: TrendingUp,
  price: TrendingUp,
};

const severityStyles = {
  info: "border-l-bitcoin-blue",
  warning: "border-l-bitcoin-yellow",
  success: "border-l-bitcoin-green",
  error: "border-l-bitcoin-red",
};

const severityBg = {
  info: "bg-bitcoin-blue/5",
  warning: "bg-bitcoin-yellow/5",
  success: "bg-bitcoin-green/5",
  error: "bg-bitcoin-red/5",
};

export default function AlertList({ alerts, onMarkAllRead, onDismiss }: AlertListProps) {
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col max-h-[500px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-bitcoin-red/10 rounded-lg flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-bitcoin-red" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-bitcoin-text text-sm">Alertes</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] text-bitcoin-dim">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] text-bitcoin-dim hover:text-bitcoin-text flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-bitcoin-border/50 transition-colors"
          >
            <CheckCheck className="w-3 h-3" /> Tout lire
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-bitcoin-dim">
            <Bell className="w-6 h-6 mx-auto mb-2 text-bitcoin-dim/30" />
            <p className="text-xs">Aucune alerte</p>
            <p className="text-[10px] mt-1">Les événements importants apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.type] || Bell;
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-2 ${severityStyles[alert.severity]} ${severityBg[alert.severity]} ${
                    alert.read ? "opacity-50" : ""
                  } hover:bg-bitcoin-border/10 transition-colors group`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      alert.severity === "warning" ? "text-bitcoin-yellow" :
                      alert.severity === "success" ? "text-bitcoin-green" :
                      alert.severity === "error" ? "text-bitcoin-red" :
                      "text-bitcoin-blue"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-bitcoin-text leading-relaxed">{alert.message}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-2.5 h-2.5 text-bitcoin-dim" />
                        <span className="text-[10px] text-bitcoin-dim">
                          {new Date(alert.timestamp).toLocaleTimeString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-bitcoin-dim hover:text-bitcoin-red transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}