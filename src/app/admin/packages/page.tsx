"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2, FolderPlus } from "lucide-react";

type Category = { id: string; name: string; slug: string; isActive: boolean };
type Pkg = {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  price: number;
  amountLabel: string;
  validity: string;
  description: string | null;
  badge: string | null;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  categoryId: "",
  name: "",
  price: 0,
  amountLabel: "",
  validity: "",
  description: "",
  badge: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [pkgRes, catRes] = await Promise.all([
      fetch("/api/admin/packages"),
      fetch("/api/admin/categories"),
    ]);
    const pkgData = await pkgRes.json();
    const catData = await catRes.json();
    setPackages(pkgData.packages ?? []);
    setCategories(catData.categories ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadData();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setFormOpen(true);
  }

  function openEdit(pkg: Pkg) {
    setEditingId(pkg.id);
    setForm({
      categoryId: pkg.categoryId,
      name: pkg.name,
      price: pkg.price,
      amountLabel: pkg.amountLabel,
      validity: pkg.validity,
      description: pkg.description ?? "",
      badge: pkg.badge ?? "",
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        sortOrder: Number(form.sortOrder),
        description: form.description || null,
        badge: form.badge || null,
      };
      const res = await fetch(editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save package.");
        return;
      }
      toast.success(editingId ? "Package updated." : "Package created.");
      setFormOpen(false);
      loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Could not delete package.");
      return;
    }
    toast.success("Package deleted.");
    loadData();
  }

  async function toggleActive(pkg: Pkg) {
    await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    loadData();
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not create category.");
      return;
    }
    toast.success("Category created.");
    setCategoryFormOpen(false);
    setCategoryForm({ name: "", slug: "" });
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Packages</h1>
          <p className="text-sm text-slate">Add, edit, or remove data, minutes, SMS and combo bundles.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryFormOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-forest"
          >
            <FolderPlus size={16} /> New Category
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream hover:bg-forest-dark"
          >
            <Plus size={16} /> New Package
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-slate">
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate">
                  Loading…
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate">
                  No packages yet. Create your first one.
                </td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{pkg.name}</p>
                    <p className="text-xs text-slate">
                      {pkg.amountLabel} {pkg.badge ? `· ${pkg.badge}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate">{pkg.category?.name}</td>
                  <td className="px-4 py-3 font-medium text-ink">Ksh {pkg.price}</td>
                  <td className="px-4 py-3 text-slate">{pkg.validity}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(pkg)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        pkg.isActive ? "bg-signal-soft text-forest-dark" : "bg-cream-deep text-slate"
                      }`}
                    >
                      {pkg.isActive ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(pkg)}
                        className="rounded-lg p-2 text-slate hover:bg-cream-deep hover:text-forest"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">
                {editingId ? "Edit package" : "New package"}
              </h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Category">
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Package name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (Ksh)">
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                  />
                </Field>
                <Field label="Sort order">
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount label">
                  <input
                    required
                    placeholder="e.g. 1GB"
                    value={form.amountLabel}
                    onChange={(e) => setForm({ ...form, amountLabel: e.target.value })}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                  />
                </Field>
                <Field label="Validity">
                  <input
                    required
                    placeholder="e.g. 24Hrs"
                    value={form.validity}
                    onChange={(e) => setForm({ ...form, validity: e.target.value })}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                  />
                </Field>
              </div>
              <Field label="Badge (optional)">
                <input
                  placeholder="e.g. BEST SELLER, HOT DEAL"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                />
              </Field>
              <Field label="Description (optional)">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Visible to customers
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-bold text-cream hover:bg-forest-dark disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editingId ? "Save changes" : "Create package"}
            </button>
          </form>
        </div>
      )}

      {categoryFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateCategory}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">New category</h2>
              <button type="button" onClick={() => setCategoryFormOpen(false)} className="text-slate hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Name">
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                />
              </Field>
              <Field label="Slug (lowercase, no spaces)">
                <input
                  required
                  placeholder="e.g. weekend-deals"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                />
              </Field>
            </div>
            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-forest px-4 py-3 text-sm font-bold text-cream hover:bg-forest-dark"
            >
              Create category
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate">{label}</span>
      {children}
    </label>
  );
}
