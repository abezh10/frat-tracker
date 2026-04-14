import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type NotifyBody = {
  to?: string;
  type?: "task" | "event";
  id?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as NotifyBody;
  const { to, type, id } = body;

  if (!to || !type || !id) {
    return NextResponse.json(
      { error: "Missing to, type, or id" },
      { status: 400 }
    );
  }

  if (type !== "task" && type !== "event") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const table = type === "task" ? "Task" : "Event";
  const supabase = createAdminClient();

  const { data: record, error } = await supabase
    .from(table)
    .select("id, title, description, whatsappMessage")
    .eq("id", id)
    .maybeSingle();

  if (error || !record) {
    return NextResponse.json(
      { error: error?.message ?? "Record not found" },
      { status: 404 }
    );
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json(
      { error: "WhatsApp credentials not configured" },
      { status: 500 }
    );
  }

  const messageBody =
    record.whatsappMessage ??
    record.description ??
    record.title ??
    `${type} ${id}`;

  const waResponse = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: messageBody },
      }),
    }
  );

  const result = await waResponse.json().catch(() => ({}));

  return NextResponse.json(result, { status: waResponse.status });
}
