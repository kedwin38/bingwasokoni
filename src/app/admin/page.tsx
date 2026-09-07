"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Wallet, TrendingUp, Clock, MessageSquareWarning, Package, Users } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Stats = {
  totalRevenue: number;
  revenue24h: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  newMessages: number;
  totalPackages: number;
  totalAdmins: number;
  revenueByDay: { date: string; amount: number }[];
  recentTransactions: {
    id: string;
    phoneNumber: string;
    amount: number;
    status: string;
    createdAt: string;
    package: { name: string } | null;
  }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-slate">A live snapshot of sales, packages and support.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Wallet size={18} />} label="Total revenue" value={`Ksh ${stats?.totalRevenue ?? 0}`} />
        <StatCard icon={<TrendingUp size={18} />} label="Last 24h" value={`Ksh ${stats?.revenue24h ?? 0}`} />
        <StatCard icon={<Clock size={18} />} label="Pending payments" value={stats?.pendingCount ?? 0} />
        <StatCard
          icon={<MessageSquareWarning size={18} />}
          label="New messages"
          value={stats?.newMessages ?? 0}
        />
        <StatCard icon={<Package size={18} />} label="Active packages" value={stats?.totalPackages ?? 0} />
        <StatCard icon={<Users size={18} />} label="Admins" value={stats?.totalAdmins ?? 0} />
        <StatCard icon={<TrendingUp size={18} />} label="Successful orders" value={stats?.successCount ?? 0} />
        <StatCard icon={<Clock size={18} />} label="Failed / timeout" value={stats?.failedCount ?? 0} />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="mb-3 font-display text-base font-bold text-ink">Revenue (last 7 days)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.revenueByDay ?? []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e6b47" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0e6b47" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d2" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#0e6b47" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="mb-3 font-display text-base font-bold text-ink">Recent transactions</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-slate">
                <th className="pb-2 pr-4">Phone</th>
                <th className="pb-2 pr-4">Package</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTransactions.map((t) => (
                <tr key={t.id} className="border-b border-line/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-ink">{t.phoneNumber}</td>
                  <td className="py-2.5 pr-4 text-slate">{t.package?.name ?? "—"}</td>
                  <td className="py-2.5 pr-4 text-slate">Ksh {t.amount}</td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-2.5 text-slate">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!stats?.recentTransactions.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-signal-soft text-forest">
        {icon}
      </span>
      <p className="text-xs text-slate">{label}</p>
      <p className="font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
