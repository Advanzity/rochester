"use client";

import { useState, useEffect } from "react";
import { Instrument, Category } from "@/lib/types";
import { instrumentDefinitions } from "@/lib/instruments";

// FUTURE: Real API Integration
// This hook currently uses simulated data with random price walks.
// For production, replace with real market data APIs:
//
// Metals: Use providers like Metals-API, Forex.com, or Bloomberg
//   - Endpoint: GET /api/metals/prices?symbols=XAU,XAG,XPT,XPD
//   - WebSocket: wss://api.provider.com/metals for live updates
//
// Crypto: Use CoinGecko, Binance, or Coinbase APIs
//   - Endpoint: GET /api/crypto/prices?symbols=BTC,ETH
//   - WebSocket: wss://ws.provider.com/crypto for real-time prices
//
// FX: Use providers like OANDA, Forex.com, or Alpha Vantage
//   - Endpoint: GET /api/fx/rates?pairs=EURUSD,GBPUSD,USDCAD
//   - WebSocket: wss://api.provider.com/fx for live rates
//
// Implementation approach:
// 1. Create a Next.js API route at /api/market-data to proxy requests
// 2. Store API keys in environment variables (never expose client-side)
// 3. Replace setInterval with WebSocket connections for real-time updates
// 4. Add error handling and fallback mechanisms
// 5. Consider rate limiting and caching strategies

const HISTORY_LENGTH = 50;
const UPDATE_INTERVAL = 5000;

function initializeInstrument(def: typeof instrumentDefinitions[0]): Instrument {
  const history = Array.from({ length: HISTORY_LENGTH }, () => def.basePrice);

  return {
    id: def.id,
    name: def.name,
    symbol: def.symbol,
    displaySymbol: def.displaySymbol,
    category: def.category,
    currency: def.currency,
    lastPrice: def.basePrice,
    changeValue: 0,
    changePercent: 0,
    history,
    updatedAt: new Date(),
    unit: def.unit,
  };
}

function updateInstrumentPrice(
  instrument: Instrument,
  def: typeof instrumentDefinitions[0]
): Instrument {
  const randomChange = (Math.random() - 0.5) * 2 * def.volatility;
  const newPrice = Math.max(instrument.lastPrice + randomChange, def.basePrice * 0.5);

  const changeValue = newPrice - def.basePrice;
  const changePercent = (changeValue / def.basePrice) * 100;

  const newHistory = [...instrument.history.slice(1), newPrice];

  return {
    ...instrument,
    lastPrice: newPrice,
    changeValue,
    changePercent,
    history: newHistory,
    updatedAt: new Date(),
  };
}

async function fetchRealGoldData(): Promise<{
  spotPrice: number;
  meta: any;
} | null> {
  try {
    const res = await fetch("/api/gold");
    if (!res.ok) return null;
    const data = await res.json();
    const bestListing = data.listings[0];
    return {
      spotPrice: data.spotPriceUsdPerOz,
      meta: bestListing
        ? {
            source: "findbullionprices",
            lowestPremiumOverSpotUsd: bestListing.premiumOverSpotUsd,
            lowestPremiumPercent: bestListing.premiumPercent,
            lowestTotalPriceUsd: bestListing.totalPriceUsd,
            lowestDealerName: bestListing.dealerName,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Failed to fetch real gold data:", error);
    return null;
  }
}

export function useSimulatedMarketData() {
  const [instruments, setInstruments] = useState<Instrument[]>(() =>
    instrumentDefinitions.map(initializeInstrument)
  );
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateData = async () => {
      const goldData = await fetchRealGoldData();

      setInstruments((prev) =>
        prev.map((instrument) => {
          const def = instrumentDefinitions.find((d) => d.id === instrument.id);
          if (!def) return instrument;

          if (instrument.id === "xau-usd" && goldData) {
            const changeValue = goldData.spotPrice - def.basePrice;
            const changePercent = (changeValue / def.basePrice) * 100;
            const newHistory = [...instrument.history.slice(1), goldData.spotPrice];

            return {
              ...instrument,
              lastPrice: goldData.spotPrice,
              changeValue,
              changePercent,
              history: newHistory,
              updatedAt: new Date(),
              meta: goldData.meta,
            };
          }

          return updateInstrumentPrice(instrument, def);
        })
      );
      setLastUpdate(new Date());
    };

    updateData();

    const interval = setInterval(() => {
      updateData();
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const getByCategory = (category: Category): Instrument[] => {
    return instruments.filter((i) => i.category === category);
  };

  return {
    instruments,
    lastUpdate,
    getByCategory,
  };
}
