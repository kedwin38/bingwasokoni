"use client";

import { useEffect, useRef, useState } from "react";
import { X, Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PublicPackage, CheckoutStatus } from "@/lib/types";

type Stage = "form" | "waiting" | "success" | "failed";

export function BuyModal({ pkg, onClose }: { pkg: PublicPackage; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<CheckoutStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handlePay() {
    setErrorMsg(null);
    const digits = phone.replace(/\D/g, "");
    if (!/^(0|254|\+254)?(7|1)\d{8}$/.test(phone.replace(/\s/g, ""))) {
      setErrorMsg("Enter a valid Safaricom number, e.g. 07XXXXXXXX");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setStage("waiting");
      startPolling(data.checkoutRequestId);
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startPolling(id: string) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/checkout/status/${id}`);
        const data = await res.json();
        const tx: CheckoutStatus | undefined = data.transaction;
        if (!tx) return;
        setStatusResult(tx);
        if (tx.status === "SUCCESS") {
          setStage("success");
          toast.success("Payment received! Your bundle is on its way.");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (tx.status === "FAILED" || tx.status === "CANCELLED" || tx.status === "TIMEOUT") {
          setStage("failed");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // keep polling
      }
      if (attempts > 40 && pollRef.current) {
        clearInterval(pollRef.current);
        setStage("failed");
      }
    }, 3000);
  }

  function retry() {
    setStage("form");
    setStatusResult(null);
    setErrorMsg(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-signal">
              {pkg.amountLabel} &middot; {pkg.validity}
            </p>
            <h3 className="font-display text-xl font-bold text-ink">{pkg.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate transition-colors hover:bg-cream-deep hover:text-ink"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {stage === "form" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-cream-deep px-4 py-3">
              <p className="text-sm text-slate">Amount to pay</p>
              <p className="font-display text-3xl font-bold text-ink">Ksh {pkg.price}</p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">M-Pesa phone number</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-forest"
              />
            </label>
            {errorMsg && <p className="text-sm font-medium text-red-600">{errorMsg}</p>}
            <button
              onClick={handlePay}
              disabled={submitting || !phone}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3.5 text-base font-bold text-cream transition-transform hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              Pay Now
            </button>
            <p className="text-center text-xs text-slate">
              You&apos;ll receive an M-Pesa PIN prompt on your phone.
            </p>
          </div>
        )}

        {stage === "waiting" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-signal-soft text-forest">
              <span className="pulse-ring absolute inline-flex h-16 w-16 text-signal" />
              <Smartphone size={28} />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-ink">Check your phone</p>
              <p className="mt-1 text-sm text-slate">
                Enter your M-Pesa PIN to complete the Ksh {pkg.price} payment for {pkg.amountLabel}.
              </p>
            </div>
            <p className="text-xs text-slate/70">This usually takes a few seconds…</p>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={52} className="text-forest" />
            <p className="font-display text-xl font-bold text-ink">Payment Successful!</p>
            <p className="text-sm text-slate">
              {pkg.amountLabel} is being delivered to your line now.
            </p>
            {statusResult?.mpesaReceiptNumber && (
              <p className="rounded-full bg-cream-deep px-4 py-1.5 text-xs font-semibold text-ink">
                Receipt: {statusResult.mpesaReceiptNumber}
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-forest px-4 py-3 text-base font-bold text-cream hover:bg-forest-dark"
            >
              Done
            </button>
          </div>
        )}

        {stage === "failed" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle size={52} className="text-red-500" />
            <p className="font-display text-xl font-bold text-ink">Payment not completed</p>
            <p className="text-sm text-slate">
              {statusResult?.resultDesc ?? "The request was cancelled or timed out. You can try again."}
            </p>
            <button
              onClick={retry}
              className="mt-2 w-full rounded-xl bg-forest px-4 py-3 text-base font-bold text-cream hover:bg-forest-dark"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
