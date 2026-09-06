"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Reveal from "./Reveal";

const ADVANTAGES = [
  "Easy to customize for your library",
  "Fully responsive — works on any device",
  "Free updates, always",
  "Real support when you need it",
];

export default function AppAdvantage() {
  return (
    <section className="bg-lightsuccess/40 dark:bg-success/5">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-success dark:bg-dark">
            App Advantage
          </span>
          <h2 className="mt-4 text-2xl font-bold text-dark dark:text-white sm:text-3xl">
            Gain An Edge With A Purpose-Built App
          </h2>
          <p className="mt-4 text-sm text-charcoal dark:text-darklink sm:text-base">
            LibraryJi isn&apos;t a generic spreadsheet template — it&apos;s built specifically for how libraries and
            study rooms actually run day to day, on your desktop too.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ADVANTAGES.map((a) => (
              <li key={a} className="flex items-center gap-2.5 text-sm font-medium text-dark dark:text-white">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
                  <Icon icon="solar:check-circle-bold" width={14} height={14} />
                </span>
                {a}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-success px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
          >
            <Icon icon="solar:download-minimalistic-bold" width={18} height={18} />
            Start Free
          </Link>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto w-full max-w-lg">
          <Image
            src="/images/home/app-advantage2.png"
            alt="LibraryJi dashboard on a tablet/desktop"
            width={1000}
            height={772}
            className="h-auto w-full drop-shadow-2xl"
          />
        </Reveal>
      </div>
    </section>
  );
}
