import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { streamWorkPilot, errorResponse } from "@/lib/ai/gateway.server";
import { EMAIL_SYSTEM, PLANNER_SYSTEM } from "@/lib/ai/prompts";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("email"),
    tone: z.enum(["formal", "friendly", "persuasive"]),
    recipient: z.string().max(200).optional().default(""),
    purpose: z.string().min(3).max(4000),
    details: z.string().max(4000).optional().default(""),
    sender: z.string().max(200).optional().default(""),
  }),
  z.object({
    kind: z.literal("schedule"),
    range: z.enum(["daily", "weekly"]),
    today: z.string().max(40),
    tasks: z
      .array(
        z.object({
          title: z.string().max(300),
          priority: z.enum(["high", "medium", "low"]),
          deadline: z.string().max(40).optional().default(""),
          hours: z.number().min(0).max(100),
        }),
      )
      .min(1)
      .max(60),
  }),
]);

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Please fill in the required fields." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const d = parsed.data;
        try {
          let prompt: string;
          let system: string;
          if (d.kind === "email") {
            system = EMAIL_SYSTEM;
            prompt = `Tone: ${d.tone}\nRecipient: ${d.recipient || "unspecified"}\nPurpose: ${d.purpose}\nKey details: ${d.details || "none"}\nSign as: ${d.sender || "[Your Name]"}`;
          } else {
            system = PLANNER_SYSTEM;
            const list = d.tasks
              .map(
                (t, i) =>
                  `${i + 1}. ${t.title} | priority: ${t.priority} | deadline: ${t.deadline || "none"} | est: ${t.hours}h`,
              )
              .join("\n");
            prompt = `Today is ${d.today}. Create a ${d.range === "daily" ? "schedule for today" : "7-day weekly schedule starting today"}.\nTasks:\n${list}`;
          }
          const { result, wrap } = streamWorkPilot(request, [{ role: "user", content: prompt }], system);
          return wrap(result.toTextStreamResponse());
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
