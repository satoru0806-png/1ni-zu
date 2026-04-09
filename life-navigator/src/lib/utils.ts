// サーバー側のデフォルト値
const SERVER_DAY_START_HOUR = parseInt(process.env.DAY_START_HOUR || "2", 10);

/**
 * ユーザー設定の「一日の始まる時刻」を取得
 * ブラウザではlocalStorageから、サーバーでは環境変数から
 */
function getDayStartHour(): number {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("yumenavi_settings");
      if (stored) {
        const s = JSON.parse(stored);
        if (typeof s.dayStartHour === "number") return s.dayStartHour;
      }
    } catch {}
    return 2;
  }
  return SERVER_DAY_START_HOUR;
}

/**
 * 論理的な「今日」の日付を返す（dayStartHour を考慮）
 * 例: dayStartHour=2 の場合、1:59は前日扱い、2:00から新しい日
 */
export function todayString(): string {
  const now = new Date();
  // 日本時間に変換
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  // dayStartHour より前の時刻は前日扱い
  jstNow.setHours(jstNow.getHours() - getDayStartHour());
  return jstNow.toLocaleDateString("sv-SE");
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  const today = todayString();
  const base = new Date(today + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("sv-SE"));
  }
  return days;
}
