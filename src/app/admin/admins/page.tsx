"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X, Loader2, Trash2, ShieldCheck } from "lucide-react";

type Admin = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" as "ADMIN" | "SUPER_ADMIN" });

  async function load() {
    const [adminsRes, meRes] = await Promise.all([
      fetch("/api/admin/admins"),
      fetch("/api/admin/me"),
    ]);
    const adminsData = await adminsRes.json();
    const meData = await meRes.json();
    setAdmins(adminsData.admins ?? []);
    setMe(meData.admin ? { id: meData.admin.sub, role: meData.admin.role } : null);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const isSuperAdmin = me?.role === "SUPER_ADMIN";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create admin.");
        return;
      }
      toast.success("Admin account created.");
      setFormOpen(false);
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(admin: Admin) {
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !admin.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not update admin.");
      return;
    }
    load();
  }

  async function handleDelete(admin: Admin) {
    if (!confirm(`Remove ${admin.name}'s admin access?`)) return;
    const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not delete admin.");
      return;
    }
    toast.success("Admin removed.");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Admin accounts</h1>
          <p className="text-sm text-slate">
            {isSuperAdmin
              ? "Add new admins and manage access."
              : "Only a super admin can add or remove admin accounts."}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream hover:bg-forest-dark"
          >
            <Plus size={16} /> New Admin
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-slate">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last login</th>
              {isSuperAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">
                  <span className="flex items-center gap-1.5">
                    {a.name}
                    {a.role === "SUPER_ADMIN" && <ShieldCheck size={14} className="text-forest" />}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate">{a.email}</td>
                <td className="px-4 py-3 text-slate">{a.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</td>
                <td className="px-4 py-3">
                  <button
                    disabled={!isSuperAdmin || a.id === me?.id}
                    onClick={() => toggleActive(a)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed ${
                      a.isActive ? "bg-signal-soft text-forest-dark" : "bg-cream-deep text-slate"
                    }`}
                  >
                    {a.isActive ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate">
                  {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "Never"}
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        disabled={a.id === me?.id}
                        onClick={() => handleDelete(a)}
                        className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">New admin</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              <input
                required
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              <input
                required
                type="password"
                placeholder="Temporary password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "SUPER_ADMIN" })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-bold text-cream hover:bg-forest-dark disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Create admin
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
