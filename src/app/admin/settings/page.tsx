"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldAlert, Zap, Globe } from "lucide-react";

type MpesaConfigView = {
  environment: "sandbox" | "production";
  shortCode: string;
  tillType: "paybill" | "till";
  consumerKeyMasked: string;
  consumerSecretMasked: string;
  passkeyMasked: string;
  accountReference: string;
  transactionDesc: string;
  callbackBaseUrl: string;
  isConfigured: boolean;
};

type PesapalConfigView = {
  environment: "sandbox" | "production";
  consumerKeyMasked: string;
  consumerSecretMasked: string;
  callbackBaseUrl: string;
  ipnRegistered: boolean;
  isConfigured: boolean;
};

type SiteSettingsForm = {
  businessName: string;
  tagline: string;
  supportPhone: string;
  whatsappPhone: string;
};

type Gateway = "DARAJA" | "PESAPAL";

export default function AdminSettingsPage() {
  const [activeGateway, setActiveGateway] = useState<Gateway>("DARAJA");
  const [switching, setSwitching] = useState(false);

  const [config, setConfig] = useState<MpesaConfigView | null>(null);
  const [mpesaForm, setMpesaForm] = useState({
    environment: "sandbox" as "sandbox" | "production",
    shortCode: "",
    tillType: "paybill" as "paybill" | "till",
    consumerKey: "",
    consumerSecret: "",
    passkey: "",
    accountReference: "",
    transactionDesc: "",
    callbackBaseUrl: "",
  });
  const [savingMpesa, setSavingMpesa] = useState(false);

  const [pesapalConfig, setPesapalConfig] = useState<PesapalConfigView | null>(null);
  const [pesapalForm, setPesapalForm] = useState({
    environment: "sandbox" as "sandbox" | "production",
    consumerKey: "",
    consumerSecret: "",
    callbackBaseUrl: "",
  });
  const [savingPesapal, setSavingPesapal] = useState(false);

  const [siteForm, setSiteForm] = useState<SiteSettingsForm | null>(null);
  const [savingSite, setSavingSite] = useState(false);

  function loadMpesa() {
    fetch("/api/admin/settings/mpesa")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data.config);
        setMpesaForm((f) => ({
          ...f,
          environment: data.config.environment,
          shortCode: data.config.shortCode,
          tillType: data.config.tillType,
          accountReference: data.config.accountReference,
          transactionDesc: data.config.transactionDesc,
          callbackBaseUrl:
            data.config.callbackBaseUrl ||
            (typeof window !== "undefined" ? window.location.origin : ""),
        }));
      });
  }

  function loadPesapal() {
    fetch("/api/admin/settings/pesapal")
      .then((res) => res.json())
      .then((data) => {
        setPesapalConfig(data.config);
        setPesapalForm((f) => ({
          ...f,
          environment: data.config.environment,
          callbackBaseUrl:
            data.config.callbackBaseUrl ||
            (typeof window !== "undefined" ? window.location.origin : ""),
        }));
      });
  }

  useEffect(() => {
    fetch("/api/admin/settings/gateway")
      .then((res) => res.json())
      .then((data) => setActiveGateway(data.activeGateway));
    loadMpesa();
    loadPesapal();
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => setSiteForm(data.settings));
  }, []);

  async function switchGateway(gateway: Gateway) {
    if (gateway === activeGateway || switching) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/admin/settings/gateway", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeGateway: gateway }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not switch payment gateway.");
        return;
      }
      setActiveGateway(data.activeGateway);
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success(`${gateway === "PESAPAL" ? "Pesapal" : "M-Pesa Daraja"} is now the active payment gateway.`);
      }
    } finally {
      setSwitching(false);
    }
  }

  async function saveMpesa(e: React.FormEvent) {
    e.preventDefault();
    setSavingMpesa(true);
    try {
      const res = await fetch("/api/admin/settings/mpesa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mpesaForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save M-Pesa settings.");
        return;
      }
      toast.success("M-Pesa Daraja settings saved.");
      setMpesaForm((f) => ({ ...f, consumerKey: "", consumerSecret: "", passkey: "" }));
      loadMpesa();
    } finally {
      setSavingMpesa(false);
    }
  }

  async function savePesapal(e: React.FormEvent) {
    e.preventDefault();
    setSavingPesapal(true);
    try {
      const res = await fetch("/api/admin/settings/pesapal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pesapalForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save Pesapal settings.");
        return;
      }
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success("Pesapal settings saved.");
      }
      setPesapalForm((f) => ({ ...f, consumerKey: "", consumerSecret: "" }));
      loadPesapal();
    } finally {
      setSavingPesapal(false);
    }
  }

  async function saveSite(e: React.FormEvent) {
    e.preventDefault();
    if (!siteForm) return;
    setSavingSite(true);
    try {
      const res = await fetch("/api/admin/settings/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save site settings.");
        return;
      }
      toast.success("Site settings saved.");
    } finally {
      setSavingSite(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Payment &amp; Site Settings</h1>
        <p className="text-sm text-slate">
          Choose which payment gateway is live, manage each gateway&apos;s API credentials, and general site info.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-1 font-display text-lg font-bold text-ink">Active payment gateway</h2>
        <p className="mb-4 text-sm text-slate">
          Customers always pay with M-Pesa — this only controls which API processes the payment behind the scenes.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <GatewayOption
            label="M-Pesa Daraja"
            description="Direct Safaricom STK Push integration."
            icon={<Zap size={18} />}
            active={activeGateway === "DARAJA"}
            configured={config?.isConfigured ?? false}
            disabled={switching}
            onSelect={() => switchGateway("DARAJA")}
          />
          <GatewayOption
            label="Pesapal"
            description="Hosted checkout — M-Pesa, cards & more via Pesapal."
            icon={<Globe size={18} />}
            active={activeGateway === "PESAPAL"}
            configured={pesapalConfig?.isConfigured ?? false}
            disabled={switching}
            onSelect={() => switchGateway("PESAPAL")}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">M-Pesa Daraja API</h2>
            {activeGateway === "DARAJA" && (
              <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
                Active
              </span>
            )}
          </div>
          {config && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                config.isConfigured ? "bg-signal-soft text-forest-dark" : "bg-amber/20 text-amber-dark"
              }`}
            >
              {config.isConfigured ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {config.isConfigured ? "Configured" : "Not fully configured"}
            </span>
          )}
        </div>

        <form onSubmit={saveMpesa} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Environment">
            <select
              value={mpesaForm.environment}
              onChange={(e) => setMpesaForm({ ...mpesaForm, environment: e.target.value as "sandbox" | "production" })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            >
              <option value="sandbox">Sandbox (testing)</option>
              <option value="production">Production (live)</option>
            </select>
          </Field>
          <Field label="Payment mode">
            <select
              value={mpesaForm.tillType}
              onChange={(e) => setMpesaForm({ ...mpesaForm, tillType: e.target.value as "paybill" | "till" })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            >
              <option value="paybill">Paybill</option>
              <option value="till">Till Number (Buy Goods)</option>
            </select>
          </Field>
          <Field label="Business Short Code / Till Number">
            <input
              required
              value={mpesaForm.shortCode}
              onChange={(e) => setMpesaForm({ ...mpesaForm, shortCode: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <Field label="Callback base URL (your live domain)">
            <input
              required
              placeholder="https://yourdomain.com"
              value={mpesaForm.callbackBaseUrl}
              onChange={(e) => setMpesaForm({ ...mpesaForm, callbackBaseUrl: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <Field label={`Consumer Key ${config?.consumerKeyMasked ? `(current: ${config.consumerKeyMasked})` : ""}`}>
            <input
              placeholder="Leave blank to keep current"
              value={mpesaForm.consumerKey}
              onChange={(e) => setMpesaForm({ ...mpesaForm, consumerKey: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <Field label={`Consumer Secret ${config?.consumerSecretMasked ? `(current: ${config.consumerSecretMasked})` : ""}`}>
            <input
              placeholder="Leave blank to keep current"
              type="password"
              value={mpesaForm.consumerSecret}
              onChange={(e) => setMpesaForm({ ...mpesaForm, consumerSecret: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <Field label={`Passkey ${config?.passkeyMasked ? `(current: ${config.passkeyMasked})` : ""}`}>
            <input
              placeholder="Leave blank to keep current"
              type="password"
              value={mpesaForm.passkey}
              onChange={(e) => setMpesaForm({ ...mpesaForm, passkey: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <Field label="Account reference">
            <input
              required
              value={mpesaForm.accountReference}
              onChange={(e) => setMpesaForm({ ...mpesaForm, accountReference: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Transaction description">
              <input
                required
                value={mpesaForm.transactionDesc}
                onChange={(e) => setMpesaForm({ ...mpesaForm, transactionDesc: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingMpesa}
              className="flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-cream hover:bg-forest-dark disabled:opacity-60"
            >
              {savingMpesa ? <Loader2 size={16} className="animate-spin" /> : null}
              Save M-Pesa Daraja settings
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Pesapal</h2>
            {activeGateway === "PESAPAL" && (
              <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
                Active
              </span>
            )}
          </div>
          {pesapalConfig && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                pesapalConfig.isConfigured ? "bg-signal-soft text-forest-dark" : "bg-amber/20 text-amber-dark"
              }`}
            >
              {pesapalConfig.isConfigured ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {pesapalConfig.isConfigured ? "Configured" : "Not fully configured"}
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-slate">
          Saving valid credentials and a callback URL automatically registers the IPN webhook with Pesapal.
          {pesapalConfig && (
            <span className={pesapalConfig.ipnRegistered ? "text-forest-dark" : "text-amber-dark"}>
              {" "}
              IPN webhook: {pesapalConfig.ipnRegistered ? "registered" : "not registered yet"}.
            </span>
          )}
        </p>

        <form onSubmit={savePesapal} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Environment">
            <select
              value={pesapalForm.environment}
              onChange={(e) =>
                setPesapalForm({ ...pesapalForm, environment: e.target.value as "sandbox" | "production" })
              }
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            >
              <option value="sandbox">Sandbox (testing)</option>
              <option value="production">Production (live)</option>
            </select>
          </Field>
          <Field label="Callback base URL (your live domain)">
            <input
              required
              placeholder="https://yourdomain.com"
              value={pesapalForm.callbackBaseUrl}
              onChange={(e) => setPesapalForm({ ...pesapalForm, callbackBaseUrl: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <Field
            label={`Consumer Key ${pesapalConfig?.consumerKeyMasked ? `(current: ${pesapalConfig.consumerKeyMasked})` : ""}`}
          >
            <input
              placeholder="Leave blank to keep current"
              value={pesapalForm.consumerKey}
              onChange={(e) => setPesapalForm({ ...pesapalForm, consumerKey: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <Field
            label={`Consumer Secret ${pesapalConfig?.consumerSecretMasked ? `(current: ${pesapalConfig.consumerSecretMasked})` : ""}`}
          >
            <input
              placeholder="Leave blank to keep current"
              type="password"
              value={pesapalForm.consumerSecret}
              onChange={(e) => setPesapalForm({ ...pesapalForm, consumerSecret: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingPesapal}
              className="flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-cream hover:bg-forest-dark disabled:opacity-60"
            >
              {savingPesapal ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Pesapal settings
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Site information</h2>
        {siteForm && (
          <form onSubmit={saveSite} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business name">
              <input
                required
                value={siteForm.businessName}
                onChange={(e) => setSiteForm({ ...siteForm, businessName: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
            </Field>
            <Field label="Support phone">
              <input
                required
                value={siteForm.supportPhone}
                onChange={(e) => setSiteForm({ ...siteForm, supportPhone: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
            </Field>
            <Field label="WhatsApp number">
              <input
                required
                value={siteForm.whatsappPhone}
                onChange={(e) => setSiteForm({ ...siteForm, whatsappPhone: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Tagline">
                <input
                  required
                  value={siteForm.tagline}
                  onChange={(e) => setSiteForm({ ...siteForm, tagline: e.target.value })}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingSite}
                className="flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-cream hover:bg-forest-dark disabled:opacity-60"
              >
                {savingSite ? <Loader2 size={16} className="animate-spin" /> : null}
                Save site settings
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function GatewayOption({
  label,
  description,
  icon,
  active,
  configured,
  disabled,
  onSelect,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  configured: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-60 ${
        active ? "border-forest bg-signal-soft/40" : "border-line bg-white hover:border-forest/40"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-forest text-cream" : "bg-cream-deep text-slate"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink">{label}</p>
          {active && (
            <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
              Active
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate">{description}</p>
        <p className={`mt-1.5 text-xs font-semibold ${configured ? "text-forest-dark" : "text-amber-dark"}`}>
          {configured ? "Ready" : "Needs setup"}
        </p>
      </div>
    </button>
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
