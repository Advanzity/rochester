export const CRYPTO_API_BASE_URL =
  process.env.CRYPTO_API_BASE_URL ?? "https://api.coingecko.com/api/v3";

export const CRYPTO_API_KEY = process.env.CRYPTO_API_KEY ?? "";

export const SUPPORTED_COINS = {
  btc: {
    id: "bitcoin",
    symbol: "BTC",
    displaySymbol: "BTC / USD",
    name: "Bitcoin",
  },
  eth: {
    id: "ethereum",
    symbol: "ETH",
    displaySymbol: "ETH / USD",
    name: "Ethereum",
  },
} as const;

export type SupportedCoinKey = keyof typeof SUPPORTED_COINS;
