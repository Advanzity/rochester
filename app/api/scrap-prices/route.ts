import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("gold_scrap_prices")
      .select("*")
      .eq("is_active", true)
      .order("karat", { ascending: true });

    if (error) {
      console.error("Error fetching scrap prices:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prices: data }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrap prices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      karat,
      spot_price_used,
      buy_percentage = 0.85,
      name,
      description,
    } = body;

    if (!karat || !name) {
      return NextResponse.json(
        { error: "Karat and name are required" },
        { status: 400 }
      );
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
      console.error("Error creating scrap price:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ price: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to create scrap price" },
      { status: 500 }
    );
  }
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
