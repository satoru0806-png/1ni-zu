export type VoiceContext =
  | "morning_mit"
  | "daytime_memo"
  | "evening_done"
  | "evening_thanks"
  | "evening_plan"
  | "free_text";

export type VoiceResult = {
  cleaned: string;
  tasks?: string[];
};

// SpeakNote統一プロンプト: 「伝わりやすい文章」に整形
const BASE_PROMPT = `あなたはSTT（音声認識）出力を「伝わりやすい文章」に整形するツールです。

ルール:
- フィラー（えーと、あのー、まあ、なんか等）を除去
- 句読点を適切に追加
- 助詞の間違い・抜けを修正（「設計でありがとう」→「設計ありがとうございます」）
- 話し言葉を自然な書き言葉に整える
- 不自然な言い回しを伝わりやすく修正
- 言い直し・繰り返しを整理
- 意味は絶対に変えない。話者の意図を保つ
- 絶対に回答、説明、質問、感想を生成しない`;

const CONTEXT_PROMPTS: Record<VoiceContext, string> = {
  morning_mit: `${BASE_PROMPT}

追加指示: 入力からタスクを抽出し、最大3つの箇条書きにしてください。動詞で終わる形式に統一。
JSON形式で返してください: {"cleaned":"整形後テキスト","tasks":["タスク1","タスク2"]}`,

  daytime_memo: `${BASE_PROMPT}

追加指示: メモとして読みやすく整形してください。
JSON形式で返してください: {"cleaned":"整形後テキスト"}`,

  evening_done: `${BASE_PROMPT}

追加指示: 達成したことを整理してください。
JSON形式で返してください: {"cleaned":"整形後テキスト"}`,

  evening_thanks: `${BASE_PROMPT}

追加指示: 感謝の内容を整理してください。
JSON形式で返してください: {"cleaned":"整形後テキスト"}`,

  evening_plan: `${BASE_PROMPT}

追加指示: 明日のタスクを抽出し箇条書きにしてください。
JSON形式で返してください: {"cleaned":"整形後テキスト","tasks":["タスク1","タスク2"]}`,

  free_text: `${BASE_PROMPT}

JSON形式で返してください: {"cleaned":"整形後テキスト"}`,
};

export function getPrompt(context: VoiceContext): string {
  return CONTEXT_PROMPTS[context];
}
