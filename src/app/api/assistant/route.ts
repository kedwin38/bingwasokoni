import { NextRequest, NextResponse } from "next/server";
import { askAssistant, AssistantResult } from "@/lib/assistant";

async function enrichWithLLM(message: string, base: AssistantResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return base.reply;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system:
          "You are a friendly, concise shopping assistant for a Kenyan data bundle reseller called BingwaSokoni. Given a customer's message and a shortlist of matching packages, write a short warm reply (2-4 sentences max, no markdown headers) recommending from the shortlist. Never invent packages or prices outside the shortlist provided.",
        messages: [
          {
            role: "user",
            content: `Customer said: "${message}"\n\nShortlist:\n${base.recommendations
              .map((p) => `- ${p.name}: ${p.amountLabel}, valid ${p.validity}, Ksh ${p.price}`)
              .join("\n")}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return base.reply;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : base.reply;
  } catch {
    return base.reply;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.slice(0, 500) : "";

  const base = await askAssistant(message);
  const reply = await enrichWithLLM(message, base);

  return NextResponse.json({ reply, recommendations: base.recommendations });
}
