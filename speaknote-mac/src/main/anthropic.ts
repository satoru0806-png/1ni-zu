import { buildSystemPrompt, FEW_SHOT_EXAMPLES } from "../shared/voice-ai";
import type { AppVoiceContext, DictionaryEntry, VoiceResult } from "../shared/types";

export async function processVoice(
  rawText: string,
  context: AppVoiceContext,
  apiKey: string,
  dictionary: DictionaryEntry[] = []
): Promise<VoiceResult> {
  if (!rawText || !rawText.trim()) {
    return { cleaned: "", tasks: [] };
  }

  if (!apiKey) {
    return { cleaned: rawText, error: "APIキーが設定されていません。設定画面で入力してください。" };
  }

  const names = dictionary.map((d) => d.to?.trim()).filter(Boolean);
  const systemPrompt = buildSystemPrompt(context || "free_text", names);

  // few-shot 例を user/assistant 交互メッセージとして展開
  const fewShotMessages = FEW_SHOT_EXAMPLES.flatMap((ex) => [
    { role: "user" as const, content: `<stt_input>${ex.user}</stt_input>` },
    { role: "assistant" as const, content: ex.assistant },
  ]);

  const messages = [
    ...fewShotMessages,
    { role: "user" as const, content: `<stt_input>${rawText}</stt_input>` },
  ];

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
        messages,
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
    const text = (data.content?.[0]?.text || rawText).trim();

    // morning_mit のときだけ JSON 抽出を試みる
    if (context === "morning_mit") {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed: VoiceResult = JSON.parse(jsonMatch[0]);
          if (parsed.cleaned) return parsed;
        } catch {
          // JSON parse 失敗時はそのまま本文として扱う
        }
      }
    }

    return { cleaned: text };
  } catch (err) {
    console.error("Anthropic API request failed:", err);
    return { cleaned: rawText, error: "ネットワークエラー。接続を確認してください。" };
  }
}
