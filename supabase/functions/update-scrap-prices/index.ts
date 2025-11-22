import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let spotPrice = 2650;
    let buyPercentage = 0.85;

    // Check if request has custom values
    if (req.method === "POST") {
      try {
        const body: UpdateRequest = await req.json();
        if (body.spotPrice) spotPrice = body.spotPrice;
        if (body.buyPercentage) buyPercentage = body.buyPercentage;
      } catch {
        // Use defaults if JSON parse fails
      }
    }

    // If no spot price provided, fetch from our gold price function
    if (spotPrice === 2650) {
      try {
        const goldPriceUrl = `${supabaseUrl}/functions/v1/get-gold-spot-price`;
        const goldResponse = await fetch(goldPriceUrl);
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

    // Fetch all active scrap prices
    const { data: prices, error: fetchError } = await supabase
      .from("gold_scrap_prices")
      .select("*")
      .eq("is_active", true);

    if (fetchError) {
      throw new Error(`Failed to fetch prices: ${fetchError.message}`);
    }

    const updates = [];
    const results = [];

    // Update each karat level
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

    return new Response(
      JSON.stringify({
        success: true,
        updated: results.length,
        spotPrice,
        buyPercentage,
        prices: results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
