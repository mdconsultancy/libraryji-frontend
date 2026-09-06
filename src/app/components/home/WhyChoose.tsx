"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import Reveal from "./Reveal";

const REASONS: { icon: string; tone: string; title: string; description: string }[] = [
  {
    icon: "solar:widget-5-bold-duotone",
    tone: "bg-lightprimary text-primary dark:bg-primary/10",
    title: "Seats & Rotation, Handled Right",
    description: "Fixed seats or shift-wise rotation seats — live status, no double-booking, ever.",
  },
  {
    icon: "solar:smile-circle-bold-duotone",
    tone: "bg-lightsuccess text-success dark:bg-success/10",
    title: "Built For Your Staff, Not Just You",
    description: "A friendly, simple interface your front-desk staff can pick up in minutes — no training manual needed.",
  },
  {
    icon: "solar:bolt-bold-duotone",
    tone: "bg-lightwarning text-warning dark:bg-warning/10",
    title: "Fast & Reliable",
    description: "Enroll a student, mark attendance, or record a payment in seconds — every screen is built for speed.",
  },
];

export default function WhyChoose() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal className="relative mx-auto w-full max-w-sm order-2 lg:order-1">
          <Image
            src="/images/home/app-advantage.png"
            alt="LibraryJi dashboard, seat map, and menu on mobile"
            width={1100}
            height={949}
            className="h-auto w-full drop-shadow-2xl"
          />
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lightprimary px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/10">
            Why Choose LibraryJi
          </span>
          <h2 className="mt-4 text-2xl font-bold text-dark dark:text-white sm:text-3xl">
            The Right Choice For Your Library
          </h2>
          <div className="mt-8 flex flex-col gap-6">
            {REASONS.map((r) => (
              <div key={r.title} className="flex items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r.tone}`}>
                  <Icon icon={r.icon} width={22} height={22} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-dark dark:text-white sm:text-base">{r.title}</h3>
                  <p className="mt-1 text-sm text-charcoal dark:text-darklink">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
