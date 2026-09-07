"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ContactPanel() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send your message. Try again.");
        return;
      }
      setSent(true);
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="contact" className="fixed bottom-5 left-5 z-40">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-3.5 text-sm font-semibold text-cream shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle size={18} />
          Leave a message
        </button>
      )}

      {open && (
        <div className="w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-line bg-white p-5 shadow-2xl">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="font-display text-base font-bold text-ink">Talk to our team</p>
              <p className="text-xs text-slate">We reply as fast as we can, usually within minutes.</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate hover:bg-cream-deep hover:text-ink"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {sent ? (
            <div className="py-6 text-center">
              <p className="font-semibold text-forest">Message sent!</p>
              <p className="mt-1 text-sm text-slate">
                Thanks for reaching out — our team will get back to you shortly.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm font-semibold text-forest underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              <input
                required
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              <textarea
                required
                placeholder="How can we help?"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-bold text-cream hover:bg-forest-dark disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send message
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
