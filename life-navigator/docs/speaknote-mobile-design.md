# SpeakNote Mobile 設計図 (iPhone + Siri ショートカット + Vercel API)

## ゴール

**「話すだけで、適切な場所に適切な形で届く」**

象徴的ユースケース: 運転中に「田中さんに30分遅れますって送って」と話す → AI 整形「30分ほど遅れます。申し訳ございません。」→ 田中さんの LINE に送信 → 手を一切使わず完了。

## 全体構成

```
[iPhone: Hey Siri, SpeakNote] → [Siri ショートカット] → Vercel API → Claude Haiku
                                         ↓
                     {shaped, recipient, channel} を取得
                                         ↓
                  チャネル分岐: line:// / mailto: / sms:
                                         ↓
                          Siri「送信しますか?」→「はい」
                                         ↓
                                    送信完了
```

## API エンドポイント: `POST /api/speaknote`

**Auth:** `Authorization: Bearer ${SPEAKNOTE_TOKEN}` (環境変数 `SPEAKNOTE_TOKEN`)

**Request:**
```json
{
  "text": "田中さんに30分遅れますって送って",
  "context": { "now": "2026-04-14T15:30:00+09:00" }
}
```

**Response:**
```json
{
  "shaped": "30分ほど遅れます。申し訳ございません。",
  "recipient": { "name": "田中", "line_id": "U1234...", "email": "...", "phone": "..." },
  "channel": "line",
  "confidence": 0.95,
  "needs_confirmation": false
}
```

## 連絡先 DB

初期は `src/lib/speaknote-contacts.ts` の静的 TypeScript 配列。
Phase 2 で Vercel KV or Prisma に移行予定。

```ts
{
  id: "tanaka",
  names: ["田中", "たなか", "タナカ"],
  line_id: "Uxxx...",
  email: "tanaka@example.com",
  phone: "+8190...",
  default_channel: "line",
  persona: "friend" | "business" | "family"
}
```

## Siri ショートカット構成 (iPhone で手動作成)

1. **Dictate Text** — 日本語、一時停止で終了
2. **Get Contents of URL** — `POST https://<your-vercel>/api/speaknote`
   - Headers: `Authorization: Bearer <SPEAKNOTE_TOKEN>`, `Content-Type: application/json`
   - Body: `{"text": <Dictated Text>, "context": {"now": <Current Date ISO>}}`
3. **Get Dictionary Value** — key=`channel` / `shaped` / `recipient.name` 等
4. **Speak** — 「{recipient.name}さんに{channel}で送ります。『{shaped}』」
5. **Ask for Input** — 「送信しますか? (はい/いいえ)」
6. **If** Yes:
   - channel=="line" → Open URL `https://line.me/R/share?text=<shaped>` (当面はトーク画面を開くまで)
   - channel=="email" → `mailto:<email>?body=<shaped>`
   - channel=="sms" → `sms:<phone>&body=<shaped>`
7. **Speak** — 「送りました」

起動方法:
- 「Hey Siri, SpeakNote」(ショートカット名)
- CarPlay ダッシュボードにピン
- iPhone ロック画面の Siri

## セキュリティ

- Vercel 環境変数: `ANTHROPIC_API_KEY` (既存), `SPEAKNOTE_TOKEN` (新規)
- ショートカット側で `SPEAKNOTE_TOKEN` をヘッダ付与
- 連絡先 DB は Git 管理から除外推奨(`speaknote-contacts.local.ts` + `.gitignore`)、または Vercel KV 使用

## 既知の制約

- **LINE 完全自動送信は不可**(公式 API が個人宛送信を許可していない)。Phase 1 では LINE トーク画面を開くまで。送信ボタンは手動 or Siri 読み上げ確認後 1 タップ
- **SMS / メールは URL スキームで本文プリフィル可能**、送信は iOS の仕様上 1 タップ必要
- CarPlay 対応メッセージングは Apple 純正 + LINE 本家のみ。SpeakNote は Siri 経由での制御となる

## フェーズ

### Phase 1 (MVP, 1〜2 日)
- [x] 設計図
- [ ] `/api/speaknote/route.ts` 新設
- [ ] `src/lib/speaknote-prompt.ts` (専用プロンプト)
- [ ] `src/lib/speaknote-contacts.ts` (連絡先 DB ひな形)
- [ ] `SPEAKNOTE_TOKEN` 環境変数対応
- [ ] Siri ショートカット手順書

### Phase 2 (1 週)
- [ ] 連絡先 DB を Vercel KV / Prisma 化
- [ ] 連絡先編集 Web UI
- [ ] 送信結果の音声フィードバック磨き込み

### Phase 3 (以降)
- [ ] カレンダー登録 (`calshow:`)
- [ ] リマインダー
- [ ] 夢ナビの日記/MIT への流し込み
