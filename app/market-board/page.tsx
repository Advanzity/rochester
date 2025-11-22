"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { InstrumentCard } from "@/components/InstrumentCard";
import { ReserveCard } from "@/components/ReserveCard";
import { SectionHeader } from "@/components/SectionHeader";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MarketBoardPage() {
  const { getByCategory, lastUpdated, isLoading, isError } = useMarketData({
    refreshMs: 30000,
  });
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  const metals = getByCategory("metal");
  const crypto = getByCategory("crypto");
  const currencies = getByCategory("fx");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back to apps
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 font-grotesk">
                Market Board
              </h1>
              <p className="text-sm text-gray-600 tracking-wide">
                Live reference for metals, crypto & currencies
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 tabular-nums font-mono">
                {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
              </div>
              <div className="text-sm text-gray-600">
                {currentTime
                  ? format(currentTime, "EEEE, MMMM d, yyyy")
                  : "Loading..."}
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-orange-50 border border-orange-200">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></div>
                <span className="text-xs text-orange-700 font-mono tracking-wide">
                  {isLoading && metals.length === 0
                    ? "LOADING..."
                    : isError
                    ? "DATA UNAVAILABLE"
                    : "LIVE · AUTO-REFRESH"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-16">
          <SectionHeader
            label="METALS"
            subtitle="Bullion market reference"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metals.map((instrument) => (
              <InstrumentCard key={instrument.id} instrument={instrument} />
            ))}
          </div>
        </section>

        <div className="border-t border-gray-200 mb-16"></div>

        <section className="mb-16">
          <SectionHeader
            label="CRYPTO"
            subtitle="For crypto-aware customers"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {crypto.map((instrument) => (
              <InstrumentCard key={instrument.id} instrument={instrument} />
            ))}
            <ReserveCard type="crypto" />
            <ReserveCard type="crypto" />
          </div>
        </section>

        <div className="border-t border-gray-200 mb-16"></div>

        <section className="mb-16">
          <SectionHeader
            label="CURRENCIES"
            subtitle="Foreign exchange rates"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currencies.map((instrument) => (
              <InstrumentCard key={instrument.id} instrument={instrument} />
            ))}
            <ReserveCard type="fx" />
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 mt-16">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <p>
              Internal reference only. Store buy/sell prices may differ from
              market spot.
            </p>
            <p className="font-mono">
              {lastUpdated
                ? `Last updated: ${format(lastUpdated, "HH:mm:ss")} · Gold: FindBullionPrices · Crypto: CoinGecko · auto-refresh every 30s`
                : "Loading market data..."}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
