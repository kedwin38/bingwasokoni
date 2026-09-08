import { Phone, MessageCircle, ShieldCheck } from "lucide-react";
import { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-cream/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-bold text-cream">{settings.businessName}</p>
          <p className="mt-1 max-w-xs text-sm text-cream/60">{settings.tagline}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <a
            href={`tel:${settings.supportPhone}`}
            className="flex items-center gap-2 transition-colors hover:text-signal"
          >
            <Phone size={15} /> {settings.supportPhone}
          </a>
          <a
            href={`https://wa.me/254${settings.whatsappPhone.replace(/\D/g, "").slice(-9)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-signal"
          >
            <MessageCircle size={15} /> WhatsApp us
          </a>
          <span className="flex items-center gap-2 text-cream/50">
            <ShieldCheck size={15} /> Secure M-Pesa Payments
          </span>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
      </div>
    </footer>
  );
}
