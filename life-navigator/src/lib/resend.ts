// Resend.com を使ってメール送信するヘルパー
// 必要な環境変数:
//   RESEND_API_KEY (Resend からもらう、再生回数 3000/月まで無料)
//   RESEND_FROM_EMAIL (送信元アドレス、ドメイン認証済みのもの推奨。開発時は "onboarding@resend.dev" でも可)

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY 未設定。メール送信をスキップ。");
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  const from = process.env.RESEND_FROM_EMAIL || "夢ナビ <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text || params.subject,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[Resend] error:", res.status, detail);
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
