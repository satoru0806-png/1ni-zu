import type { ChatMessage, ChatResult } from "../shared/types";

const CHAT_SYSTEM_PROMPT = `あなたは SpeakNote の会話モードのアシスタントです。
ユーザーは音声で話しかけます。日本語で簡潔・自然に応答してください。
- 不要な前置きや謝罪は避け、要点を端的に答える
- 1〜3 文程度に収める (音声で読み上げられる前提)
- 必要に応じて箇条書きや短い段落を使う
- ユーザーの発話に音声認識の誤認識が含まれている場合は、文脈から推測して応答する`;

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  apiKey: string
): Promise<ChatResult> {
  if (!message || !message.trim()) {
    return { reply: "", error: "メッセージが空です" };
  }
  if (!apiKey) {
    return { reply: "", error: "APIキーが設定されていません" };
  }

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
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
        system: CHAT_SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      if (res.status === 401) {
        return { reply: "", error: "APIキーが無効です" };
      }
      if (res.status === 429) {
        return { reply: "", error: "API制限に達しました" };
      }
      console.error(`Chat API error ${res.status}:`, errorBody);
      return { reply: "", error: `API エラー (${res.status})` };
    }

    const data = await res.json();
    const reply = (data.content?.[0]?.text || "").trim();
    if (!reply) {
      return { reply: "", error: "応答が空でした" };
    }
    return { reply };
  } catch (err) {
    console.error("Chat API request failed:", err);
    return { reply: "", error: "ネットワークエラー" };
  }
}
