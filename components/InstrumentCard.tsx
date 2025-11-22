"use client";

import { Instrument } from "@/lib/types";
import { SparklineChart } from "./SparklineChart";

interface InstrumentCardProps {
  instrument: Instrument;
}

export function InstrumentCard({ instrument }: InstrumentCardProps) {
  const isPositive = instrument.changeValue >= 0;
  const changeColor = isPositive ? "text-orange-600" : "text-red-600";
  const chartColor = isPositive ? "#ea580c" : "#dc2626";

  const formatPrice = (price: number) => {
    if (instrument.category === "fx") {
      return price.toFixed(4);
    }
    if (price >= 1000) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(2);
  };

  const formatChange = (value: number) => {
    const formatted =
      Math.abs(value) >= 1
        ? value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : value.toFixed(2);
    return value >= 0 ? `+${formatted}` : formatted;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900">{instrument.name}</h3>
        <p className="text-xs text-gray-500 tracking-wider uppercase font-mono">
          {instrument.displaySymbol}
        </p>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 tabular-nums mb-1">
          {formatPrice(instrument.lastPrice)}
        </div>
        <div className={`text-sm tabular-nums ${changeColor} font-medium`}>
          {formatChange(instrument.changeValue)}{" "}
          <span className="text-xs">
            ({formatChange(instrument.changePercent)}%)
          </span>
        </div>
      </div>

      <div className="mb-3">
        <SparklineChart data={instrument.history} accentColor={chartColor} />
      </div>

      {instrument.meta && (
        <div className="text-xs text-gray-500 font-mono mb-2 leading-relaxed">
          Closest to spot: +$
          {instrument.meta.lowestPremiumOverSpotUsd?.toFixed(2)} (
          {instrument.meta.lowestPremiumPercent?.toFixed(2)}%) · $
          {instrument.meta.lowestTotalPriceUsd?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      )}

      {instrument.unit && (
        <div className="text-xs text-gray-400 tracking-widest uppercase font-mono">
          {instrument.unit}
        </div>
      )}
    </div>
  );
}
