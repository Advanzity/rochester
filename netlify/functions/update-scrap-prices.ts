import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

interface UpdateRequest {
  spotPrice?: number;
  buyPercentage?: number;
}

function getKaratPurity(karat: number): number {
  const purities: Record<number, number> = {
    10: 0.4167,
    14: 0.5833,
    18: 0.75,
    22: 0.9167,
    24: 1.0,
  };
  return purities[karat] || karat / 24;
}

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let spotPrice = 2650;
    let buyPercentage = 0.85;

    if (event.httpMethod === "POST" && event.body) {
      try {
        const body: UpdateRequest = JSON.parse(event.body);
        if (body.spotPrice) spotPrice = body.spotPrice;
        if (body.buyPercentage) buyPercentage = body.buyPercentage;
      } catch {
        // Use defaults
      }
    }

    if (spotPrice === 2650) {
      try {
        const baseUrl = process.env.URL || "http://localhost:8888";
        const goldResponse = await fetch(
          `${baseUrl}/.netlify/functions/get-gold-spot-price`
        );
        if (goldResponse.ok) {
          const goldData = await goldResponse.json();
          if (goldData.price) {
            spotPrice = goldData.price;
          }
        }
      } catch (err) {
        console.error("Failed to fetch spot price:", err);
      }
    }

    const { data: prices, error: fetchError } = await supabase
      .from("gold_scrap_prices")
      .select("*")
      .eq("is_active", true);

    if (fetchError) {
      throw new Error(`Failed to fetch prices: ${fetchError.message}`);
    }

    const results = [];

    for (const price of prices || []) {
      const karatPurity = getKaratPurity(price.karat);
      const pricePerTroyOz = spotPrice * karatPurity * buyPercentage;
      const pricePerGram = pricePerTroyOz / 31.1035;
      const pricePerPennyweight = pricePerTroyOz / 20;

      const { data: updated, error: updateError } = await supabase
        .from("gold_scrap_prices")
        .update({
          spot_price_used: spotPrice,
          buy_percentage: buyPercentage,
          price_per_gram: Math.round(pricePerGram * 100) / 100,
          price_per_pennyweight: Math.round(pricePerPennyweight * 100) / 100,
          price_per_troy_oz: Math.round(pricePerTroyOz * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq("id", price.id)
        .select()
        .single();

      if (updateError) {
        console.error(`Failed to update ${price.name}:`, updateError);
      } else {
        results.push(updated);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        updated: results.length,
        spotPrice,
        buyPercentage,
        prices: results,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export { handler };
