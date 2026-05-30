"use client";

import { Wifi, WifiOff, Clock } from "lucide-react";

interface ConnectionStatusProps {
  connected: boolean;
  lastUpdate: number;
}

export default function ConnectionStatus({ connected, lastUpdate }: ConnectionStatusProps) {
  const lastUpdateAgo = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 1000) : null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md ${
        connected 
          ? "bg-bitcoin-dark/90 border-bitcoin-green/30" 
          : "bg-bitcoin-dark/90 border-bitcoin-red/30"
      }`}>
        {connected ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bitcoin-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-bitcoin-green" />
            </span>
            <span className="text-xs text-bitcoin-green font-medium">Connecté</span>
            {lastUpdateAgo !== null && lastUpdateAgo < 60 && (
              <span className="text-[10px] text-bitcoin-dim flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdateAgo}s
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-bitcoin-red" />
            <span className="text-xs text-bitcoin-red font-medium">Reconnexion...</span>
          </>
        )}
      </div>
    </div>
  );
}
