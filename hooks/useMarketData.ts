"use client";

import { useEffect, useState } from "react";
import { Instrument, Category } from "@/lib/types";

interface UseMarketDataOptions {
  refreshMs?: number;
}

interface UseMarketDataResult {
  instruments: Instrument[];
  isLoading: boolean;
  isError: boolean;
  lastUpdated: Date | null;
  getByCategory: (category: Category) => Instrument[];
}

export function useMarketData(
  options: UseMarketDataOptions = {}
): UseMarketDataResult {
  const { refreshMs = 30000 } = options;
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchData = async () => {
      try {
        setIsError(false);
        const res = await fetch("/api/market-data", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to fetch market data: ${res.status}`);
        }

        const json = await res.json();
        const data = (json.instruments ?? []) as Instrument[];

        if (!isMounted) return;

        setInstruments((prev) => {
          const prevById = new Map(prev.map((i) => [i.id, i]));
          return data.map((current) => {
            const existing = prevById.get(current.id);
            const history = existing?.history ?? [];
            const nextHistory = [...history, current.lastPrice].slice(-50);

            return {
              ...current,
              history: nextHistory,
            };
          });
        });

        setLastUpdated(new Date());
        setIsLoading(false);
      } catch (error) {
        console.error("useMarketData error:", error);
        if (!isMounted) return;
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchData();
    intervalId = setInterval(fetchData, refreshMs);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshMs]);

  const getByCategory = (category: Category): Instrument[] => {
    return instruments.filter((i) => i.category === category);
  };

  return {
    instruments,
    isLoading,
    isError,
    lastUpdated,
    getByCategory,
  };
}
