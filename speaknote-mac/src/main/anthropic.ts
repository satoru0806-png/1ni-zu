import { getPrompt } from "../shared/voice-ai";
import type { AppVoiceContext, VoiceResult } from "../shared/types";

export async function processVoice(
  rawText: string,
  context: AppVoiceContext,
  apiKey: string
): Promise<VoiceResult> {
  if (!rawText || !rawText.trim()) {
    return { cleaned: "", tasks: [] };
  }

  if (!apiKey) {
    return { cleaned: rawText, error: "APIキーが設定されていません。設定画面で入力してください。" };
  }

  const systemPrompt = getPrompt(context || "free_text");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: rawText }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      if (res.status === 401) {
        return { cleaned: rawText, error: "APIキーが無効です。設定を確認してください。" };
      }
      if (res.status === 429) {
        return { cleaned: rawText, error: "API制限に達しました。しばらく待ってから再試行してください。" };
      }
      console.error(`Anthropic API error ${res.status}:`, errorBody);
      return { cleaned: rawText, error: `API エラー (${res.status})` };
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || rawText;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed: VoiceResult = JSON.parse(jsonMatch[0]);
      return parsed;
    }

    return { cleaned: text };
  } catch (err) {
    console.error("Anthropic API request failed:", err);
    return { cleaned: rawText, error: "ネットワークエラー。接続を確認してください。" };
  }
}
