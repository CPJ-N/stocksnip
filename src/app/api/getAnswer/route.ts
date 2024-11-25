import { Readability } from "@mozilla/readability";
import jsdom, { JSDOM } from "jsdom";
import {
  TogetherAIStream,
  TogetherAIStreamPayload,
} from "@/utils/TogetherAIStream";
import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://together.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    // Parse and validate input from the request
    const { article } = await request.json();

    if (!article || !article.url) {
      return new Response(
        JSON.stringify({ error: "Invalid input. Provide an article object with a valid URL." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[StockSnip] Fetching and processing text from the article URL...");

    // Fetch and parse the article content
    let parsedContent;
    try {
      const response = await fetchWithTimeout(article.url);
      const html = await response.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const parsed = new Readability(doc).parse();
      parsedContent = parsed
        ? cleanedText(parsed.textContent || "")
        : "No content available";
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[StockSnip] Error parsing article URL: ${article.url}`, error.message);
      } else {
        console.error(`[StockSnip] Error parsing article URL: ${article.url}`, error);
      }
      parsedContent = "Content not available";
    }

    // Construct the main prompt for Together Compute
    const mainSummaryPrompt = `
      Based on the provided article content, generate a concise and accurate summary. The summary should be professional, unbiased, and limited to 1024 tokens. If the content is insufficient, mention "information is incomplete."

      Article content:
      ${parsedContent}
    `;
    
    // Generate the summary using Together Compute
    const payload: TogetherAIStreamPayload = {
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [
        { role: "system", content: mainSummaryPrompt },
      ],
      stream: true,
    };

    console.log("[StockSnip] Generating summary using Together Compute...");
    const stream = await TogetherAIStream(payload);

    // Return the summary as a streamed response
    return new Response(stream, {
      headers: new Headers({
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      }),
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error("[StockSnip] An error occurred while processing the article:", e.message);

      // Return a fallback error response
      return new Response(
        JSON.stringify({ error: e.message || "An unexpected error occurred" }),
      );
    } else {
      console.error("[StockSnip] An unexpected error occurred:", e);

      // Return a fallback error response
      return new Response(
        JSON.stringify({ error: "An unexpected error occurred" }),
      );
    }
  }
}

const cleanedText = (text: string) => {
  let newText = text
    .trim()
    .replace(/(\n){4,}/g, "\n\n\n")
    .replace(/\n\n/g, " ")
    .replace(/ {3,}/g, "  ")
    .replace(/\t/g, "")
    .replace(/\n+(\s*\n)*/g, "\n");

  return newText.substring(0, 20000); // Limit the content size
};

async function fetchWithTimeout(url: string, options = {}, timeout = 3000) {
  // Create an AbortController
  const controller = new AbortController();
  const { signal } = controller;

  // Set a timeout to abort the fetch
  const fetchTimeout = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Start the fetch request with the abort signal
  return fetch(url, { ...options, signal })
    .then((response) => {
      clearTimeout(fetchTimeout); // Clear the timeout if the fetch completes in time
      return response;
    })
    .catch((error) => {
      if (error.name === "AbortError") {
        throw new Error("Fetch request timed out");
      }
      throw error; // Re-throw other errors
    });
}
