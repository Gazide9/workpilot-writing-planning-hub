import { describe, expect, it } from "vitest";
import { daysUntil, sortTasks, type Task } from "@/lib/tasks";

const t = (p: Partial<Task>): Task => ({
  id: p.title ?? "x", title: "x", priority: "medium", deadline: "", hours: 1, done: false, createdAt: 0, ...p,
});

describe("task prioritization", () => {
  it("puts high priority before low", () => {
    expect(sortTasks([t({ title: "a", priority: "low" }), t({ title: "b", priority: "high" })])[0].title).toBe("b");
  });
  it("puts nearer deadline first within same priority", () => {
    const r = sortTasks([t({ title: "late", deadline: "2026-12-01" }), t({ title: "soon", deadline: "2026-10-25" })]);
    expect(r[0].title).toBe("soon");
  });
  it("puts completed tasks last", () => {
    expect(sortTasks([t({ title: "done", priority: "high", done: true }), t({ title: "open", priority: "low" })])[0].title).toBe("open");
  });
  it("counts days until deadline", () => {
    expect(daysUntil("2026-10-25", new Date(2026, 9, 22, 15))).toBe(3);
  });
});
