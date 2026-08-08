"use client";

import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr";
import type { ReactNode } from "react";

// swrConfig contains a function (the fetcher), which can't be passed as a prop
// from a Server Component across the client boundary — this wrapper is itself
// a Client Component, so it builds the config on the client instead.
export default function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
