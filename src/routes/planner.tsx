import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CalendarCheck, Plus, Trash2, Square } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageResponse } from "@/components/ai-elements/message";
import { PriorityBadge, DeadlineLabel } from "@/components/task-bits";
import { cn } from "@/lib/utils";
import { sortTasks, useTasks, type Priority } from "@/lib/tasks";
import { streamGenerate } from "@/lib/stream-text";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — WorkPilot AI" },
      { name: "description", content: "Manage tasks, prioritize deadlines and generate daily or weekly schedules with AI." },
      { property: "og:title", content: "AI Task Planner — WorkPilot AI" },
      { property: "og:description", content: "Manage tasks and generate prioritized daily or weekly schedules with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const { tasks, add, toggle, remove } = useTasks();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [hours, setHours] = useState("1");
  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sorted = sortTasks(tasks);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    add({ title: title.trim(), priority, deadline, hours: Math.max(0, Number(hours) || 0) });
    setTitle("");
    setDeadline("");
    setHours("1");
  }

  async function makePlan() {
    const open = sorted.filter((t) => !t.done);
    if (!open.length) return toast.error("Add at least one open task first.");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setPlan("");
    try {
      await streamGenerate(
        {
          kind: "schedule",
          range,
          today: new Date().toDateString(),
          tasks: open.map(({ title, priority, deadline, hours }) => ({ title, priority, deadline, hours })),
        },
        setPlan,
        ctrl.signal,
      );
    } catch (err) {
      if (!ctrl.signal.aborted) toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="AI Task Planner" subtitle="Add tasks, then let AI build your prioritized schedule." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5 shadow-card">
            <div className="space-y-2">
              <Label htmlFor="t">New task</Label>
              <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prepare Q4 report" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_80px]">
              <div className="col-span-2 space-y-2 sm:col-span-1">
                <Label>Priority</Label>
                <div className="flex gap-1">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setPriority(p)}
                      className={cn("flex-1 rounded-md border py-1.5 text-xs font-medium capitalize transition", priority === p ? "border-violet bg-violet-soft text-accent-foreground" : "text-muted-foreground")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="d">Deadline</Label>
                <Input id="d" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="h">Hours</Label>
                <Input id="h" type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full"><Plus /> Add task</Button>
          </form>

          <div className="rounded-xl border bg-card shadow-card">
            <div className="border-b px-5 py-3 text-sm font-semibold">Tasks · sorted by priority & deadline</div>
            {sorted.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No tasks yet — add your first one above.</p>
            ) : (
              <ul className="divide-y">
                {sorted.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <Checkbox checked={t.done} onCheckedChange={() => toggle(t.id)} aria-label={`Complete ${t.title}`} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", t.done && "text-muted-foreground line-through")}>{t.title}</p>
                      <div className="mt-0.5 flex gap-3"><DeadlineLabel deadline={t.deadline} /><span className="text-xs text-muted-foreground">{t.hours}h</span></div>
                    </div>
                    <PriorityBadge priority={t.priority} />
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(t.id)} aria-label="Delete task"><Trash2 /></Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex min-h-[480px] flex-col rounded-xl border bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <div className="flex rounded-lg bg-muted p-1">
              {(["daily", "weekly"] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={cn("rounded-md px-3 py-1 text-xs font-semibold capitalize transition", range === r ? "bg-card shadow-card" : "text-muted-foreground")}>
                  {r}
                </button>
              ))}
            </div>
            {busy ? (
              <Button variant="outline" size="sm" onClick={() => abortRef.current?.abort()}><Square /> Stop</Button>
            ) : (
              <Button variant="violet" size="sm" onClick={makePlan}><CalendarCheck /> Generate schedule</Button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-5 text-sm">
            {plan ? (
              <MessageResponse>{plan}</MessageResponse>
            ) : (
              <div className="grid h-full place-items-center text-center text-muted-foreground">
                {busy ? "Planning your schedule…" : `Your ${range} schedule will appear here.`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
