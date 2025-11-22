import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GoldAPIResponse {
  price: number;
  timestamp: number;
  metal: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const metal = url.searchParams.get("metal") || "gold";
    
    // Use metals-api.com free tier (1000 requests/month)
    // Alternative: goldapi.io, metalpriceapi.com
    const apiKey = Deno.env.get("METALS_API_KEY") || "";
    
    let spotPrice = 2650; // Default fallback
    let source = "fallback";
    
    // Try multiple sources in order of preference
    try {
      // Option 1: Metals-API.com (requires API key)
      if (apiKey) {
        const response = await fetch(
          `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAU`,
          { headers: { "Accept": "application/json" } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rates && data.rates.XAU) {
            // Convert from USD per XAU to USD per oz (inverted rate)
            spotPrice = 1 / data.rates.XAU;
            source = "metals-api";
          }
        }
      }
    } catch (err) {
      console.error("Metals-API error:", err);
    }
    
    // Option 2: Try Goldapi.io (requires API key)
    if (source === "fallback") {
      try {
        const goldApiKey = Deno.env.get("GOLDAPI_KEY");
        if (goldApiKey) {
          const response = await fetch(
            "https://www.goldapi.io/api/XAU/USD",
            { headers: { "x-access-token": goldApiKey } }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.price) {
              spotPrice = data.price;
              source = "goldapi";
            }
          }
        }
      } catch (err) {
        console.error("GoldAPI error:", err);
      }
    }
    
    // Option 3: Try free public API (limited data)
    if (source === "fallback") {
      try {
        const response = await fetch(
          "https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU"
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.rates && data.rates.XAU) {
            spotPrice = 1 / data.rates.XAU;
            source = "metalpriceapi-demo";
          }
        }
      } catch (err) {
        console.error("MetalPriceAPI error:", err);
      }
    }
    
    const result: GoldAPIResponse = {
      price: Math.round(spotPrice * 100) / 100,
      timestamp: Date.now(),
      metal: metal,
    };
    
    return new Response(
      JSON.stringify({ 
        ...result, 
        source,
        note: source === "fallback" ? "Using fallback price. Configure METALS_API_KEY or GOLDAPI_KEY for live data." : undefined
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
        error: "Failed to fetch gold price",
        price: 2650,
        timestamp: Date.now(),
        metal: "gold",
        source: "error-fallback"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
