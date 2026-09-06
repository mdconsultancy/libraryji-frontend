"use client";

import dynamic from "next/dynamic";

// Three.js needs a real browser/WebGL context, so this must never run during
// server rendering — `ssr: false` is only legal inside a Client Component
// (this file), which is why the scene itself lives in a separate module and
// gets loaded through this thin wrapper instead of being imported directly
// by the (Server Component) Hero section.
const Hero3DScene = dynamic(() => import("./Hero3DScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-3xl bg-lightprimary/60 dark:bg-primary/10" />,
});

export default function Hero3D() {
  return (
    <div className="h-[280px] w-full sm:h-[360px] lg:h-[440px]">
      <Hero3DScene />
    </div>
  );
}
