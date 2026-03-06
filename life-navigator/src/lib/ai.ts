// AI memo processing - MVP: rule-based, later swap to OpenAI/Claude API

/**
 * Summarize memo text (MVP: first 120 chars)
 * Replace this function body with AI API call later
 */
export async function summarizeMemo(content: string): Promise<string> {
  const clean = content.replace(/\n/g, " ").trim();
  if (clean.length <= 120) return clean;
  return clean.slice(0, 120) + "...";
}

/**
 * Extract tasks from memo text (MVP: verb-based pattern matching)
 * Replace this function body with AI API call later
 */
export async function extractTasks(content: string): Promise<string[]> {
  const tasks: string[] = [];
  const lines = content.split(/\n/);
  const verbPattern = /する|やる|確認|連絡|買う|送る|調べる|作る|書く|読む|行く|始める|終わる|提出|報告|準備|予約|申し込/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (
      verbPattern.test(trimmed) ||
      /^[-・*]\s/.test(trimmed) ||
      /^TODO[:：]/i.test(trimmed) ||
      /^タスク[:：]/.test(trimmed)
    ) {
      const cleaned = trimmed
        .replace(/^[-・*]\s*/, "")
        .replace(/^(TODO|タスク)[:：]\s*/i, "");
      if (cleaned.length > 0) tasks.push(cleaned);
    }
  }
  return tasks;
}

/**
 * Process memo: summarize + extract tasks
 * Single entry point for AI processing
 */
export async function processMemo(
  content: string
): Promise<{ summary: string; tasks: string[] }> {
  const [summary, tasks] = await Promise.all([
    summarizeMemo(content),
    extractTasks(content),
  ]);
  return { summary, tasks };
}
