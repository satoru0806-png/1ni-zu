import type { TranscribeResult } from "../shared/types";

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  apiKey: string,
  prompt?: string
): Promise<TranscribeResult> {
  if (!apiKey) {
    return {
      text: "",
      error: "OpenAI APIキーが設定されていません。設定画面で入力してください。",
    };
  }

  const ext = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("mp4")
    ? "mp4"
    : mimeType.includes("wav")
    ? "wav"
    : "webm";

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  form.append("file", blob, `audio.${ext}`);
  form.append("model", "gpt-4o-transcribe");
  form.append("language", "ja");
  form.append("response_format", "text");
  if (prompt && prompt.trim()) {
    form.append("prompt", prompt.trim());
  }

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 401) {
        return { text: "", error: "OpenAI APIキーが無効です。" };
      }
      if (res.status === 429) {
        return { text: "", error: "OpenAI API制限に達しました。" };
      }
      console.error(`Whisper API error ${res.status}:`, body);
      return { text: "", error: `Whisper APIエラー (${res.status})` };
    }

    const text = await res.text();
    return { text: text.trim() };
  } catch (err) {
    console.error("Whisper API request failed:", err);
    return { text: "", error: "ネットワークエラー。接続を確認してください。" };
  }
}
