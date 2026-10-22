import { useCallback, useEffect, useState } from "react";

export type Priority = "high" | "medium" | "low";
export interface Task {
  id: string;
  title: string;
  priority: Priority;
  deadline: string; // yyyy-mm-dd or ""
  hours: number;
  done: boolean;
  createdAt: number;
  completedAt?: number;
}

const KEY = "workpilot.tasks";
const EVT = "workpilot:tasks";
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Sort open tasks first, then by priority, then by nearest deadline. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    const da = a.deadline || "9999-12-31";
    const db = b.deadline || "9999-12-31";
    return da.localeCompare(db);
  });
}

export function daysUntil(deadline: string, now = new Date()): number | null {
  if (!deadline) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const [y, m, d] = deadline.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - today) / 86400000);
}

function read(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Task[];
  } catch {
    return [];
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTasks(read());
    setReady(true);
    const sync = () => setTasks(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((fn: (t: Task[]) => Task[]) => {
    const next = fn(read());
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
  }, []);

  return {
    tasks,
    ready,
    add: (t: Omit<Task, "id" | "done" | "createdAt">) =>
      save((all) => [...all, { ...t, id: crypto.randomUUID(), done: false, createdAt: Date.now() }]),
    toggle: (id: string) =>
      save((all) =>
        all.map((t) =>
          t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined } : t,
        ),
      ),
    remove: (id: string) => save((all) => all.filter((t) => t.id !== id)),
  };
}
