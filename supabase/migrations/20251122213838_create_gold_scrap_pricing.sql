/*
  # Gold Scrap Pricing System

  1. New Tables
    - `gold_scrap_prices`
      - `id` (uuid, primary key) - Unique identifier
      - `karat` (integer) - Gold purity (10K, 14K, 18K, 22K, 24K)
      - `price_per_gram` (decimal) - Current price per gram in USD
      - `price_per_pennyweight` (decimal) - Current price per pennyweight in USD
      - `price_per_troy_oz` (decimal) - Current price per troy ounce in USD
      - `spot_price_used` (decimal) - The spot price this calculation is based on
      - `buy_percentage` (decimal) - Percentage of spot price offered (e.g., 0.85 for 85%)
      - `name` (text) - Display name (e.g., "10 Karat Gold")
      - `description` (text, optional) - Additional notes
      - `is_active` (boolean) - Whether this pricing tier is active
      - `created_at` (timestamptz) - When the price was created
      - `updated_at` (timestamptz) - When the price was last updated

  2. Security
    - Enable RLS on `gold_scrap_prices` table
    - Public read access (anyone can view prices)
    - Authenticated users can manage prices (for now - can be restricted later)
    
  3. Notes
    - Conversion factors: 1 troy oz = 31.1035 grams = 20 pennyweights
    - Karat purity: 24K = 100%, 22K = 91.67%, 18K = 75%, 14K = 58.33%, 10K = 41.67%
*/

CREATE TABLE IF NOT EXISTS gold_scrap_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  karat integer NOT NULL UNIQUE,
  price_per_gram decimal(10, 2) NOT NULL DEFAULT 0,
  price_per_pennyweight decimal(10, 2) NOT NULL DEFAULT 0,
  price_per_troy_oz decimal(10, 2) NOT NULL DEFAULT 0,
  spot_price_used decimal(10, 2) NOT NULL DEFAULT 0,
  buy_percentage decimal(5, 4) NOT NULL DEFAULT 0.85,
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gold_scrap_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gold scrap prices"
  ON gold_scrap_prices
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert gold scrap prices"
  ON gold_scrap_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gold scrap prices"
  ON gold_scrap_prices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete gold scrap prices"
  ON gold_scrap_prices
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default pricing tiers
INSERT INTO gold_scrap_prices (karat, name, buy_percentage) VALUES
  (10, '10 Karat Gold', 0.85),
  (14, '14 Karat Gold', 0.85),
  (18, '18 Karat Gold', 0.85),
  (22, '22 Karat Gold', 0.85),
  (24, '24 Karat Gold', 0.85)
ON CONFLICT (karat) DO NOTHING;
