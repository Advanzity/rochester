import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("gold_scrap_prices")
        .select("*")
        .eq("is_active", true)
        .order("karat", { ascending: true });

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ prices: data }),
      };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const {
        karat,
        spot_price_used,
        buy_percentage = 0.85,
        name,
        description,
      } = body;

      if (!karat || !name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Karat and name are required" }),
        };
      }

      const karatPurity = getKaratPurity(karat);
      const spotPrice = spot_price_used || 2650;

      const pricePerTroyOz = spotPrice * karatPurity * buy_percentage;
      const pricePerGram = pricePerTroyOz / 31.1035;
      const pricePerPennyweight = pricePerTroyOz / 20;

      const { data, error } = await supabase
        .from("gold_scrap_prices")
        .insert({
          karat,
          name,
          description: description || "",
          spot_price_used: spotPrice,
          buy_percentage,
          price_per_gram: pricePerGram,
          price_per_pennyweight: pricePerPennyweight,
          price_per_troy_oz: pricePerTroyOz,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ price: data }),
      };
    }

    const pathSegments = event.path.split("/");
    const id = pathSegments[pathSegments.length - 1];

    if (event.httpMethod === "PATCH" && id) {
      const body = JSON.parse(event.body || "{}");
      const { spot_price_used, buy_percentage, name, description, is_active } =
        body;

      const { data: existing, error: fetchError } = await supabase
        .from("gold_scrap_prices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !existing) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Price not found" }),
        };
      }

      const spotPrice = spot_price_used ?? existing.spot_price_used;
      const buyPercentage = buy_percentage ?? existing.buy_percentage;
      const karatPurity = getKaratPurity(existing.karat);

      const pricePerTroyOz = spotPrice * karatPurity * buyPercentage;
      const pricePerGram = pricePerTroyOz / 31.1035;
      const pricePerPennyweight = pricePerTroyOz / 20;

      const updates: any = {
        spot_price_used: spotPrice,
        buy_percentage: buyPercentage,
        price_per_gram: pricePerGram,
        price_per_pennyweight: pricePerPennyweight,
        price_per_troy_oz: pricePerTroyOz,
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (is_active !== undefined) updates.is_active = is_active;

      const { data, error } = await supabase
        .from("gold_scrap_prices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ price: data }),
      };
    }

    if (event.httpMethod === "DELETE" && id) {
      const { error } = await supabase
        .from("gold_scrap_prices")
        .delete()
        .eq("id", id);

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export { handler };
