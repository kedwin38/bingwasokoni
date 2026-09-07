"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Transaction = {
  id: string;
  phoneNumber: string;
  amount: number;
  status: string;
  mpesaReceiptNumber: string | null;
  createdAt: string;
  package: { name: string; amountLabel: string } | null;
};

const FILTERS = ["ALL", "SUCCESS", "PENDING", "FAILED", "TIMEOUT", "CANCELLED"];

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for a refetch on filter change
    setLoading(true);
    const query = filter === "ALL" ? "" : `?status=${filter}`;
    fetch(`/api/admin/transactions${query}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Transactions</h1>
        <p className="text-sm text-slate">All M-Pesa STK Push payment attempts.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              filter === f
                ? "border-forest bg-forest text-cream"
                : "border-line bg-white text-slate hover:border-forest/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-slate">
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate">
                  Loading…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{t.phoneNumber}</td>
                  <td className="px-4 py-3 text-slate">
                    {t.package ? `${t.package.name} (${t.package.amountLabel})` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate">Ksh {t.amount}</td>
                  <td className="px-4 py-3 text-slate">{t.mpesaReceiptNumber ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-slate">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
