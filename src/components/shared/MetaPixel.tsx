"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useBranding } from "@/context/BrandingContext";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Standard Meta Pixel bootstrap: queue calls until fbevents.js loads, then let it drain the queue. */
function loadPixelScript() {
  if (window.fbq) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

/** Fire a standard/custom Meta Pixel event — a no-op when the pixel is off. */
export function trackMetaEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) window.fbq("track", event, params);
}

/**
 * Loads the Meta (Facebook) Pixel configured in Platform Settings -> Meta
 * and records a PageView on first load and on every client-side route
 * change (the App Router never does a full page load between pages, so the
 * pixel's own automatic PageView would only ever fire once).
 */
export default function MetaPixel() {
  const { metaPixelId } = useBranding();
  const pathname = usePathname();
  const initialisedId = useRef<string | null>(null);

  useEffect(() => {
    if (!metaPixelId) return;

    if (initialisedId.current !== metaPixelId) {
      loadPixelScript();
      window.fbq?.("init", metaPixelId);
      initialisedId.current = metaPixelId;
    }

    window.fbq?.("track", "PageView");
  }, [metaPixelId, pathname]);

  return null;
}
