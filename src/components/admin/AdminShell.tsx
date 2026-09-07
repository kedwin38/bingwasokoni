"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Inbox,
  Receipt,
  LogOut,
  Zap,
} from "lucide-react";
import { AdminSessionPayload } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/settings", label: "Payment Settings", icon: Settings },
  { href: "/admin/admins", label: "Admins", icon: Users, superAdminOnly: true },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminSessionPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-cream-deep/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-ink text-cream sm:flex">
        <div className="flex items-center gap-2.5 border-b border-cream/10 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal text-ink">
            <Zap size={16} strokeWidth={2.5} />
          </span>
          <span className="font-display text-sm font-bold">Berna Gee Admin</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems
            .filter((item) => !item.superAdminOnly || admin.role === "SUPER_ADMIN")
            .map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-signal/15 text-signal"
                      : "text-cream/70 hover:bg-white/5 hover:text-cream"
                  }`}
                >
                  <item.icon size={17} />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="border-t border-cream/10 px-4 py-4">
          <p className="truncate text-xs font-semibold text-cream">{admin.name}</p>
          <p className="truncate text-xs text-cream/50">{admin.email}</p>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-cream/70 transition-colors hover:bg-white/5 hover:text-cream"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-5 py-3 sm:hidden">
          <span className="font-display text-sm font-bold text-ink">Berna Gee Admin</span>
          <button onClick={logout} className="text-xs font-semibold text-forest">
            Sign out
          </button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
