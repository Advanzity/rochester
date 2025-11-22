import "server-only";
import { CRYPTO_API_BASE_URL, CRYPTO_API_KEY, SUPPORTED_COINS } from "./config";
import { Instrument } from "@/lib/types";

interface CoinGeckoSimplePriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

export async function fetchCryptoInstruments(): Promise<Instrument[]> {
  const coinIds = Object.values(SUPPORTED_COINS)
    .map((coin) => coin.id)
    .join(",");

  const url = new URL(`${CRYPTO_API_BASE_URL}/simple/price`);
  url.searchParams.set("ids", coinIds);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");

  const headers: HeadersInit = {};
  if (CRYPTO_API_KEY) {
    headers["x-cg-pro-api-key"] = CRYPTO_API_KEY;
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch crypto prices: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as CoinGeckoSimplePriceResponse;
  const nowIso = new Date().toISOString();

  const instruments: Instrument[] = [];

  for (const [key, cfg] of Object.entries(SUPPORTED_COINS)) {
    const entry = data[cfg.id];
    if (!entry || typeof entry.usd !== "number") {
      continue;
    }

    const lastPrice = entry.usd;
    const changePercent = entry.usd_24h_change ?? 0;
    const changeValue = (lastPrice * changePercent) / 100;

    instruments.push({
      id: key,
      name: cfg.name,
      symbol: cfg.symbol,
      displaySymbol: cfg.displaySymbol,
      category: "crypto",
      currency: "USD",
      lastPrice,
      changeValue,
      changePercent,
      history: [],
      updatedAt: nowIso,
      meta: {
        source: "coingecko",
      },
    });
  }

  return instruments;
}
