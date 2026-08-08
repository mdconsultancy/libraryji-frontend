"use client";

import Image from "next/image";

/**
 * Full-screen brand preloader shown only while the app bootstraps for the
 * first time (auth check + initial data). Once that settles, SWR's cache
 * keeps data available instantly on every later navigation, so this should
 * never reappear during normal use.
 */
export default function GlobalPreloader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      <Image
        src="/images/logos/dark-logo.svg"
        alt="Loading"
        width={140}
        height={42}
        priority
        className="dark:invert-0 animate-pulse"
      />
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-link dark:text-darklink">Loading your workspace…</p>
    </div>
  );
}
