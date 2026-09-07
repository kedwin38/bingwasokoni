"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicCategory, PublicPackage } from "@/lib/types";
import { CategoryIcon } from "./icon-map";
import { PackageCard } from "./PackageCard";
import { BuyModal } from "./BuyModal";

export function PackageBrowser() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<PublicPackage | null>(null);

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        if (data.categories?.[0]) setActiveSlug(data.categories[0].slug);
      })
      .finally(() => setLoading(false));
  }, []);

  const active = useMemo(
    () => categories.find((c) => c.slug === activeSlug) ?? categories[0],
    [categories, activeSlug],
  );

  return (
    <section id="packages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-col gap-2 text-center sm:text-left">
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Choose your bundle
        </h2>
        <p className="text-slate">
          Every package is delivered instantly the moment your M-Pesa payment confirms.
        </p>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-slate">
          No packages available right now. Please check back shortly.
        </p>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap justify-center gap-2 sm:justify-start">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveSlug(cat.slug)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  cat.slug === activeSlug
                    ? "border-forest bg-forest text-cream shadow-sm"
                    : "border-line bg-white text-slate hover:border-forest/40 hover:text-forest"
                }`}
              >
                <CategoryIcon icon={cat.icon} size={15} />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active?.packages.length ? (
              active.packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onSelect={setSelectedPkg} />
              ))
            ) : (
              <p className="col-span-full rounded-2xl border border-dashed border-line p-10 text-center text-slate">
                No packages in this category yet.
              </p>
            )}
          </div>
        </>
      )}

      {selectedPkg && (
        <BuyModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
      )}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-line bg-cream-deep" />
      ))}
    </div>
  );
}
