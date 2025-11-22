export interface MetalListing {
  productName: string;
  productUrl: string;
  dealerName: string;
  dealerUrl: string;
  premiumOverSpotUsd: number;
  premiumPercent: number;
  totalPriceUsd: number;
  shippingNote?: string;
}

export interface MetalSpotSnapshot {
  spotPriceUsdPerOz: number;
  listings: MetalListing[];
  scrapedAt: string; // ISO
  source: "findbullionprices";
  metal: "Gold" | "Silver" | "Platinum";
}

export type GoldListing = MetalListing;
export type GoldSpotSnapshot = MetalSpotSnapshot;
