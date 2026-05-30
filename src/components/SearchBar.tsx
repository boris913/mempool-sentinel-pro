"use client";

import { useState, useRef, useEffect } from "react";
import { universalSearch, SearchResult } from "@/lib/mempool-api";
import { Search, X, Loader2 } from "lucide-react";
import SearchResultModal from "./SearchResultModal";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setShowRecent(false);
    try {
      const res = await universalSearch(query);
      setResult(res);
      setModalOpen(true);
      if (res.type !== "error") {
        setRecentSearches((prev) => [query, ...prev.filter((s) => s !== query)].slice(0, 5));
      }
    } catch {
      setResult({ type: "error", message: "Erreur de recherche" });
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") {
      setShowRecent(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowRecent(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <form 
        onSubmit={handleSearch} 
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bitcoin-dim" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => recentSearches.length > 0 && setShowRecent(true)}
            onKeyDown={handleKeyDown}
            placeholder="TXID, adresse, hauteur de bloc..."
            className="w-full bg-bitcoin-surface border border-bitcoin-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-bitcoin-text placeholder-bitcoin-dim/60 focus:outline-none focus:border-bitcoin-orange/60 focus:ring-1 focus:ring-bitcoin-orange/20 transition-all font-mono"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-bitcoin-dim hover:text-bitcoin-text transition-colors" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bitcoin-orange animate-spin" />
          )}
        </div>

        {showRecent && recentSearches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bitcoin-surface border border-bitcoin-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 text-xs text-bitcoin-dim uppercase tracking-wider">Recherches récentes</div>
            {recentSearches.map((search, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setQuery(search); setShowRecent(false); handleSearch(); }}
                className="w-full text-left px-3 py-2 text-sm text-bitcoin-text hover:bg-bitcoin-border/30 transition-colors font-mono"
              >
                {search}
              </button>
            ))}
          </div>
        )}
      </form>
      <SearchResultModal isOpen={modalOpen} onClose={() => setModalOpen(false)} result={result} />
    </>
  );
}
