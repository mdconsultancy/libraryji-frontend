import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { normalizePlanFeatures } from "@/lib/planFeatures";
import type { SubscriptionPlan } from "@/types";
import Reveal from "./Reveal";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");

async function getPlans(): Promise<SubscriptionPlan[]> {
  try {
    // Public endpoint (no auth) — cached at the edge/build and revalidated
    // periodically, so pricing changes show up without a full redeploy but
    // a slow/unreachable backend can never block this marketing page.
    const res = await fetch(`${API_BASE_URL}/plans`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function Pricing() {
  const plans = await getPlans();

  if (plans.length === 0) return null;

  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lightprimary px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/10">
          Our Pricing
        </span>
        <h2 className="mt-4 text-2xl font-bold text-dark dark:text-white sm:text-3xl">A Plan For Every Library</h2>
        <p className="mt-3 text-sm text-charcoal dark:text-darklink sm:text-base">
          LibraryJi is billed as a recurring subscription to the software. Start with a free trial, then choose a
          monthly or yearly plan — each plan includes the LibraryJi web panel and mobile apps, the features listed
          below, product updates, and support. Upgrade whenever your library grows. Taxes may apply at checkout.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, i) => {
          const price = Number(plan.price);
          const originalPrice = plan.original_price ? Number(plan.original_price) : null;
          const features = normalizePlanFeatures(plan.features).slice(0, 6);
          const isPopular = !!plan.badge_text;

          return (
            <Reveal key={plan.id} delay={i * 0.06}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 transition-transform ${
                  isPopular
                    ? "border-primary bg-primary text-white shadow-2xl lg:-translate-y-4"
                    : "border-border bg-white shadow-xs dark:border-darkborder dark:bg-darkgray"
                }`}
              >
                {plan.badge_text && (
                  <span className="absolute -top-3 left-6 rounded-full bg-success px-3 py-1 text-[11px] font-semibold text-white">
                    {plan.badge_text}
                  </span>
                )}
                <h3 className={`text-base font-semibold ${isPopular ? "text-white" : "text-dark dark:text-white"}`}>
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className={`mt-1 text-xs ${isPopular ? "text-white/70" : "text-darklink"}`}>{plan.description}</p>
                )}
                <div className="mt-4 flex items-baseline gap-2">
                  {originalPrice && originalPrice > price && (
                    <span className={`text-sm line-through ${isPopular ? "text-white/50" : "text-darklink"}`}>
                      ₹{originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className={`text-3xl font-extrabold ${isPopular ? "text-white" : "text-primary"}`}>
                    {price === 0 ? "Free" : `₹${price.toLocaleString()}`}
                  </span>
                  {price > 0 && (
                    <span className={`text-xs ${isPopular ? "text-white/70" : "text-darklink"}`}>/{plan.billing_cycle}</span>
                  )}
                </div>
                <ul className="mt-5 flex flex-1 flex-col gap-2">
                  {features.map((f) => (
                    <li
                      key={f.text}
                      className={`flex items-start gap-2 text-sm ${isPopular ? "text-white/90" : "text-charcoal dark:text-darklink"}`}
                    >
                      {f.included ? (
                        <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${isPopular ? "text-success" : "text-success"}`} />
                      ) : (
                        <XCircle size={16} className={`mt-0.5 shrink-0 ${isPopular ? "text-white/40" : "text-darklink"}`} />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                    isPopular ? "bg-white text-primary hover:bg-lightprimary" : "bg-primary text-white hover:bg-primaryemphasis"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
