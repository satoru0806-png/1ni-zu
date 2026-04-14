// SpeakNote 連絡先 DB (初期: 静的ファイル)
// Phase 2 で Vercel KV / Prisma 化予定。
//
// ⚠️ 実データは speaknote-contacts.local.ts に置き、このファイルは
// サンプル/型のみを持たせる運用を推奨 (.gitignore 対象)。

export type SpeaknoteContact = {
  id: string;
  names: string[]; // 呼称の揺れ (「田中」「たなか」「タナカ」等)
  line_id?: string | null; // LINE URL スキーム用 (通常は line://ti/p/{basic_id} の basic_id)
  line_url?: string | null; // 完全な line:// URL が分かる場合
  email?: string | null;
  phone?: string | null; // E.164 形式推奨 (+8190...)
  default_channel: "line" | "email" | "sms";
  persona: "business" | "friend" | "family";
};

export const SAMPLE_CONTACTS: SpeaknoteContact[] = [
  {
    id: "tanaka",
    names: ["田中", "たなか", "タナカ", "田中さん"],
    line_url: null,
    email: "tanaka@example.com",
    phone: null,
    default_channel: "email",
    persona: "business",
  },
];

// 実データを load する。local ファイルがあればそちらを優先。
export function loadContacts(): SpeaknoteContact[] {
  try {
    // 動的 import が Next.js の静的解析を邪魔しないよう require を使う
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./speaknote-contacts.local");
    if (Array.isArray(mod.CONTACTS)) return mod.CONTACTS as SpeaknoteContact[];
  } catch {
    // ローカルファイルがなければサンプルを使う
  }
  return SAMPLE_CONTACTS;
}
