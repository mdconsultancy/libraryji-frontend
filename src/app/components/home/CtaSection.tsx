import Link from "next/link";
import Reveal from "./Reveal";

export default function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-2xl font-bold text-white sm:text-3xl">Ready to digitize your library?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            Start your free trial today — no credit card required.
          </p>
          <Link
            href="/auth/register"
            className="relative mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5 hover:bg-lightprimary"
          >
            Start Free
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
