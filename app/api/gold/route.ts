import { NextRequest, NextResponse } from "next/server";
import { scrapeFindBullionPrices1ozGold } from "@/lib/metals/findBullionPrices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await scrapeFindBullionPrices1ozGold();
    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[/api/gold] scraping error", error);
    return NextResponse.json(
      { error: "Failed to load gold data from FindBullionPrices" },
      { status: 503 },
    );
  }
}
