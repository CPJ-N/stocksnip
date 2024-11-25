import { z } from "zod";
import { NextResponse } from "next/server";

const BASE_URL = "https://finnhub.io/api/v1";

export async function POST(req: Request) {
  try {
    // Validate input using Zod
    const schema = z.object({
      symbol: z.string().min(1, "Stock ticker is required"),
      from: z.string().optional(), // Optional 'from' date (YYYY-MM-DD)
      to: z.string().optional(),   // Optional 'to' date (YYYY-MM-DD)
    });
    const body = await req.json();
    const { symbol, from, to } = schema.parse(body);

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error("FINNHUB_API_KEY is not defined");
    }

    // Default dates: last 7 days if `from` and `to` are not provided
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formattedFrom = from || sevenDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD
    const formattedTo = to || today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Prepare the query parameters for the API request
    const url = new URL(`${BASE_URL}/company-news`);
    url.searchParams.append("symbol", symbol);
    url.searchParams.append("token", apiKey);
    url.searchParams.append("from", formattedFrom);
    url.searchParams.append("to", formattedTo);

    // Fetch data from Finnhub API
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch news data");
    }

    const data = await response.json();

    // Handle cases where the API might return an empty array
    if (!data || data.length === 0) {
      throw new Error("No news found for the provided stock ticker");
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 400 }
    );
  }
}
