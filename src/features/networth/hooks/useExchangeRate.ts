"use client";

import { useState, useEffect, useRef } from "react";
import { DEFAULT_CURRENCY } from "../constants";
import type { CurrencyInfo } from "../constants";

interface ExchangeRateState {
  rate: number | null;
  currencyCode: string;
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
}

export function useExchangeRate(currency: CurrencyInfo = DEFAULT_CURRENCY): ExchangeRateState {
  const [state, setState] = useState<ExchangeRateState>({
    rate: null,
    currencyCode: currency.code,
    loading: true,
    error: null,
    fetchedAt: null,
  });

  const currencyRef = useRef(currency.code);

  useEffect(() => {
    let cancelled = false;
    currencyRef.current = currency.code;

    setState({
      rate: null,
      currencyCode: currency.code,
      loading: true,
      error: null,
      fetchedAt: null,
    });

    async function fetchRate() {
      try {
        const res = await fetch(`/api/networth/exchange-rate?currency=${currency.code}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        if (!cancelled && currencyRef.current === currency.code) {
          setState({
            rate: json.rate,
            currencyCode: json.currency || currency.code,
            loading: false,
            error: json.fallback ? "Using approximate rate" : null,
            fetchedAt: new Date().toISOString(),
          });
        }
      } catch {
        if (!cancelled && currencyRef.current === currency.code) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Could not fetch live rate",
            rate: prev.rate ?? currency.fallbackRate,
            currencyCode: currency.code,
          }));
        }
      }
    }

    fetchRate();
    const interval = setInterval(fetchRate, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currency.code, currency.fallbackRate]);

  return state;
}
