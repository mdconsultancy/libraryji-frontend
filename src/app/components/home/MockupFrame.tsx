"use client";

import { Icon } from "@iconify/react";

/**
 * Stylized placeholder standing in for a real app/product screenshot —
 * built entirely from CSS (no external image), so it renders correctly
 * before real screenshots exist. Swap the body for a real
 * `<Image src="/images/screenshots/..." />` once you have one; every call
 * site below is set up to drop that straight in without other changes.
 */
export default function MockupFrame({
  tone = "primary",
  className = "",
  rows = 4,
}: {
  tone?: "primary" | "success" | "white";
  className?: string;
  rows?: number;
}) {
  const bar =
    tone === "white"
      ? "bg-white/25"
      : tone === "success"
        ? "bg-success/15"
        : "bg-primary/10";
  const chip = tone === "white" ? "bg-white/90" : tone === "success" ? "bg-success" : "bg-primary";

  return (
    <div
      className={`overflow-hidden rounded-[1.75rem] border ${
        tone === "white" ? "border-white/20 bg-white/10" : "border-border bg-white dark:border-darkborder dark:bg-darkgray"
      } p-4 shadow-xl ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${chip} text-white`}>
          <Icon icon="solar:armchair-2-bold" width={16} height={16} />
        </span>
        <div className="flex-1">
          <div className={`h-2 w-2/3 rounded-full ${bar}`} />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`h-2.5 rounded-full ${bar}`} style={{ width: `${85 - i * 12}%` }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-10 rounded-lg ${bar}`} />
        ))}
      </div>
    </div>
  );
}
