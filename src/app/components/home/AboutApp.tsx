"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Reveal from "./Reveal";

const POINTS = ["With modern seat & student management tools", "Works across every device, web, Android and iOS", "Start your 30-day free trial today"];

export default function AboutApp() {
  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal className="relative mx-auto w-full max-w-md">
          <Image
            src="/images/home/about.png"
            alt="Library staff managing their library on the LibraryJi app"
            width={1000}
            height={1073}
            className="h-auto w-full"
          />
          <div className="absolute -bottom-5 -left-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg dark:bg-darkgray">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lightsuccess text-success dark:bg-success/10">
              <Icon icon="solar:shield-check-bold" width={18} height={18} />
            </span>
            <div>
              <p className="text-xs font-semibold text-dark dark:text-white">100% Secure</p>
              <p className="text-[11px] text-darklink">Your data, private to you</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lightprimary px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/10">
            About LibraryJi
          </span>
          <h2 className="mt-4 text-2xl font-bold text-dark dark:text-white sm:text-3xl">
            Designed for the modern, growing library
          </h2>
          <p className="mt-4 text-sm text-charcoal dark:text-darklink sm:text-base">
            LibraryJi replaces registers and spreadsheets with one simple system — built with libraries and study
            rooms across India, from small reading rooms to multi-branch libraries.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-dark dark:text-white">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lightsuccess text-success dark:bg-success/10">
                  <Icon icon="solar:check-circle-bold" width={16} height={16} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primaryemphasis"
          >
            <Icon icon="solar:arrow-right-linear" width={18} height={18} />
            Start Free
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
