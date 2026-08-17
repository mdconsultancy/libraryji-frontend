"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Same palette members/page.tsx already used for its initials-fallback
// circles, centralized here so every avatar spot (table rows, cards, view
// dialogs) picks colors consistently.
const avatarPalette = [
  "bg-lightsuccess text-success",
  "bg-lightinfo text-info",
  "bg-lightwarning text-warning",
  "bg-lightprimary text-primary",
  "bg-lighterror text-error",
  "bg-lightsecondary text-secondary",
];

function paletteColor(seed: string | number | null | undefined) {
  if (seed == null || seed === "") return avatarPalette[0];
  const n =
    typeof seed === "number"
      ? seed
      : seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarPalette[Math.abs(n) % avatarPalette.length];
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

interface AvatarProps {
  /** Photo URL. `Member.photo_url` is a short-lived signed URL that can
   * occasionally 403/expire — `onError` below catches that and falls back
   * to the initials circle instead of showing a broken-image icon. */
  src?: string | null;
  /** Member/user name, used for the initials fallback and alt text. */
  name?: string | null;
  /** Square size in pixels. */
  size?: number;
  /** Value used to pick a stable palette color for the initials circle
   * (defaults to `name`). Pass the member id for parity with existing
   * per-id color assignment. */
  seed?: string | number | null;
  className?: string;
}

export default function Avatar({ src, name, size = 40, seed, className }: AvatarProps) {
  const [loading, setLoading] = useState(!!src);
  const [failed, setFailed] = useState(false);

  // Reset when the source changes (e.g. row re-rendered with a freshly
  // signed URL for the same member).
  useEffect(() => {
    setLoading(!!src);
    setFailed(false);
  }, [src]);

  const showImage = !!src && !failed;

  if (!showImage) {
    return (
      <div
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        className={cn(
          "rounded-full flex items-center justify-center font-semibold shrink-0",
          paletteColor(seed ?? name),
          className
        )}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn("relative rounded-full overflow-hidden shrink-0", className)}
    >
      <Image
        src={src as string}
        alt={name ?? "Avatar"}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading && (
        <div className="absolute inset-0 rounded-full bg-lightgray dark:bg-darkgray animate-pulse" />
      )}
    </div>
  );
}
