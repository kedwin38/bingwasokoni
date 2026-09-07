import { MousePointerClick, Smartphone, Zap } from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    title: "Pick a bundle",
    description: "Browse data, minutes, SMS or combo deals and choose what fits your needs.",
  },
  {
    icon: Smartphone,
    title: "Enter your number",
    description: "Add the Safaricom number to receive the bundle and confirm the amount.",
  },
  {
    icon: Zap,
    title: "Pay & get delivered",
    description: "Approve the M-Pesa prompt on your phone — your bundle lands instantly.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream-deep/60 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">How it works</h2>
          <p className="mt-2 text-slate">Three steps. No sign-up. No hassle.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-line bg-white p-6 text-center"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold text-cream">
                STEP {i + 1}
              </span>
              <span className="mx-auto mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-soft text-forest">
                <step.icon size={22} />
              </span>
              <p className="font-display text-lg font-bold text-ink">{step.title}</p>
              <p className="mt-1.5 text-sm text-slate">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
