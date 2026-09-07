"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { PublicPackage } from "@/lib/types";
import { BuyModal } from "./BuyModal";

type Recommendation = {
  id: string;
  name: string;
  price: number;
  amountLabel: string;
  validity: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  recommendations?: Recommendation[];
};

const STARTER: ChatMessage = {
  role: "assistant",
  text: "Hi! I'm your Berna Gee assistant. Tell me what you need — e.g. \"cheap data for streaming under 60 bob\" — and I'll find the best deal.",
};

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [buyTarget, setBuyTarget] = useState<PublicPackage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply, recommendations: data.recommendations },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry, I hit a snag. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function pickRecommendation(rec: Recommendation) {
    setBuyTarget({
      id: rec.id,
      name: rec.name,
      price: rec.price,
      amountLabel: rec.amountLabel,
      validity: rec.validity,
      description: null,
      badge: null,
      isActive: true,
      sortOrder: 0,
    });
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-signal px-4 py-3.5 text-sm font-bold text-ink shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          <Sparkles size={18} />
          Ask AI
        </button>
      )}

      {open && (
        <div className="flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-ink px-4 py-3.5 text-cream">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-signal" />
              <p className="font-display text-sm font-bold">Berna Gee Assistant</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-cream/70 hover:bg-white/10 hover:text-cream"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-forest text-cream"
                      : "bg-cream-deep text-ink"
                  }`}
                >
                  {m.text}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {m.recommendations.map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => pickRecommendation(rec)}
                          className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-left text-xs font-medium text-ink transition-colors hover:border-forest"
                        >
                          <span>
                            {rec.amountLabel} &middot; {rec.validity}
                          </span>
                          <span className="font-bold text-forest">Ksh {rec.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-cream-deep px-3.5 py-2.5">
                  <Loader2 size={14} className="animate-spin text-slate" />
                  <span className="text-xs text-slate">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. cheap data for the weekend"
              className="flex-1 rounded-full border border-line px-3.5 py-2.5 text-sm outline-none focus:border-forest"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-cream disabled:opacity-50"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {buyTarget && <BuyModal pkg={buyTarget} onClose={() => setBuyTarget(null)} />}
    </div>
  );
}
