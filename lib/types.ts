export type Category = "metal" | "crypto" | "fx";

export interface InstrumentMeta {
  source?: string;
  lowestPremiumOverSpotUsd?: number;
  lowestPremiumPercent?: number;
  lowestTotalPriceUsd?: number;
  lowestDealerName?: string;
}

export interface Instrument {
  id: string;
  name: string;
  symbol: string;
  displaySymbol: string;
  category: Category;
  currency: string;
  lastPrice: number;
  changeValue: number;
  changePercent: number;
  history: number[];
  updatedAt: Date | string;
  unit?: string;
  meta?: InstrumentMeta;
}

export interface InstrumentDefinition {
  id: string;
  name: string;
  symbol: string;
  displaySymbol: string;
  category: Category;
  currency: string;
  basePrice: number;
  volatility: number;
  unit?: string;
}
