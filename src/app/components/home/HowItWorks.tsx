"use client";

import { Icon } from "@iconify/react";
import Reveal from "./Reveal";

const STEPS: { step: string; icon: string; title: string; description: string }[] = [
  {
    step: "Step One",
    icon: "solar:user-plus-bold-duotone",
    title: "Create Your Account",
    description: "Sign up in under a minute — no card required, and you're free to explore right away.",
  },
  {
    step: "Step Two",
    icon: "solar:widget-add-bold-duotone",
    title: "Set Up Your Library",
    description: "Add your halls, seats, and membership plans — LibraryJi guides you through onboarding step by step.",
  },
  {
    step: "Step Three",
    icon: "solar:rocket-2-bold-duotone",
    title: "Start Managing & Enjoy",
    description: "Enroll students, track attendance and fees, and watch your library run itself.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lightprimary px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/10">
          How It Works
        </span>
        <h2 className="mt-4 text-2xl font-bold text-dark dark:text-white sm:text-3xl">Get Started In 3 Easy Steps</h2>
      </Reveal>

      <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
        {/* Connecting line, desktop only */}
        <div className="pointer-events-none absolute left-0 right-0 top-8 hidden border-t-2 border-dashed border-border sm:block dark:border-darkborder" />
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1} className="relative flex flex-col items-center text-center">
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary shadow-lg ring-4 ring-lightprimary dark:bg-darkgray dark:ring-primary/10">
              <Icon icon={s.icon} width={30} height={30} />
            </div>
            <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">{s.step}</span>
            <h3 className="mt-1 text-base font-semibold text-dark dark:text-white">{s.title}</h3>
            <p className="mt-2 max-w-xs text-sm text-charcoal dark:text-darklink">{s.description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
