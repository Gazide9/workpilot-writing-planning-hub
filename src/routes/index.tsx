import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, CheckCircle2, Clock, ListTodo, Mail, MessageSquare, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { daysUntil, sortTasks, useTasks } from "@/lib/tasks";
import { PriorityBadge, DeadlineLabel } from "@/components/task-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WorkPilot AI" },
      { name: "description", content: "Your tasks, upcoming deadlines and productivity stats at a glance." },
      { property: "og:title", content: "Dashboard — WorkPilot AI" },
      { property: "og:description", content: "Your tasks, upcoming deadlines and productivity stats at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  { to: "/email", title: "Write an email", desc: "Formal, friendly or persuasive in seconds.", icon: Mail },
  { to: "/planner", title: "Plan my day", desc: "Turn tasks into a prioritized schedule.", icon: CalendarCheck },
  { to: "/chat", title: "Ask the assistant", desc: "Summaries, answers and drafts on demand.", icon: MessageSquare },
] as const;

function Dashboard() {
  const { tasks, ready } = useTasks();
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const rate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const hoursLeft = open.reduce((s, t) => s + t.hours, 0);
  const upcoming = sortTasks(open.filter((t) => t.deadline))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);
  const overdue = open.filter((t) => (daysUntil(t.deadline) ?? 1) < 0).length;
  const top = sortTasks(open).slice(0, 5);

  const stats = [
    { label: "Open tasks", value: open.length, icon: ListTodo },
    { label: "Completed", value: done.length, icon: CheckCircle2 },
    { label: "Hours planned", value: `${hoursLeft}h`, icon: Clock },
    { label: "Overdue", value: overdue, icon: CalendarClock },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <section className="relative mb-8 overflow-hidden rounded-2xl bg-glow p-6 text-primary-foreground shadow-card sm:p-10">
        <p className="text-sm font-medium opacity-80">Welcome back</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">Let's make today count.</h1>
        <p className="mt-3 max-w-lg opacity-80">
          {ready && open.length
            ? `You have ${open.length} open task${open.length > 1 ? "s" : ""} and ${upcoming.length} upcoming deadline${upcoming.length === 1 ? "" : "s"}.`
            : "Add your tasks, draft emails and plan your schedule with AI."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-4xl font-semibold font-display">{rate}%</div>
            <div className="text-xs opacity-75">completion rate</div>
          </div>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${rate}%` }} />
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm">{label}</span>
              <Icon className="size-4 text-violet" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {TOOLS.map(({ to, title, desc, icon: Icon }) => (
          <Link key={to} to={to} className="group rounded-xl border bg-card p-5 shadow-card transition hover:border-violet">
            <span className="grid size-10 place-items-center rounded-lg bg-violet-soft text-violet">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet">
              Open <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top priorities">
          {top.length === 0 ? <Empty /> : top.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate text-sm font-medium">{t.title}</span>
              <PriorityBadge priority={t.priority} />
            </div>
          ))}
        </Panel>
        <Panel title="Upcoming deadlines">
          {upcoming.length === 0 ? <Empty /> : upcoming.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 py-3">
              <span className="truncate text-sm font-medium">{t.title}</span>
              <DeadlineLabel deadline={t.deadline} />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link to="/planner" className="text-xs font-medium text-violet">Manage</Link>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">
      Nothing here yet. <Link to="/planner" className="font-medium text-violet">Add a task</Link>
    </p>
  );
}

export { PageHeader };
