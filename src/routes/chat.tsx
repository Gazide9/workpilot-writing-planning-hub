import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import mark from "@/assets/workpilot-mark.png";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Assistant — WorkPilot AI" },
      { name: "description", content: "Chat with an AI assistant that answers workplace questions, drafts emails, summarizes text and helps you plan." },
      { property: "og:title", content: "AI Workplace Assistant — WorkPilot AI" },
      { property: "og:description", content: "Answers, email drafts, summaries and planning help in one chat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const KEY = "workpilot.chat";
const SUGGESTIONS = [
  "Draft an email asking my manager for Friday off",
  "Summarize this text into 3 bullet points: ",
  "How do I run an effective 15-minute stand-up?",
  "Help me plan a week to launch a small product",
];

function ChatPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    try {
      setInitial(JSON.parse(localStorage.getItem(KEY) ?? "[]") as UIMessage[]);
    } catch {
      setInitial([]);
    }
  }, []);
  if (!initial) return null;
  return <ChatWindow initial={initial} />;
}

function ChatWindow({ initial }: { initial: UIMessage[] }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "workpilot",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => {
      let msg = e.message;
      try { msg = (JSON.parse(e.message) as { error?: string }).error ?? msg; } catch { /* plain text */ }
      toast.error(msg || "The assistant couldn't respond.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready" || status === "error") localStorage.setItem(KEY, JSON.stringify(messages));
  }, [messages, status]);

  function send(text: string) {
    if (!text.trim() || busy) return;
    void sendMessage({ text });
    setInput("");
  }

  function reset() {
    stop();
    setMessages([]);
    localStorage.removeItem(KEY);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-11rem)] max-w-3xl flex-col lg:h-[calc(100vh-5rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={mark} alt="WorkPilot" width={40} height={40} className="size-10 rounded-lg border bg-card p-1" />
          <div>
            <h1 className="text-lg font-semibold">AI Workplace Assistant</h1>
            <p className="text-xs text-muted-foreground">Answers · Email drafts · Summaries · Planning</p>
          </div>
        </div>
        {messages.length > 0 && <Button variant="ghost" size="sm" onClick={reset}><RotateCcw /> Start over</Button>}
      </div>

      <Conversation className="flex-1 rounded-xl border bg-card shadow-card">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <img src={mark} alt="" width={64} height={64} className="size-16" />
              <div>
                <h2 className="text-xl font-semibold">How can I help you work smarter?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Try one of these to get started.</p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => (s.endsWith(": ") ? setInput(s) : send(s))}
                    className="rounded-lg border p-3 text-left text-sm transition hover:border-violet hover:bg-violet-soft">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.parts.map((p, i) =>
                  p.type === "text" ? (
                    m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i} className="whitespace-pre-wrap">{p.text}</span>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer className="text-sm">Thinking…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput className="mt-3 rounded-xl bg-card shadow-card" onSubmit={(msg) => send(msg.text ?? "")}>
        <PromptInputTextarea autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about work…" />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
