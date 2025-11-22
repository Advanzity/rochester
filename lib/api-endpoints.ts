export const API_ENDPOINTS = {
  scrapPrices: {
    list: "/api/scrap-prices",
    create: "/api/scrap-prices",
    update: (id: string) => `/api/scrap-prices/${id}`,
    delete: (id: string) => `/api/scrap-prices/${id}`,
  },
  goldSpotPrice: "/api/gold-spot-price",
  updatePrices: "/api/update-prices",
  gold: "/api/gold",
  marketData: "/api/market-data",
} as const;
