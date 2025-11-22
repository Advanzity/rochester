import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { spot_price_used, buy_percentage, name, description, is_active } =
      body;

    const { data: existing, error: fetchError } = await supabase
      .from("gold_scrap_prices")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Price not found" },
        { status: 404 }
      );
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
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating scrap price:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ price: data }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to update scrap price" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from("gold_scrap_prices")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting scrap price:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to delete scrap price" },
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
