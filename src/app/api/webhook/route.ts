import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

type WhatsAppMessage = {
  from?: string;
  text?: { body?: string };
};

type WhatsAppValue = {
  messages?: WhatsAppMessage[];
  metadata?: { phone_number_id?: string; display_phone_number?: string };
};

type WhatsAppPayload = {
  entry?: Array<{
    id?: string;
    changes?: Array<{ value?: WhatsAppValue }>;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as WhatsAppPayload;
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    const text = message?.text?.body ?? "";
    const sender = message?.from ?? "";
    const chatId =
      value?.metadata?.phone_number_id ?? entry?.id ?? "";

    if (!text || !sender) {
      return NextResponse.json({ ok: true });
    }

    const lower = text.toLowerCase();
    const isTask = lower.includes("task");
    const isEvent = lower.includes("event");

    if (!isTask && !isEvent) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    if (isTask) {
      await supabase.from("Task").insert({
        id: crypto.randomUUID(),
        title: text.slice(0, 120),
        description: text,
        status: "PENDING",
        openToAll: true,
        source: "WHATSAPP",
        whatsappChatId: chatId,
        whatsappSender: sender,
        whatsappMessage: text,
        createdAt: now,
      });
    } else if (isEvent) {
      await supabase.from("Event").insert({
        id: crypto.randomUUID(),
        title: text.slice(0, 120),
        description: text,
        date: now,
        source: "WHATSAPP",
        whatsappChatId: chatId,
        whatsappSender: sender,
        whatsappMessage: text,
        createdAt: now,
      });
    }
  } catch (error) {
    console.error("[whatsapp-webhook] failed to process payload", error);
  }

  return NextResponse.json({ ok: true });
}
