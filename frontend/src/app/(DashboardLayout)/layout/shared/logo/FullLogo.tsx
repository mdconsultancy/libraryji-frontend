"use client";

import Image from "next/image";
import Link from "next/link";
import { useBranding } from "@/context/BrandingContext";

/**
 * Single logo, everywhere. Sourced from Admin Settings -> Theme (BrandingContext,
 * fetched from the public /theme endpoint) — falls back to the bundled static
 * logo only when nothing has been uploaded yet. Do not hardcode a different
 * logo per panel; every sidebar/header (Super Admin, Admin, Staff) renders
 * through this one component.
 */
const FullLogo = () => {
  const { logoUrl, siteName } = useBranding();

  if (logoUrl) {
    return (
      <Link href={"/"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded asset, arbitrary remote-ish path/dimensions, unlike the static bundled logo below */}
        <img src={logoUrl} alt={siteName} height={40} className="h-10 w-auto max-w-40 object-contain" />
      </Link>
    );
  }

  return (
    <Link href={"/"}>
      {/* Dark Logo */}
      <Image
        src="/images/logos/dark-logo.svg"
        alt={siteName}
        width={135}
        height={40}
        className="block dark:hidden rtl:scale-x-[-1]"
      />
      {/* Light Logo */}
      <Image
        src="/images/logos/dark-logo.svg"
        alt={siteName}
        width={135}
        height={40}
        className="hidden dark:block rtl:scale-x-[-1]"
      />
    </Link>
  );
};

export default FullLogo;
