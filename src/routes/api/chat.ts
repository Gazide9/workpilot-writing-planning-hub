import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";

import { streamWorkPilot, errorResponse, aiErrorMessage } from "@/lib/ai/gateway.server";
import { CHAT_SYSTEM } from "@/lib/ai/prompts";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(JSON.stringify({ error: "No messages" }), { status: 400 });
          }
          const messages = body.messages.slice(-40);
          const { result, wrap } = streamWorkPilot(
            request,
            await convertToModelMessages(messages),
            CHAT_SYSTEM,
          );
          return wrap(
            result.toUIMessageStreamResponse({
              originalMessages: messages,
              sendReasoning: true,
              onError: aiErrorMessage,
            }),
          );
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
