import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface GoldAPIResponse {
  price: number;
  timestamp: number;
  metal: string;
  source?: string;
  note?: string;
}

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const metal = event.queryStringParameters?.metal || "gold";

    let spotPrice = 2650;
    let source = "fallback";

    try {
      const metalsApiKey = process.env.METALS_API_KEY;
      if (metalsApiKey) {
        const response = await fetch(
          `https://metals-api.com/api/latest?access_key=${metalsApiKey}&base=USD&symbols=XAU`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rates && data.rates.XAU) {
            spotPrice = 1 / data.rates.XAU;
            source = "metals-api";
          }
        }
      }
    } catch (err) {
      console.error("Metals-API error:", err);
    }

    if (source === "fallback") {
      try {
        const goldApiKey = process.env.GOLDAPI_KEY;
        if (goldApiKey) {
          const response = await fetch("https://www.goldapi.io/api/XAU/USD", {
            headers: { "x-access-token": goldApiKey },
          });

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
      source,
      note:
        source === "fallback"
          ? "Using fallback price. Configure METALS_API_KEY or GOLDAPI_KEY for live data."
          : undefined,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        price: 2650,
        timestamp: Date.now(),
        metal: "gold",
        source: "error-fallback",
        error: "Failed to fetch gold price",
      }),
    };
  }
};

export { handler };
