"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBranding } from "@/context/BrandingContext";

/**
 * Single logo, everywhere. Sourced from Admin Settings -> Theme (BrandingContext,
 * fetched from the public /theme endpoint) — falls back to the bundled static
 * logo (public/images/logos/logo.jpeg) whenever nothing has been uploaded yet,
 * while branding is still loading, or if the uploaded logo URL fails to load.
 * Do not hardcode a different logo per panel; every sidebar/header (Super
 * Admin, Admin, Staff) renders through this one component.
 */
const FullLogo = () => {
  const { logoUrl, siteName, isLoading } = useBranding();
  const [dynamicFailed, setDynamicFailed] = useState(false);

  const showDynamic = !isLoading && !!logoUrl && !dynamicFailed;

  if (showDynamic) {
    return (
      <Link href={"/"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded asset, arbitrary remote-ish path/dimensions, unlike the static bundled logo below */}
        <img
          src={logoUrl}
          alt={siteName}
          height={40}
          className="h-10 w-auto max-w-40 object-contain"
          onError={() => setDynamicFailed(true)}
        />
      </Link>
    );
  }

  // Static bundled logo: shown while branding is still loading, when nothing
  // has been uploaded, and as the fallback if the uploaded logo fails to load.
  return (
    <Link href={"/"}>
      <Image
        src="/images/logos/logo.jpeg"
        alt={siteName}
        width={135}
        height={40}
        className="h-10 w-auto max-w-40 object-contain"
        priority
      />
    </Link>
  );
};

export default FullLogo;
