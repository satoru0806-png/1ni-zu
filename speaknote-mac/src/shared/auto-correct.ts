// Whisper 出力の機械的後処理 (Web版 transcribe.js と同等)

const NOISE_PATTERNS = [
  "SpeakNote",
  "音声メモ",
  "ご視聴",
  "チャンネル登録",
  "字幕",
  "subtitle",
  "Thank you for watching",
  "句読点を正確に",
  "日本語の音声",
];

// 音声認識誤変換の機械的修正辞書
const CORRECTIONS: Array<[RegExp, string]> = [
  // 「〜はる/はり」→「〜ある/あり」
  [/ではる/g, "である"],
  [/ではり/g, "であり"],
  [/がはる/g, "がある"],
  [/がはり/g, "があり"],
  [/にはる/g, "にある"],
  [/もはる/g, "もある"],
  [/てはる/g, "てある"],
  [/はりがとう/g, "ありがとう"],
  [/おはいよう/g, "おはよう"],
  // 一般的な口語誤変換
  [/すいません/g, "すみません"],
  [/ってゆう/g, "っていう"],
  [/とゆう/g, "という"],
  [/てゆう/g, "ていう"],
  [/てゆうか/g, "というか"],
  [/こんにちわ/g, "こんにちは"],
  [/こんばんわ/g, "こんばんは"],
  [/づつ/g, "ずつ"],
  [/ゆった/g, "言った"],
  [/ゆって/g, "言って"],
  [/ゆえば/g, "言えば"],
  [/おねがいしまーす/g, "お願いします"],
  [/おねがいします/g, "お願いします"],
  [/よろしくおねがいします/g, "よろしくお願いします"],
  [/だいじょうぶ/g, "大丈夫"],
  [/ほんとう/g, "本当"],
  [/ほんと/g, "本当"],
  [/ふいんき/g, "雰囲気"],
  // 「は」→「あ」誤認識 (文頭・単独音)
  [/^は$/g, "あ"],
  [/^はー$/g, "あー"],
  [/^はっ$/g, "あっ"],
  [/^は、/g, "あ、"],
  [/^はー、/g, "あー、"],
  [/^はっ、/g, "あっ、"],
  [/^は。/g, "あ。"],
  [/。は、/g, "。あ、"],
  [/、は、/g, "、あ、"],
  // 笑い声の誤認識
  [/^ははははは+/g, "あはは"],
  [/^はははは/g, "あはは"],
  [/^ははは、/g, "あはは、"],
  [/^はは、/g, "あ、"],
  [/^はいせ$/g, "あ、せ"],
  // 「はったら」→「あったら/やったら」
  [/やってはったら/g, "やったら"],
  [/はったらいい/g, "あったらいい"],
  [/方法はったら/g, "方法があったら"],
  // 同音異義の頻出ミス
  [/その糸で/g, "その意図で"],
  [/糸的に/g, "意図的に"],
  [/見せ回し/g, "申し上げ"],
  [/方法を改めて/g, "方法を改善して"],
  // 末尾の不自然な助詞
  [/てゆ$/g, "て。"],
  [/てわ$/g, "ては"],
];

// ノイズと判定されるテキストか?
export function isNoise(text: string): boolean {
  if (!text || text.length < 3) return true;
  return NOISE_PATTERNS.some((p) => text.includes(p));
}

// 機械的誤認識修正
export function autoCorrect(text: string): string {
  let result = text;
  for (const [pattern, replacement] of CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/。。+/g, "。");
  result = result.replace(/、、+/g, "、");
  return result;
}

// 辞書 (from→to) を機械的に適用
export function applyDictionary(
  text: string,
  dictionary: Array<{ from: string; to: string }>
): string {
  let result = text;
  for (const { from, to } of dictionary) {
    if (!from || !to) continue;
    result = result.split(from).join(to);
  }
  return result;
}
