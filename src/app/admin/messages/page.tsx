"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Mail, MailOpen, CheckCircle2 } from "lucide-react";

type Message = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: "NEW" | "READ" | "RESOLVED";
  createdAt: string;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/messages");
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function updateStatus(id: string, status: Message["status"]) {
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    toast.success("Message deleted.");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Customer messages</h1>
        <p className="text-sm text-slate">Queries submitted from the client contact panel.</p>
      </div>

      {loading ? (
        <p className="text-slate">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-slate">
          No messages yet.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{m.name}</p>
                  <p className="text-xs text-slate">
                    {m.phone} {m.email ? `· ${m.email}` : ""} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusPill status={m.status} />
              </div>
              <p className="mt-3 text-sm text-ink">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.status !== "READ" && (
                  <button
                    onClick={() => updateStatus(m.id, "READ")}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate hover:border-forest hover:text-forest"
                  >
                    <MailOpen size={13} /> Mark read
                  </button>
                )}
                {m.status !== "RESOLVED" && (
                  <button
                    onClick={() => updateStatus(m.id, "RESOLVED")}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate hover:border-forest hover:text-forest"
                  >
                    <CheckCircle2 size={13} /> Mark resolved
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate hover:border-red-300 hover:text-red-600"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Message["status"] }) {
  const styles: Record<Message["status"], string> = {
    NEW: "bg-amber/20 text-amber-dark",
    READ: "bg-cream-deep text-slate",
    RESOLVED: "bg-signal-soft text-forest-dark",
  };
  const icons: Record<Message["status"], React.ReactNode> = {
    NEW: <Mail size={12} />,
    READ: <MailOpen size={12} />,
    RESOLVED: <CheckCircle2 size={12} />,
  };
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {icons[status]} {status}
    </span>
  );
}
