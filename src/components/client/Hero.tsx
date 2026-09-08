"use client";

import { ShieldCheck, Zap, Clock3 } from "lucide-react";
import { SiteSettings } from "@/lib/types";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section id="top" className="relative overflow-hidden mesh-hero text-cream">
      <div className="grain-overlay" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-signal">
          <span className="relative flex h-2 w-2">
            <span className="pulse-ring absolute inline-flex h-2 w-2 text-signal" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          Instant M-Pesa delivery
        </span>

        <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Data, minutes &amp; SMS,{" "}
          <span className="text-signal">delivered in seconds.</span>
        </h1>

        <p className="max-w-xl text-base text-cream/75 sm:text-lg">
          {settings.tagline} Pick a bundle, pay with M-Pesa, and get your STK
          push instantly — no accounts, no waiting.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="#packages"
            className="rounded-full bg-signal px-6 py-3 text-sm font-bold text-ink shadow-lg shadow-signal/20 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Browse Bundles
          </a>
          <a
            href="#contact"
            className="rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream/90 transition-colors hover:border-cream/50 hover:bg-cream/5"
          >
            Talk to us
          </a>
        </div>

        <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <TrustCard icon={<Zap size={16} />} title="Instant activation" subtitle="Delivered in seconds" />
          <TrustCard icon={<ShieldCheck size={16} />} title="Secure M-Pesa" subtitle="Encrypted end-to-end" />
          <TrustCard icon={<Clock3 size={16} />} title="24/7 support" subtitle="Always here to help" />
        </div>
      </div>
    </section>
  );
}

function TrustCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-cream/5 px-4 py-3 backdrop-blur-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-cream">{title}</p>
        <p className="text-xs text-cream/60">{subtitle}</p>
      </div>
    </div>
  );
}
