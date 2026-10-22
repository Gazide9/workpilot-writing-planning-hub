/** Client helper: POST to /api/generate and stream plain text chunks. */
export async function streamGenerate(
  body: unknown,
  onText: (full: string) => void,
  signal: AbortSignal | null = null,
): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Something went wrong. Please try again.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onText(full);
  }
  if (!full.trim()) throw new Error("The AI assistant couldn't respond. Please try again.");
  return full;
}
