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

---

## 付録 A: API 動作確認 (curl)

### ローカル動作確認
```bash
cd life-navigator
# 1 つ目のターミナルで起動
SPEAKNOTE_TOKEN=test123 ANTHROPIC_API_KEY=sk-ant-xxx npm run dev

# 2 つ目のターミナルで叩く
curl -X POST http://localhost:3000/api/speaknote \
  -H "Authorization: Bearer test123" \
  -H "Content-Type: application/json" \
  -d '{"text":"田中さんに30分遅れますって送って"}' | jq
```

期待出力:
```json
{
  "shaped": "30分ほど遅れます。申し訳ございません。",
  "recipient": { "id": "tanaka", "name": "田中", "email": "tanaka@example.com", ... },
  "channel": "email",
  "confidence": 0.9,
  "reason": "田中さん=business、既定チャネル=email",
  "needs_confirmation": false
}
```

### 本番 (Vercel) 動作確認
```bash
curl -X POST https://<your-vercel-domain>/api/speaknote \
  -H "Authorization: Bearer <SPEAKNOTE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text":"明日10時に歯医者"}' | jq
```

---

## 付録 B: Siri ショートカット作成手順 (iPhone で)

1. **ショートカット** アプリを開く
2. 右上 `+` で新規作成 → 名前を `SpeakNote` に
3. 以下のアクションを順に追加:

| # | アクション名 | 設定 |
|---|---|---|
| 1 | **テキストを読み上げる** | 内容: `どうぞ` / 声: 日本語 |
| 2 | **テキストを音声入力** (Dictate Text) | 言語: 日本語 / 停止: 一時停止 |
| 3 | **辞書** | キー `text` = (2 の結果), キー `context` = 辞書 { `now`: (現在の日付を ISO 8601 で) } |
| 4 | **URL の内容を取得** | URL: `https://<your-vercel>/api/speaknote`<br>方法: POST<br>ヘッダ: `Authorization: Bearer <SPEAKNOTE_TOKEN>`<br>本文: JSON = (3 の辞書) |
| 5 | **辞書の値を取得** | キー: `shaped` → 変数 `shaped` に保存 |
| 6 | **辞書の値を取得** | キー: `channel` → 変数 `channel` に保存 |
| 7 | **辞書の値を取得** | キー: `recipient` → 変数 `recipient` に保存 |
| 8 | **テキストを読み上げる** | 内容: `<recipient.name> さんに <channel> で送ります。内容: <shaped>` |
| 9 | **入力を要求** | 質問: `送信しますか?` / 入力タイプ: Yes/No |
| 10 | **If [入力結果 = Yes]** | |
| 10a | → **URL を開く** | (channel で分岐) |
| 10a-line | If channel == "line" | `https://line.me/R/share?text=<shaped>` |
| 10a-email | If channel == "email" | `mailto:<recipient.email>?body=<shaped>` |
| 10a-sms | If channel == "sms" | `sms:<recipient.phone>&body=<shaped>` |
| 11 | **テキストを読み上げる** | 内容: `送ります` (or キャンセル時: `キャンセルしました`) |

4. ショートカットを保存
5. 設定 → Siri → 「Hey Siri を有効化」
6. 動作確認: 「Hey Siri, SpeakNote」→ 発話 → 確認 → 送信

### CarPlay で使う
- iPhone の **設定 → 一般 → CarPlay → (車名) → カスタマイズ**
- SpeakNote ショートカットをダッシュボードに追加

### ロック画面から使う
- **設定 → Siri と検索 → ロック中に Siri を許可** をオン

