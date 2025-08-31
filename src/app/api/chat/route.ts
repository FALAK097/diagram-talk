import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    maxOutputTokens: 1024,
    temperature: 0.3,
    maxRetries: 3,
    system: `You are an expert in understanding and analyzing diagrams. You have a great in-depth understanding of how systems work and you are expert in system design. You can easily understand any concept related to it and provide insights accordingly.`,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
