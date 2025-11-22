/*
  # Update Gold Scrap Pricing Policies for Public Access

  1. Changes
    - Remove authenticated-only restrictions
    - Allow public INSERT, UPDATE, DELETE for internal dashboard use
    
  2. Notes
    - This is appropriate for an internal business dashboard
    - In production, you may want to add authentication or IP restrictions
*/

-- Drop existing authenticated policies
DROP POLICY IF EXISTS "Authenticated users can insert gold scrap prices" ON gold_scrap_prices;
DROP POLICY IF EXISTS "Authenticated users can update gold scrap prices" ON gold_scrap_prices;
DROP POLICY IF EXISTS "Authenticated users can delete gold scrap prices" ON gold_scrap_prices;

-- Create public policies for internal dashboard
CREATE POLICY "Public can insert gold scrap prices"
  ON gold_scrap_prices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update gold scrap prices"
  ON gold_scrap_prices
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete gold scrap prices"
  ON gold_scrap_prices
  FOR DELETE
  USING (true);
