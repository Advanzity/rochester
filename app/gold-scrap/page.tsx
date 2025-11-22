"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, RefreshCw } from "lucide-react";
import { GoldScrapPrice } from "@/lib/supabase/types";

export default function GoldScrapPage() {
  const [prices, setPrices] = useState<GoldScrapPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    spot_price_used: string;
    buy_percentage: string;
  }>({ spot_price_used: "", buy_percentage: "" });
  const [liveSpotPrice, setLiveSpotPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchPrices();
    fetchLiveSpotPrice();
  }, []);

  const fetchLiveSpotPrice = async () => {
    try {
      const res = await fetch("/api/gold-spot-price");
      const data = await res.json();
      if (data.price) {
        setLiveSpotPrice(data.price);
      }
    } catch (error) {
      console.error("Failed to fetch live spot price:", error);
    }
  };

  const handleUpdateAllPrices = async () => {
    if (!confirm("Update all prices with current spot price?")) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/update-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        await fetchPrices();
        await fetchLiveSpotPrice();
        alert(`Successfully updated ${data.updated} price tiers`);
      } else {
        alert("Failed to update prices: " + data.error);
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      alert("Failed to update prices");
    } finally {
      setUpdating(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/scrap-prices");
      const data = await res.json();
      setPrices(data.prices || []);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (price: GoldScrapPrice) => {
    setEditingId(price.id);
    setEditValues({
      spot_price_used: price.spot_price_used.toString(),
      buy_percentage: (price.buy_percentage * 100).toString(),
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ spot_price_used: "", buy_percentage: "" });
  };

  const handleSave = async (id: string) => {
    try {
      const spotPrice = parseFloat(editValues.spot_price_used);
      const buyPercentage = parseFloat(editValues.buy_percentage) / 100;

      if (isNaN(spotPrice) || isNaN(buyPercentage)) {
        alert("Please enter valid numbers");
        return;
      }

      const res = await fetch(`/api/scrap-prices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_price_used: spotPrice,
          buy_percentage: buyPercentage,
        }),
      });

      if (res.ok) {
        await fetchPrices();
        setEditingId(null);
      } else {
        alert("Failed to update price");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to update price");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <PageShell title="Gold Scrap Pricing">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading prices...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Gold Scrap Pricing"
      subtitle="Current buy prices for gold scrap based on karat purity"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-gray-600">Live Gold Spot Price</div>
              <div className="text-2xl font-bold text-gray-900">
                {liveSpotPrice ? formatCurrency(liveSpotPrice) : "Loading..."}
              </div>
            </div>
          </div>
          <Button
            onClick={handleUpdateAllPrices}
            disabled={updating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
            {updating ? "Updating..." : "Update All Prices"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prices.map((price) => {
            const isEditing = editingId === price.id;
            const purity = ((price.karat / 24) * 100).toFixed(2);

            return (
              <Card key={price.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{price.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {purity}% Pure Gold
                      </p>
                    </div>
                    {!isEditing ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(price)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(price.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`spot-${price.id}`} className="text-xs">
                          Spot Price (USD)
                        </Label>
                        <Input
                          id={`spot-${price.id}`}
                          type="number"
                          step="0.01"
                          value={editValues.spot_price_used}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              spot_price_used: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`buy-${price.id}`} className="text-xs">
                          Buy Percentage (%)
                        </Label>
                        <Input
                          id={`buy-${price.id}`}
                          type="number"
                          step="0.1"
                          value={editValues.buy_percentage}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              buy_percentage: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border-b pb-2">
                        <div className="text-xs text-gray-500">Per Gram</div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatCurrency(price.price_per_gram)}
                        </div>
                      </div>
                      <div className="border-b pb-2">
                        <div className="text-xs text-gray-500">
                          Per Pennyweight
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatCurrency(price.price_per_pennyweight)}
                        </div>
                      </div>
                      <div className="border-b pb-2">
                        <div className="text-xs text-gray-500">
                          Per Troy Ounce
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatCurrency(price.price_per_troy_oz)}
                        </div>
                      </div>
                      <div className="pt-2 text-xs text-gray-500">
                        <div>
                          Based on spot: {formatCurrency(price.spot_price_used)}
                        </div>
                        <div>
                          Buy rate: {(price.buy_percentage * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            Conversion Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <strong>1 Troy Ounce</strong> = 31.1035 grams
            </div>
            <div>
              <strong>1 Troy Ounce</strong> = 20 pennyweights
            </div>
            <div>
              <strong>1 Pennyweight</strong> = 1.555 grams
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
