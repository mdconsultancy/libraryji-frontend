"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

const AVATAR_COLORS = ["bg-primary", "bg-success", "bg-warning", "bg-error"];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-[#0B3D2E] bg-cover bg-center"
      style={{ backgroundImage: "url(/images/home/home-bg.png)" }}
    >
      {/* Darkens the bg image slightly so white text stays readable over its
          lighter patches, without needing a second flat-color layer. */}
      <div className="pointer-events-none absolute inset-0 bg-[#0B3D2E]/40" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-white/15">
            <Icon icon="solar:star-bold" width={14} height={14} />
            For Libraries, Reading Rooms &amp; Self-Study Centres
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-5xl">
            Library &amp; Study Room Management Software
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg lg:mx-0">
            LibraryJi is a subscription-based (SaaS) library &amp; study room management software for libraries,
            reading rooms and self-study centres across India — seat &amp; shift management, student enrollment,
            attendance, and fee collection, all in one plan. Start free, then a monthly or yearly subscription.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link
              href="/auth/register"
              className="rounded-full bg-success px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:brightness-105"
            >
              Start Free
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {AVATAR_COLORS.map((c, i) => (
                  <span
                    key={i}
                    className={`h-8 w-8 rounded-full border-2 border-[#0B3D2E] ${c} flex items-center justify-center text-[10px] font-bold text-white`}
                  >
                    <Icon icon="solar:user-bold" width={14} height={14} />
                  </span>
                ))}
              </div>
              <span className="text-xs font-medium text-white/70">
                No Card Required <span className="text-white/50">· Cancel Anytime</span>
              </span>
            </div>
          </div>
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/images/home/hero.png"
            alt="LibraryJi dashboard and receipt screens on mobile"
            width={1356}
            height={1159}
            priority
            className="h-auto w-full drop-shadow-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
