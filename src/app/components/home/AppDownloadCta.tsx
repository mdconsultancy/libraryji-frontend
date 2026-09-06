"use client";

import { Icon } from "@iconify/react";
import Reveal from "./Reveal";
import MockupFrame from "./MockupFrame";

// TODO: once the Android/iOS apps are actually published, point these at
// the real Play Store / App Store listing URLs.
const PLAY_STORE_URL = "/auth/register";
const APP_STORE_URL = "/auth/register";

export default function AppDownloadCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
      <Reveal>
        <div
          className="relative grid grid-cols-1 items-center gap-10 overflow-hidden rounded-3xl bg-[#0B3D2E] bg-cover bg-center px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-2"
          style={{ backgroundImage: "url(/images/home/home-bg.png)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[#0B3D2E]/40" />
          <div className="relative text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Run Your Library From Your Phone Too</h2>
            <p className="mt-3 max-w-md text-sm text-white/70 sm:text-base">
              The LibraryJi app on Android and iOS mirrors the web panel — seats, students, attendance, and fees, wherever you are.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a
                href={PLAY_STORE_URL}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-dark transition-transform hover:-translate-y-0.5"
              >
                <Icon icon="solar:smartphone-bold" width={20} height={20} className="text-success" />
                Android
              </a>
              <a
                href={APP_STORE_URL}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-dark transition-transform hover:-translate-y-0.5"
              >
                <Icon icon="ic:baseline-apple" width={20} height={20} />
                iOS
              </a>
            </div>
          </div>
          <Reveal delay={0.1} className="relative mx-auto w-full max-w-xs">
            <MockupFrame tone="white" className="rotate-[-4deg]" rows={3} />
          </Reveal>
        </div>
      </Reveal>
    </section>
  );
}
