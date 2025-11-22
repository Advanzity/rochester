"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface SpotPriceWidgetProps {
  onUpdate?: () => void;
}

export function SpotPriceWidget({ onUpdate }: SpotPriceWidgetProps) {
  const [spotPrice, setSpotPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSpotPrice = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gold-spot-price");
      const data = await res.json();
      if (data.price) {
        setSpotPrice(data.price);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch spot price:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpotPrice();
    const interval = setInterval(fetchSpotPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div>
        <div className="text-sm text-gray-600">Live Gold Spot Price</div>
        <div className="text-2xl font-bold text-gray-900">
          {loading && !spotPrice ? (
            "Loading..."
          ) : spotPrice ? (
            formatCurrency(spotPrice)
          ) : (
            "Unavailable"
          )}
        </div>
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Updated at {formatTime(lastUpdated)}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          fetchSpotPrice();
          onUpdate?.();
        }}
        disabled={loading}
        className="ml-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
