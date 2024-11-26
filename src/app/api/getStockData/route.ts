import { z } from "zod";
import { NextResponse } from "next/server";

const BASE_URL = "https://www.alphavantage.co/query";

export async function POST(req: Request) {
  try {
    // Validate input using Zod
    const schema = z.object({
      symbol: z.string().min(1, "Stock ticker is required"),
    });
    const body = await req.json();
    const { symbol } = schema.parse(body);

    // Fetch data from Alpha Vantage API using TIME_SERIES_DAILY
    const response = await fetch(
      `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch stock data");
    }

    const data = await response.json();

    // Check for API-specific errors
    if (data["Note"]) {
      throw new Error("API limit reached. Try again later.");
    }

    if (data["Error Message"]) {
      throw new Error("Invalid stock ticker or API error");
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
