import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export function streamWorkPilot(request: Request, messages: ModelMessage[], system: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(MODEL),
    system,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return {
    result,
    wrap: (response: Response) => withLovableAiGatewayRunIdHeader(response, runIdFetch),
  };
}

export function errorResponse(error: unknown) {
  const status =
    typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode: number }).statusCode)
      : 500;
  const message =
    status === 429
      ? "Too many requests right now. Please wait a moment and try again."
      : status === 402
        ? "AI credits are used up. Add credits in your workspace to continue."
        : "The AI assistant couldn't respond. Please try again.";
  return new Response(JSON.stringify({ error: message }), {
    status: status || 500,
    headers: { "Content-Type": "application/json" },
  });
}

export function aiErrorMessage(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("429")) return "Too many requests right now. Please wait a moment and try again.";
  if (msg.includes("402")) return "AI credits are used up. Add credits in your workspace to continue.";
  return "The AI assistant couldn't respond. Please try again.";
}
