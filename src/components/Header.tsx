"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";
import { Bitcoin, Menu, X, Bell } from "lucide-react";

interface HeaderProps {
  alertCount: number;
  onToggleAlerts: () => void;
}

export default function Header({ alertCount, onToggleAlerts }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bitcoin-dark/95 backdrop-blur-xl border-b border-bitcoin-border/80">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-bitcoin-orange rounded-lg flex items-center justify-center shadow-lg shadow-bitcoin-orange/20">
              <Bitcoin className="w-5 h-5 text-bitcoin-dark" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-lg tracking-tight text-bitcoin-text leading-none">
                Mempool <span className="text-bitcoin-orange">Sentinel</span>
              </h1>
              <p className="text-[10px] text-bitcoin-dim tracking-wider uppercase">Pro Dashboard</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAlerts}
              className="relative p-2 text-bitcoin-dim hover:text-bitcoin-text transition-colors rounded-lg hover:bg-bitcoin-surface"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-bitcoin-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1.5 bg-bitcoin-surface rounded-lg border border-bitcoin-border">
              <span className="w-2 h-2 bg-bitcoin-green rounded-full animate-pulse" />
              <span className="text-xs text-bitcoin-dim">Live</span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-bitcoin-dim hover:text-bitcoin-text"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
