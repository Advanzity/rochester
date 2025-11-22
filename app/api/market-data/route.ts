import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { fetchCryptoInstruments } from "@/lib/crypto/fetchers";
import {
  scrapeFindBullionPrices1ozGold,
  scrapeFindBullionPrices1ozSilver,
  scrapeFindBullionPrices1ozPlatinum,
} from "@/lib/metals/findBullionPrices";
import { Instrument } from "@/lib/types";
import { instrumentDefinitions } from "@/lib/instruments";

export async function GET(request: NextRequest) {
  try {
    const [cryptoData, goldData, silverData, platinumData] = await Promise.allSettled([
      fetchCryptoInstruments(),
      scrapeFindBullionPrices1ozGold(),
      scrapeFindBullionPrices1ozSilver(),
      scrapeFindBullionPrices1ozPlatinum(),
    ]);

    const instruments: Instrument[] = [];
    const now = new Date().toISOString();

    const metalDataMap = [
      { data: goldData, id: "xau-usd", name: "Gold", symbol: "XAUUSD" },
      { data: silverData, id: "xag-usd", name: "Silver", symbol: "XAGUSD" },
      { data: platinumData, id: "xpt-usd", name: "Platinum", symbol: "XPTUSD" },
    ];

    for (const { data, id, name, symbol } of metalDataMap) {
      const def = instrumentDefinitions.find((d) => d.id === id);
      if (!def) continue;

      if (data.status === "fulfilled") {
        const bestListing = data.value.listings[0];
        const changeValue = data.value.spotPriceUsdPerOz - def.basePrice;
        const changePercent = (changeValue / def.basePrice) * 100;

        instruments.push({
          id,
          name,
          symbol,
          displaySymbol: `${symbol.slice(0, 3)} / USD`,
          category: "metal",
          currency: "USD",
          lastPrice: data.value.spotPriceUsdPerOz,
          changeValue,
          changePercent,
          history: [],
          updatedAt: now,
          unit: "TROY OZ",
          meta: bestListing
            ? {
                source: "findbullionprices",
                lowestPremiumOverSpotUsd: bestListing.premiumOverSpotUsd,
                lowestPremiumPercent: bestListing.premiumPercent,
                lowestTotalPriceUsd: bestListing.totalPriceUsd,
                lowestDealerName: bestListing.dealerName,
              }
            : undefined,
        });
      } else {
        instruments.push({
          id,
          name,
          symbol,
          displaySymbol: `${symbol.slice(0, 3)} / USD`,
          category: "metal",
          currency: "USD",
          lastPrice: def.basePrice,
          changeValue: 0,
          changePercent: 0,
          history: [],
          updatedAt: now,
          unit: "TROY OZ",
          meta: {
            source: "simulated (fetch failed)",
          },
        });
      }
    }

    if (cryptoData.status === "fulfilled") {
      instruments.push(...cryptoData.value);
    }

    const handledIds = new Set(instruments.map((i) => i.id));
    const simulatedInstruments = instrumentDefinitions
      .filter((def) => {
        if (handledIds.has(def.id)) return false;
        if (def.category === "crypto" && cryptoData.status === "fulfilled") return false;
        return true;
      })
      .map((def) => ({
        id: def.id,
        name: def.name,
        symbol: def.symbol,
        displaySymbol: def.displaySymbol,
        category: def.category,
        currency: def.currency,
        lastPrice: def.basePrice,
        changeValue: 0,
        changePercent: 0,
        history: [],
        updatedAt: now,
        unit: def.unit,
      }));

    instruments.push(...simulatedInstruments);

    return NextResponse.json(
      {
        instruments,
        meta: {
          sources: {
            gold: goldData.status === "fulfilled" ? "findbullionprices" : "unavailable",
            silver: silverData.status === "fulfilled" ? "findbullionprices" : "unavailable",
            platinum: platinumData.status === "fulfilled" ? "findbullionprices" : "unavailable",
            crypto: cryptoData.status === "fulfilled" ? "coingecko" : "unavailable",
            other: "simulated",
          },
          generatedAt: now,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[/api/market-data] error:", error);
    return NextResponse.json(
      { error: "Market data unavailable" },
      { status: 503 }
    );
  }
}
