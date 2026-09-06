"use client";

import { Icon } from "@iconify/react";
import Reveal from "./Reveal";

// Genuine feature explainers, not dated "blog posts" — LibraryJi doesn't run
// a blog yet, and inventing fake articles/authors/dates would be exactly the
// kind of fabricated content that erodes trust (and Google's guidelines
// frown on). Add a real blog section here once there's real content for it.
const RESOURCES: { icon: string; title: string; description: string }[] = [
  {
    icon: "solar:armchair-2-bold-duotone",
    title: "Never Double-Book A Seat Again",
    description: "See how Regular and Rotation seat categories keep every shift conflict-free, automatically.",
  },
  {
    icon: "solar:user-id-bold-duotone",
    title: "Enroll A Student In Under 2 Minutes",
    description: "Photo, ID proof, plan, and payment — one guided wizard instead of five different forms.",
  },
  {
    icon: "solar:wallet-money-bold-duotone",
    title: "Stop Chasing Pending Fees",
    description: "Automatic dues tracking and expiry alerts mean nothing falls through the cracks at renewal time.",
  },
];

export default function Resources() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lightprimary px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/10">
          See It In Action
        </span>
        <h2 className="mt-4 text-2xl font-bold text-dark dark:text-white sm:text-3xl">What LibraryJi Solves For You</h2>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {RESOURCES.map((r, i) => (
          <Reveal key={r.title} delay={i * 0.08}>
            <div className="h-full rounded-2xl border border-border bg-white p-6 shadow-xs transition-shadow hover:shadow-lg dark:border-darkborder dark:bg-darkgray">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-lightprimary text-primary dark:bg-primary/10">
                <Icon icon={r.icon} width={24} height={24} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-dark dark:text-white sm:text-base">{r.title}</h3>
              <p className="mt-2 text-sm text-charcoal dark:text-darklink">{r.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
