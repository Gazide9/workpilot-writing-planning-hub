import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Copy, RefreshCw, Wand2, Square, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { streamGenerate } from "@/lib/stream-text";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — WorkPilot AI" },
      { name: "description", content: "Generate formal, friendly or persuasive professional emails with AI. Edit, regenerate and copy." },
      { property: "og:title", content: "Smart Email Generator — WorkPilot AI" },
      { property: "og:description", content: "Generate formal, friendly or persuasive professional emails with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

const TONES = [
  { id: "formal", label: "Formal", desc: "Polished & professional" },
  { id: "friendly", label: "Friendly", desc: "Warm & approachable" },
  { id: "persuasive", label: "Persuasive", desc: "Convincing & action-driven" },
] as const;
type Tone = (typeof TONES)[number]["id"];

function EmailPage() {
  const [tone, setTone] = useState<Tone>("formal");
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [details, setDetails] = useState("");
  const [sender, setSender] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (purpose.trim().length < 3) { toast.error("Tell us what the email is about."); return; }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setOutput("");
    try {
      await streamGenerate({ kind: "email", tone, recipient, purpose, details, sender }, setOutput, ctrl.signal);
    } catch (e) {
      if (!ctrl.signal.aborted) toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Smart Email Generator" subtitle="Describe what you need — get a ready-to-send email." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-5 rounded-xl border bg-card p-6 shadow-card">
          <div>
            <Label>Tone</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition",
                    tone === t.id ? "border-violet bg-violet-soft" : "hover:border-violet/50",
                  )}
                >
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recipient"><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Hiring manager at Acme" /></Field>
            <Field label="Your name"><Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="e.g. Amanda" /></Field>
          </div>
          <Field label="What's the email about? *">
            <Textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Follow up on the project proposal I sent last week" />
          </Field>
          <Field label="Key details (optional)">
            <Textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Dates, numbers, requests, anything to include" />
          </Field>
          {busy ? (
            <Button variant="outline" size="lg" className="w-full" onClick={() => abortRef.current?.abort()}>
              <Square /> Stop
            </Button>
          ) : (
            <Button variant="violet" size="lg" className="w-full" onClick={generate}>
              <Wand2 /> Generate email
            </Button>
          )}
        </div>

        <div className="flex min-h-[420px] flex-col rounded-xl border bg-card shadow-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <span className="text-sm font-semibold">Your email {output && !busy && <span className="font-normal text-muted-foreground">· editable</span>}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={busy || !output} onClick={generate}><RefreshCw /> Regenerate</Button>
              <Button variant="soft" size="sm" disabled={busy || !output} onClick={copy}>{copied ? <Check /> : <Copy />} Copy</Button>
            </div>
          </div>
          {output || busy ? (
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              readOnly={busy}
              placeholder="Writing…"
              className="flex-1 resize-none bg-transparent p-5 text-sm leading-relaxed outline-none"
            />
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">
              Pick a tone, describe your email and hit Generate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
