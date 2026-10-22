import { cn } from "@/lib/utils";
import { daysUntil, type Priority } from "@/lib/tasks";

const STYLES: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/15 text-foreground",
  low: "bg-success/15 text-success",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", STYLES[priority])}>
      {priority}
    </span>
  );
}

export function DeadlineLabel({ deadline }: { deadline: string }) {
  const d = daysUntil(deadline);
  if (d === null) return <span className="text-xs text-muted-foreground">No deadline</span>;
  const text = d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : d === 1 ? "Tomorrow" : `In ${d} days`;
  return (
    <span className={cn("shrink-0 text-xs font-medium", d < 0 ? "text-destructive" : d <= 1 ? "text-violet" : "text-muted-foreground")}>
      {text}
    </span>
  );
}
