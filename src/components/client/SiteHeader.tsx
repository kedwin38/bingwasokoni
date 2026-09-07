"use client";

import { Zap } from "lucide-react";
import { SiteSettings } from "@/lib/types";

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-cream shadow-sm shadow-forest/30">
            <Zap size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            {settings.businessName}
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate sm:flex">
          <a href="#packages" className="transition-colors hover:text-forest">
            Packages
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-forest">
            How it works
          </a>
          <a href="#contact" className="transition-colors hover:text-forest">
            Contact
          </a>
        </nav>
        <a
          href="#packages"
          className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream shadow-sm transition-transform hover:scale-[1.03] hover:bg-forest-dark active:scale-[0.98]"
        >
          Buy Data
        </a>
      </div>
    </header>
  );
}
