import Link from "next/link";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";

const NAV_LINKS = [
  { href: "#about", label: "About Us" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/80 backdrop-blur-md dark:border-darkborder dark:bg-dark/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <FullLogo />
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-link hover:text-primary dark:text-darklink"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/login" className="hidden text-sm font-medium text-link hover:text-primary dark:text-darklink sm:inline">
            Login
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-105"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}
