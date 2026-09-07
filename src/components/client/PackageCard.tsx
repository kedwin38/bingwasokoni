"use client";

import { ArrowRight } from "lucide-react";
import { PublicPackage } from "@/lib/types";

export function PackageCard({
  pkg,
  onSelect,
}: {
  pkg: PublicPackage;
  onSelect: (pkg: PublicPackage) => void;
}) {
  const isHot = pkg.badge?.toUpperCase().includes("HOT");
  return (
    <button
      onClick={() => onSelect(pkg)}
      className="group relative flex flex-col items-start gap-3 rounded-2xl border border-line bg-white/70 p-5 text-left shadow-[0_1px_2px_rgba(10,31,22,0.04)] transition-all hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-[0_12px_24px_-8px_rgba(14,107,71,0.25)]"
    >
      {pkg.badge && (
        <span
          className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
            isHot ? "bg-amber text-ink" : "bg-signal text-ink"
          }`}
        >
          {pkg.badge}
        </span>
      )}

      <div className="flex w-full items-baseline justify-between">
        <span className="font-display text-2xl font-bold text-ink">
          Ksh {pkg.price}
        </span>
        <span className="text-xs font-medium text-slate">{pkg.validity}</span>
      </div>

      <div>
        <p className="font-semibold text-ink">{pkg.amountLabel}</p>
        <p className="mt-0.5 text-sm text-slate">{pkg.name}</p>
      </div>

      {pkg.description && (
        <p className="line-clamp-2 text-xs text-slate/80">{pkg.description}</p>
      )}

      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-forest transition-colors group-hover:text-forest-dark">
        Buy now
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
