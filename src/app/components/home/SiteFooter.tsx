"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

const USEFUL_LINKS = [
  { href: "#about", label: "About Us" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

// TODO: once the Android/iOS apps are actually published, point these at
// the real Play Store / App Store listing URLs.
const APP_STORE_URL = "/auth/register";
const PLAY_STORE_URL = "/auth/register";

const HELP_LINKS = [
  { href: "/contact-us", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/refund-cancellation-policy", label: "Refund & Cancellation" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#0B3D2E]">
      {/* Talk-to-us strip, in place of a newsletter form that has nowhere to
          actually submit to yet — a working CTA beats a fake input box. */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <h3 className="text-lg font-bold text-white">Ready to get started?</h3>
            <p className="mt-1 text-sm text-white/60">Talk to our team, or jump straight into a free trial.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact-us"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact Us
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-success px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-105"
            >
              Start Free
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Image src="/images/logos/footer-logo.png" alt="LibraryJi" width={500} height={500} className="h-12 w-auto" />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              Library management system &amp; study room management software for libraries across India.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {[
                { icon: "mdi:instagram", href: "#" },
                { icon: "mdi:facebook", href: "#" },
                { icon: "mdi:twitter", href: "#" },
                { icon: "mdi:linkedin", href: "#" },
              ].map((s) => (
                <a
                  key={s.icon}
                  href={s.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-success hover:text-[#0B3D2E]"
                >
                  <Icon icon={s.icon} width={18} height={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Useful Links</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {USEFUL_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-white/60 hover:text-success">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Help &amp; Support</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {HELP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/60 hover:text-success">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-sm font-semibold text-white">Get The App</h4>
            <div className="mt-4 flex flex-row flex-wrap gap-3 lg:flex-col">
              <a href={PLAY_STORE_URL} className="w-fit transition-opacity hover:opacity-80">
                <Image
                  src="/images/logos/footer-playstore-.png"
                  alt="Get it on Google Play"
                  width={480}
                  height={172}
                  className="h-11 w-auto"
                />
              </a>
              <a href={APP_STORE_URL} className="w-fit transition-opacity hover:opacity-80">
                <Image
                  src="/images/logos/ios.png"
                  alt="Download on the App Store"
                  width={480}
                  height={172}
                  className="h-11 w-auto"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-1.5 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/50">© {new Date().getFullYear()} LibraryJi. All rights reserved.</p>
          <p className="text-xs text-white/50">
            Design and Developed by{" "}
            <a
              href="https://hinguland.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 underline decoration-white/30 hover:text-success"
            >
              Hinguland
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
