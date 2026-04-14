import { NextRequest, NextResponse } from "next/server";
import { buildSpeaknoteSystem, type SpeaknoteAIResult } from "@/lib/speaknote-prompt";
import { loadContacts, type SpeaknoteContact } from "@/lib/speaknote-contacts";

export const runtime = "nodejs";

type ReqBody = {
  text?: string;
  context?: { now?: string };
};

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function enrichRecipient(
  aiRecipientId: string | null,
  aiRecipientName: string | null,
  contacts: SpeaknoteContact[]
): SpeaknoteAIResult["recipient"] {
  if (!aiRecipientId) {
    return { id: null, name: aiRecipientName };
  }
  const c = contacts.find((x) => x.id === aiRecipientId);
  if (!c) return { id: null, name: aiRecipientName };
  return {
    id: c.id,
    name: aiRecipientName ?? c.names[0],
    line_id: c.line_url ?? c.line_id ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
  };
}

export async function POST(req: NextRequest) {
  // Auth
  const expected = process.env.SPEAKNOTE_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== expected) return unauthorized();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "anthropic_key_missing" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as ReqBody;
  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }
  const now = body.context?.now ?? new Date().toISOString();

  const contacts = loadContacts();
  const system = buildSpeaknoteSystem(contacts, now);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "anthropic_error", status: res.status, detail: detail.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const raw = (data.content?.[0]?.text ?? "").trim();

    // JSON 抽出 (前後に余計な文が混ざる可能性への保険)
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json(
        { error: "parse_failed", shaped: text, channel: "unknown", confidence: 0 },
        { status: 200 }
      );
    }

    let parsed: SpeaknoteAIResult;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return NextResponse.json(
        { error: "parse_failed", shaped: text, channel: "unknown", confidence: 0 },
        { status: 200 }
      );
    }

    const enrichedRecipient = enrichRecipient(
      parsed.recipient?.id ?? null,
      parsed.recipient?.name ?? null,
      contacts
    );

    const result: SpeaknoteAIResult & { needs_confirmation: boolean } = {
      shaped: parsed.shaped ?? text,
      recipient: enrichedRecipient,
      channel: parsed.channel ?? "unknown",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      reason: parsed.reason,
      needs_confirmation: (parsed.confidence ?? 0) < 0.7,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("speaknote api error", err);
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}
