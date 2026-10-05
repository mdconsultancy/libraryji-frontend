"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, hasSessionHint, refreshTokens } from "@/lib/api";

/**
 * The marketing homepage below is a real Server Component so search engines
 * get full HTML immediately — but a visitor who's already logged in
 * shouldn't be shown a sales pitch, they should land straight on their
 * dashboard. This runs client-side, after the marketing HTML has already
 * painted, and silently redirects only if a token is actually present —
 * anonymous visitors (the ones Google indexes) never see any flash/redirect.
 */
export default function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
      return;
    }
    // Restore a cookie-backed session (the refresh token is HttpOnly, so
    // the only way to know it's still valid is to try it).
    if (hasSessionHint()) {
      refreshTokens().then((tokens) => {
        if (tokens) router.replace("/dashboard");
      });
    }
  }, [router]);

  return null;
}
