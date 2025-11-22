export interface GoldScrapPrice {
  id: string;
  karat: number;
  price_per_gram: number;
  price_per_pennyweight: number;
  price_per_troy_oz: number;
  spot_price_used: number;
  buy_percentage: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoldScrapPriceUpdate {
  karat?: number;
  price_per_gram?: number;
  price_per_pennyweight?: number;
  price_per_troy_oz?: number;
  spot_price_used?: number;
  buy_percentage?: number;
  name?: string;
  description?: string;
  is_active?: boolean;
}
