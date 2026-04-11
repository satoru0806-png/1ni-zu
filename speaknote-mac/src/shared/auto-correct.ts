const CORRECTIONS: Record<string, string> = {
  "てゆうか": "というか",
  "ゆう": "いう",
  "ずつ": "ずつ",
  "づつ": "ずつ",
  "いがい": "以外",
  "ふいんき": "雰囲気",
  "おこなって": "行って",
};

export function autoCorrect(text: string): string {
  let result = text;
  for (const [wrong, right] of Object.entries(CORRECTIONS)) {
    result = result.replace(new RegExp(wrong, "g"), right);
  }
  result = result.replace(/。。+/g, "。");
  result = result.replace(/、、+/g, "、");
  return result;
}
