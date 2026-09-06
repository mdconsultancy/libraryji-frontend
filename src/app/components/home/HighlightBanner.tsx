"use client";

import { Icon } from "@iconify/react";
import Reveal from "./Reveal";

// Honest highlights, not made-up customer/download counts — a real number
// goes here the day you have one worth publishing.
const HIGHLIGHTS: { icon: string; title: string; subtitle: string }[] = [
  { icon: "solar:calendar-mark-bold", title: "30-Day", subtitle: "Free Trial" },
  { icon: "solar:cloud-bold", title: "100%", subtitle: "Cloud-Based" },
  { icon: "solar:smartphone-bold", title: "Web + Android + iOS", subtitle: "One Account, Everywhere" },
  { icon: "solar:headphones-round-bold", title: "Real", subtitle: "Human Support" },
];

export default function HighlightBanner() {
  return (
    <section
      className="relative bg-[#0B3D2E] bg-cover bg-center"
      style={{ backgroundImage: "url(/images/home/home-bg.png)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#0B3D2E]/50" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="flex flex-col items-center gap-2 text-center">
              <Icon icon={h.icon} width={26} height={26} className="text-success" />
              <span className="text-xl font-extrabold text-white sm:text-2xl">{h.title}</span>
              <span className="text-xs text-white/60 sm:text-sm">{h.subtitle}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
