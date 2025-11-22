import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Supabase URL not configured", price: 2650, source: "fallback" },
        { status: 200 }
      );
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/get-gold-spot-price`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch spot price", price: 2650, source: "fallback" },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching gold spot price:", error);
    return NextResponse.json(
      { error: "Failed to fetch spot price", price: 2650, source: "fallback" },
      { status: 200 }
    );
  }
}
