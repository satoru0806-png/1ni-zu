# Life Navigator

AIと習慣化で「人生の4大悩み（人間関係・お金・仕事・健康）」を整えるアプリ MVP版

## ローカル起動手順

```bash
cd life-navigator
npm install
npx prisma migrate dev
npm run dev
```

ブラウザで http://localhost:3000 を開く

## ページ構成

| パス | 内容 |
|------|------|
| `/onboarding` | 夢の登録（最大3つ） |
| `/today` | 今日のMIT + 4大スコア + メモ入力 |
| `/review` | 夜の振り返り（できたこと/感謝/明日やること） |
| `/dashboard` | 4メーター表示 + 今日の状態 + 過去7日ログ |
| `/history` | 日別の詳細表示 |
| `/watch` | スマートウォッチ用ミニビュー |

## 技術スタック

- Next.js (App Router) + TypeScript + Tailwind CSS
- SQLite + Prisma
- AI: ルールベースMVP（後でOpenAI/Claude APIに差し替え可能）

## データモデル

- **Dream** - id, text, createdAt
- **DayLog** - 1日1レコード（date YYYY-MM-DD unique）、MIT/スコア/振り返り/メモを統合管理

## DBリセット

```bash
npx prisma migrate reset
```
