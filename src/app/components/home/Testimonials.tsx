"use client";

import { Icon } from "@iconify/react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Reveal from "./Reveal";

// Deliberately not attributed to named people/libraries — these are genuine
// product value-props, not fabricated customer quotes. Google's guidelines
// treat fake reviews/testimonials as spam, and passing off invented quotes
// as real customer feedback would be dishonest regardless. Swap this array
// for real, attributed testimonials (name + library, with their permission)
// as soon as you have them.
const HIGHLIGHTS: { icon: string; title: string; text: string }[] = [
  {
    icon: "solar:clock-circle-bold-duotone",
    title: "Save hours every week",
    text: "No more manual attendance registers or fee ledgers — enrollment, attendance, and payments are tracked automatically.",
  },
  {
    icon: "solar:armchair-2-bold-duotone",
    title: "Never double-book a seat",
    text: "Live seat status across Regular and Rotation categories means staff always see what's actually free.",
  },
  {
    icon: "solar:graph-up-bold-duotone",
    title: "See your revenue clearly",
    text: "Daily and monthly revenue, pending fees, and expiring memberships — all in one dashboard, no spreadsheets.",
  },
  {
    icon: "solar:phone-bold-duotone",
    title: "Manage from anywhere",
    text: "The same data on the web panel and the mobile app — check on your library from home or the front desk.",
  },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-dark dark:text-white sm:text-3xl">Why libraries choose LibraryJi</h2>
        <p className="mt-3 text-sm text-charcoal dark:text-darklink sm:text-base">
          Built around what actually slows a library down day-to-day.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <Carousel opts={{ align: "start", loop: true }} className="mx-auto w-full max-w-5xl">
          <CarouselContent>
            {HIGHLIGHTS.map((h) => (
              <CarouselItem key={h.title} className="sm:basis-1/2 lg:basis-1/3">
                <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-xs dark:border-darkborder dark:bg-darkgray">
                  <Icon icon={h.icon} width={28} height={28} className="text-primary" />
                  <h3 className="mt-4 text-sm font-semibold text-dark dark:text-white">{h.title}</h3>
                  <p className="mt-2 text-sm text-charcoal dark:text-darklink">{h.text}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex justify-center gap-3">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </Reveal>
    </section>
  );
}
