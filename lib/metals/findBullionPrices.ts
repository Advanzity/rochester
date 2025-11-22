// Server-side only: HTML scraping for internal dashboard use.
// IMPORTANT: This scraper is for low-frequency, internal use only.
// Before deploying to production:
//   1. Check https://findbullionprices.com/robots.txt
//   2. Review the site's terms of service
//   3. Keep request frequency low (current cache: 60 seconds)
//   4. Consider contacting the site owner for permission
// This implementation includes caching to minimize load on the source site.

import "server-only";
import * as cheerio from "cheerio";
import { MetalSpotSnapshot, MetalListing } from "./types";

const METAL_URLS = {
  Gold: "https://findbullionprices.com/gold/closest-to-spot.php?category=gold&type=&weight=1",
  Silver: "https://findbullionprices.com/closest-to-spot/?category=silver&type=&weight=1",
  Platinum: "https://findbullionprices.com/closest-to-spot/?category=platinum&type=&weight=1",
} as const;

export type MetalKey = keyof typeof METAL_URLS; // "Gold" | "Silver" | "Platinum"

const CACHE_DURATION_MS = 60_000;

const cache: Partial<
  Record<MetalKey, { snapshot: MetalSpotSnapshot; timestamp: number }>
> = {};

/**
 * Scrapes FindBullionPrices for 1 oz coins/bars for a given metal and returns
 * the spot price + top listings.
 */
async function scrapeMetalPrices(metal: MetalKey): Promise<MetalSpotSnapshot> {
  const now = Date.now();
  const cacheKey = metal;

  const cached = cache[cacheKey];
  if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
    return cached.snapshot;
  }

  const url = METAL_URLS[metal];

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RochesterJewelry/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch FindBullionPrices HTML (${metal}): ${res.status}`
    );
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const metalName = metal; // already "Gold" | "Silver" | "Platinum"

  // --- Spot price parsing ---
  // Instead of trying to pick a specific element, just search the full page text.
  const fullText = $.root().text();

  const spotPatterns: RegExp[] = [
    // e.g. "Spot Gold Price: $4162.59 per ounce"
    new RegExp(`Spot ${metalName} Price:\\s*\\$([\\d,]+(?:\\.\\d+)?)`, "i"),
    // e.g. "Gold Spot Price: $4162.59 per ounce"
    new RegExp(`${metalName} Spot Price:\\s*\\$([\\d,]+(?:\\.\\d+)?)`, "i"),
    // e.g. "Silver Spot Price: $52.43 per ounce Free Shipping"
    new RegExp(
      `${metalName}\\s+Spot\\s+Price:\\s*\\$([\\d,]+(?:\\.\\d+)?)`,
      "i"
    ),
    // generic "X Spot Price: $1234.56 per ounce"
    new RegExp(
      `${metalName}[^$\\n]*?\\$([\\d,]+(?:\\.\\d+)?)\\s*per\\s*ounce`,
      "i"
    ),
    // fallback: "Gold: $4162.59  Silver: $52.39  Platinum: ..."
    new RegExp(`${metalName}:\\s*\\$([\\d,]+(?:\\.\\d+)?)`, "i"),
  ];

  let spotMatch: RegExpMatchArray | null = null;
  for (const pattern of spotPatterns) {
    spotMatch = fullText.match(pattern);
    if (spotMatch) break;
  }

  if (!spotMatch) {
    // Helpful debug if you want to log:
    // console.error(`Spot text snippet for ${metal}:`, fullText.slice(300, 450));
    throw new Error(`Unable to parse spot ${metal} price from page`);
  }

  const spotPriceUsdPerOz = parseFloat(spotMatch[1].replace(/,/g, ""));

  // --- Listings table parsing ---
  const tables = $("table");
  let listingsTable: any = null;

  tables.each((_: number, table: any) => {
    const headerText = $(table).text();
    if (
      headerText.includes("Product") &&
      headerText.includes("Dealer") &&
      headerText.includes("Lowest Price")
    ) {
      listingsTable = $(table);
      return false; // break
    }
    return undefined;
  });

  const listings: MetalListing[] = [];

  if (listingsTable) {
    const rows = listingsTable.find("tr").slice(1); // skip header row

    rows.each((index: number, row: any) => {
      if (index >= 15) return false;

      const cells = $(row).find("td");
      if (cells.length < 4) return;

      // Product cell
      const productLink = $(cells[0]).find("a").first();
      const productName = productLink.text().trim();
      const productUrl = productLink.attr("href") ?? "";

      // Dealer cell
      const dealerCell = $(cells[1]);
      const dealerLink = dealerCell.find("a").first();
      const dealerName = dealerLink.text().trim();
      const dealerUrl = dealerLink.attr("href") ?? "";
      const shippingNote =
        dealerCell
          .clone()
          .children("a")
          .remove()
          .end()
          .text()
          .trim() || undefined;

      // Premium cell:
      // For gold/platinum: often like "$13.64 per coin"
      // For silver: often a numeric premium like "0.79"
      const premiumText = $(cells[2]).text().trim();
      let premiumOverSpotUsd = 0;

      const premiumDollarMatch = premiumText.match(/\$([\d,]+(?:\.\d+)?)/);
      if (premiumDollarMatch) {
        premiumOverSpotUsd = parseFloat(
          premiumDollarMatch[1].replace(/,/g, "")
        );
      } else {
        const numericPremiumMatch = premiumText.match(/([+-]?\d+(?:\.\d+)?)/);
        if (numericPremiumMatch) {
          premiumOverSpotUsd = parseFloat(numericPremiumMatch[1]);
        }
      }

      // % premium – often in the same or next cell
      const percentText = (premiumText + " " + $(cells[3]).text()).trim();
      const percentMatch = percentText.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
      const premiumPercent = percentMatch ? parseFloat(percentMatch[1]) : 0;

      // Lowest price cell – look for the first $ amount
      const priceText = $(cells[3]).text().trim();
      const priceMatch = priceText.match(/\$([\d,]+(?:\.\d+)?)/);
      const totalPriceUsd = priceMatch
        ? parseFloat(priceMatch[1].replace(/,/g, ""))
        : 0;

      if (!productName || !dealerName || !totalPriceUsd) return;

      listings.push({
        productName,
        productUrl,
        dealerName,
        dealerUrl,
        premiumOverSpotUsd,
        premiumPercent,
        totalPriceUsd,
        shippingNote,
      });
    });
  }

  const snapshot: MetalSpotSnapshot = {
    spotPriceUsdPerOz,
    listings,
    scrapedAt: new Date().toISOString(),
    source: "findbullionprices",
    metal,
  };

  cache[cacheKey] = { snapshot, timestamp: now };

  return snapshot;
}

// Convenience wrappers

export async function scrapeFindBullionPrices1ozGold(): Promise<MetalSpotSnapshot> {
  return scrapeMetalPrices("Gold");
}

export async function scrapeFindBullionPrices1ozSilver(): Promise<MetalSpotSnapshot> {
  return scrapeMetalPrices("Silver");
}

export async function scrapeFindBullionPrices1ozPlatinum(): Promise<MetalSpotSnapshot> {
  return scrapeMetalPrices("Platinum");
}
