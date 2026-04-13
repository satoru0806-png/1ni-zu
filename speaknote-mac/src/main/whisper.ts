import type { TranscribeResult } from "../shared/types";
import { isNoise, autoCorrect, applyDictionary } from "../shared/auto-correct";

const DEFAULT_WHISPER_PROMPT =
  "日本語の自然な会話・メモ・連絡文です。人名や固有名詞、助詞を正確に書き起こしてください。句読点、改行を適切に使用します。";

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  apiKey: string,
  userPrompt?: string,
  dictionary?: Array<{ from: string; to: string }>
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

  // プロンプトに辞書 (to側) と語彙ヒントを連結
  const dictNames = (dictionary ?? [])
    .map((d) => d.to?.trim())
    .filter(Boolean);
  const promptParts = [DEFAULT_WHISPER_PROMPT];
  if (dictNames.length > 0) {
    promptParts.push(`頻出固有名詞: ${dictNames.join("、")}`);
  }
  if (userPrompt && userPrompt.trim()) {
    promptParts.push(userPrompt.trim());
  }
  const finalPrompt = promptParts.join(" ");

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  form.append("file", blob, `audio.${ext}`);
  form.append("model", "gpt-4o-transcribe");
  form.append("language", "ja");
  form.append("response_format", "text");
  form.append("prompt", finalPrompt);

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

    let text = (await res.text()).trim();

    if (isNoise(text)) {
      return { text: "", error: "音声が検出されませんでした" };
    }
    text = autoCorrect(text);
    if (dictionary && dictionary.length > 0) {
      text = applyDictionary(text, dictionary);
    }

    return { text };
  } catch (err) {
    console.error("Whisper API request failed:", err);
    return { text: "", error: "ネットワークエラー。接続を確認してください。" };
  }
}
