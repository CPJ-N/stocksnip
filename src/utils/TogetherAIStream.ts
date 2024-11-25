import { createParser, type EventSourceMessage } from 'eventsource-parser'; // Import createParser and EventSourceMessage type

export type ChatGPTAgent = "user" | "system";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface TogetherAIStreamPayload {
  model: string;
  messages: ChatGPTMessage[];
  stream: boolean;
}

export async function TogetherAIStream(payload: TogetherAIStreamPayload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch("https://together.helicone.ai/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      // Define the onEvent callback for handling parsed events
      const onEvent = (event: EventSourceMessage) => {
        if (event.data) {
          const data = event.data;
          controller.enqueue(encoder.encode(data));
        }
      };

      // Define the onError callback for handling parse errors
      const onError = (error: { type: string; field?: string; value?: string; line?: string }) => {
        console.error('Error parsing event:', error);
        if (error.type === 'invalid-field') {
          console.error('Field name:', error.field);
          console.error('Field value:', error.value);
          console.error('Line:', error.line);
        } else if (error.type === 'invalid-retry') {
          console.error('Invalid retry interval:', error.value);
        }
      };

      // Create the parser instance with the onEvent and onError callbacks
      const parser = createParser({
        onEvent,
        onError,
      });

      // Handle non-200 status codes
      if (res.status !== 200) {
        const data = {
          status: res.status,
          statusText: res.statusText,
          body: await res.text(),
        };
        console.log(`Error: received non-200 status code, ${JSON.stringify(data)}`);
        controller.close();
        return;
      }

      // Stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // This ensures we properly read chunks and invoke an event for each SSE event stream
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk)); // Feed the chunk to the parser
      }
    },
  });

  let counter = 0;
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const data = decoder.decode(chunk);
      // Handle end of stream
      if (data === "[DONE]") {
        controller.terminate();
        return;
      }
      try {
        const json = JSON.parse(data);
        const text = json.choices[0].delta?.content || "";
        if (counter < 2 && (text.match(/\n/) || []).length) {
          // This is a prefix character (i.e., "\n\n"), do nothing
          return;
        }
        // Stream transformed JSON response as SSE
        const payload = { text: text };
        // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        counter++;
      } catch (e) {
        // Handle JSON parsing error
        controller.error(e);
      }
    },
  });

  return readableStream.pipeThrough(transformStream); // Pipe through the transform stream
}
