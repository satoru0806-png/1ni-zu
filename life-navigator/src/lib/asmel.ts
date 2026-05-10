// アスメル (1lejend.com / mailstand.net) ステップメール登録ヘルパー
//
// 公式 API はないが、登録フォームが POST を受け付けるため
// それを利用して擬似 API として連携する。
// 参考: https://mailstand.net/?p=243
//
// 必要な環境変数:
//   ASMEL_SCENARIO_ID    アスメル管理画面のシナリオID（数値、URL の no=XXXX 部分）
//   ASMEL_ENDPOINT       (任意) 既定: https://1lejend.com/stepmail/kd.php
//
// 使い方:
//   await registerToAsmel({ email, key, name, lineId });
//
// 仕様メモ:
//   - フリー項目1 → trial キー（メール本文に ###無料1### で差し込み可）
//   - フリー項目2 → LINE ID（任意）
//   - 名前        → touroku_namae1
//   - action=kakunin で確認画面をスキップ
//   - シナリオ側で「フリー項目1〜2を非表示」に設定しておくこと
//
// レスポンス挙動（実測）:
//   - HTTP は常に 200 OK で HTML を返す
//   - HTML 本文に成功/失敗メッセージが入る
//     - 成功: 完了メッセージ（"登録が完了しました" 等）
//     - 既登録: "登録が完了しています"
//     - 弾かれ: "登録が禁止されているアドレス"
//     - 不備:   "入力内容に不備があるようです"

export type AsmelRegisterParams = {
  email: string;
  key?: string;     // 21日トライアルキー → フリー項目1
  name?: string;    // お名前
  lineId?: string;  // LINE ID → フリー項目2
};

export type AsmelResult =
  | { ok: true; status: "registered" | "already_registered"; message?: string }
  | { ok: false; status: "blocked" | "invalid_input" | "http_error" | "fetch_error" | "skipped"; error: string };

function classifyResponse(html: string): AsmelResult {
  const stripped = html.replace(/\s+/g, " ");

  // 既に登録済み（実質成功扱い）
  if (/登録が完了しています/.test(stripped)) {
    return { ok: true, status: "already_registered", message: "Already registered (treated as success)" };
  }

  // 登録が禁止されているアドレス（example.com やブラックリスト等）
  if (/登録が禁止されているアドレス/.test(stripped)) {
    return { ok: false, status: "blocked", error: "Email blocked by Asmel" };
  }

  // 入力不備
  if (/入力内容に不備があるようです/.test(stripped)) {
    // 詳細メッセージを抽出（class="error" の <p> を探す）
    const errMatch = stripped.match(/<p class="error">([^<]+)<\/p>/g);
    const msgs = errMatch
      ? errMatch.map((m) => m.replace(/<[^>]+>/g, "")).join(" / ")
      : "Input validation failed";
    return { ok: false, status: "invalid_input", error: msgs.slice(0, 300) };
  }

  // 登録完了系メッセージを検出（成功）
  if (/登録(?:を|が)?(?:完了|受付|確定)/.test(stripped) || /ご登録ありがとうございます/.test(stripped)) {
    return { ok: true, status: "registered" };
  }

  // 確認画面が省略されず確定ページが返ってきた（form 再表示）→ 設定要確認
  if (/<input[^>]+name="submit"[^>]+value="確定"/.test(stripped)) {
    return {
      ok: false,
      status: "invalid_input",
      error: "Confirmation page returned. Check 'Skip confirmation screen' setting.",
    };
  }

  // 不明だが 200 で返ってきた → ひとまず成功とみなしてログだけ残す
  return { ok: true, status: "registered", message: "Unknown 200 response, assuming success" };
}

export async function registerToAsmel(
  params: AsmelRegisterParams
): Promise<AsmelResult> {
  const scenarioId = process.env.ASMEL_SCENARIO_ID;
  if (!scenarioId) {
    console.warn("[Asmel] ASMEL_SCENARIO_ID 未設定。アスメル登録をスキップ。");
    return { ok: false, status: "skipped", error: "ASMEL_SCENARIO_ID missing" };
  }

  const endpoint =
    process.env.ASMEL_ENDPOINT || "https://1lejend.com/stepmail/kd.php";

  const form = new URLSearchParams();
  form.set("no", scenarioId);
  form.set("action", "kakunin"); // 確認画面スキップ
  form.set("touroku_mail", params.email);
  if (params.name) form.set("touroku_namae1", params.name);
  if (params.key) form.set("touroku_free1", params.key);
  if (params.lineId) form.set("touroku_free2", params.lineId);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (compatible; YumeNaviBot/1.0; +https://life-navigator-peach.vercel.app)",
      },
      body: form.toString(),
      // 30秒以内に応答ないと諦める
      signal: AbortSignal.timeout(30000),
    });

    // ネットワーク層のエラー（403 / 500 等）
    if (!res.ok && res.status !== 302) {
      const detail = await res.text().catch(() => "");
      console.error("[Asmel] HTTP error:", res.status, detail.slice(0, 300));
      return {
        ok: false,
        status: "http_error",
        error: `Asmel HTTP ${res.status}: ${detail.slice(0, 200)}`,
      };
    }

    // 302 リダイレクト = 通常は成功（完了ページへ誘導）
    if (res.status === 302) {
      console.log("[Asmel] 302 redirect → registered");
      return { ok: true, status: "registered" };
    }

    // 200 OK の HTML を解析
    const html = await res.text();
    const result = classifyResponse(html);

    if (result.ok) {
      console.log("[Asmel]", result.status, params.email, result.message || "");
    } else {
      console.error("[Asmel]", result.status, params.email, result.error);
      // デバッグ用に HTML スニペット保存
      const errSnippet = html.match(/<p class="error">[^<]+<\/p>/g);
      if (errSnippet) {
        console.error("[Asmel] error snippet:", errSnippet.slice(0, 3).join(" / "));
      }
    }

    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[Asmel] fetch error:", msg);
    return { ok: false, status: "fetch_error", error: msg };
  }
}
