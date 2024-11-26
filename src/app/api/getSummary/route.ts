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
    // Parse and validate input from the request
    const { article } = await request.json();
  
    if (!article) {
      return new Response(
        JSON.stringify({ error: "Invalid input. Provide an article object" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Construct the main prompt for Together Compute
    const mainSummaryPrompt = `
        Combine the provided article headlines and summaries into a concise and accurate collective summary. Exclude any reference to data structure or metadata. The summary should be professional, unbiased, and limited to 1024 tokens. If the content is insufficient, mention "information is incomplete."

        Here is the data: ${JSON.stringify(article)}
    `;

    try {
        console.log("[StockSnip] processing text from the articles...");

        const answer = await together.chat.completions.create({
            model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
            messages: [
                { role: "system", content: mainSummaryPrompt },
                {
                    role: "user",
                    content: `
                        Summarize the given content. 
                        Exclude sentences that are irrelevant to the main topic, 
                        such as introductory or contextual phrases like: "Based on the provided article headlines and summaries, here is a concise and accurate collective summary."
                    `
                },
            ],
        });
  
        const parsedAnswer = answer.choices![0].message?.content;
        return new Response(parsedAnswer, { status: 202 });
      } catch (e) {
        console.error("[getSummary] Failed to generate summary:", e);
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