"use client";

import { useState, useEffect, useCallback } from "react";
import { GOLD_REFERENCE_PRICES } from "../constants";

interface GoldPriceState {
  price24k: number | null;
  price22k: number | null;
  source: string | null;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
}

const FALLBACK: GoldPriceState = {
  price24k: GOLD_REFERENCE_PRICES.price24kPerGram,
  price22k: GOLD_REFERENCE_PRICES.price22kPerGram,
  source: "Approximate (offline)",
  updatedAt: GOLD_REFERENCE_PRICES.lastUpdated,
  loading: false,
  error: null,
};

const INITIAL_STATE: GoldPriceState = {
  price24k: null,
  price22k: null,
  source: null,
  updatedAt: null,
  loading: true,
  error: null,
};

export function useGoldPrice(): GoldPriceState & { refresh: () => void } {
  const [state, setState] = useState<GoldPriceState>(INITIAL_STATE);

  const fetchPrices = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const res = await fetch("/api/networth/gold-price");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setState({
        price24k: json.price24kPerGram ?? null,
        price22k: json.price22kPerGram ?? null,
        source: json.source ?? null,
        updatedAt: json.lastUpdated ?? null,
        loading: false,
        error: null,
      });
    } catch {
      setState(FALLBACK);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { ...state, refresh: fetchPrices };
}
