"use client";

/**
 * Full-screen preloader shown only while the app bootstraps for the first
 * time (auth check + initial data). Once that settles, SWR's cache keeps
 * data available instantly on every later navigation, so this should never
 * reappear during normal use. Deliberately brand-agnostic (no logo) — just
 * an animated spinner, so it never looks stale against custom branding.
 */
export default function GlobalPreloader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin" />
        <span className="absolute inset-3.5 rounded-full bg-primary/20 animate-ping" />
        <span className="absolute inset-3.5 rounded-full bg-primary" />
      </div>
      <p className="text-sm text-link dark:text-darklink">Loading your workspace…</p>
    </div>
  );
}
