"use client";

import { useEffect, useState } from "react";

/** Matches the same `xl` breakpoint (1280px) the rest of the app already
 *  uses to switch between the desktop table layout and the mobile card-list
 *  layout (e.g. members/page.tsx's `hidden xl:block` / `xl:hidden` pairs) —
 *  so "mobile" here means the same thing it does everywhere else in the UI. */
const MOBILE_QUERY = "(max-width: 1279px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
