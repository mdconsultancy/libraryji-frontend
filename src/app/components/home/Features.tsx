"use client";

import { Icon } from "@iconify/react";
import Reveal from "./Reveal";

const FEATURES: { icon: string; title: string; description: string }[] = [
  {
    icon: "solar:armchair-2-bold-duotone",
    title: "Seat & Rotation Management",
    description: "Assign fixed or shift-wise rotation seats, see live seat availability, and never double-book a seat.",
  },
  {
    icon: "solar:user-id-bold-duotone",
    title: "Student Enrollment",
    description: "Enroll new and old students in minutes with photo, ID proof, membership plan, and fee — all in one wizard.",
  },
  {
    icon: "solar:calendar-mark-bold-duotone",
    title: "Attendance Tracking",
    description: "Daily check-in/check-out attendance with a monthly calendar view and exportable reports.",
  },
  {
    icon: "solar:wallet-money-bold-duotone",
    title: "Fee & Payment Collection",
    description: "Track dues, partial payments, and renewals automatically, with staff-recorded payments requiring admin approval.",
  },
  {
    icon: "solar:chart-2-bold-duotone",
    title: "Reports & Dashboard",
    description: "Revenue, expiring memberships, attendance, and seat-occupancy reports — downloadable as PDF or Excel.",
  },
  {
    icon: "solar:smartphone-bold-duotone",
    title: "Web + Mobile App",
    description: "Run your library from a browser or the LibraryJi app on Android and iOS — the same data, everywhere.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-dark dark:text-white sm:text-3xl">
          Everything a library management software should do
        </h2>
        <p className="mt-3 text-sm text-charcoal dark:text-darklink sm:text-base">
          One dashboard for seats, students, attendance, fees, and reports.
        </p>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.06}>
            <div className="group h-full rounded-2xl border border-border bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg dark:border-darkborder dark:bg-darkgray">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lightprimary text-primary transition-colors group-hover:bg-primary group-hover:text-white dark:bg-primary/10">
                <Icon icon={f.icon} width={26} height={26} />
              </div>
              <h3 className="text-base font-semibold text-dark dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-charcoal dark:text-darklink">{f.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
