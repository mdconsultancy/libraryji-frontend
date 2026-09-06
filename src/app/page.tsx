import type { Metadata } from "next";
import HomeAuthRedirect from "@/app/components/home/HomeAuthRedirect";
import SiteHeader from "@/app/components/home/SiteHeader";
import Hero from "@/app/components/home/Hero";
import AboutApp from "@/app/components/home/AboutApp";
import HowItWorks from "@/app/components/home/HowItWorks";
import Features from "@/app/components/home/Features";
import AppAdvantage from "@/app/components/home/AppAdvantage";
import WhyChoose from "@/app/components/home/WhyChoose";
import HighlightBanner from "@/app/components/home/HighlightBanner";
import Testimonials from "@/app/components/home/Testimonials";
import Faq, { FAQS } from "@/app/components/home/Faq";
import Pricing from "@/app/components/home/Pricing";
import AppDownloadCta from "@/app/components/home/AppDownloadCta";
import Resources from "@/app/components/home/Resources";
import SiteFooter from "@/app/components/home/SiteFooter";

export const metadata: Metadata = {
  title: "Library Management System & Study Room Software (SaaS)",
  description:
    "LibraryJi is a complete library management system and study room / reading room management software for libraries across India. Manage seats, student enrollment, attendance, fee collection, and reports online — free trial, no card required.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-dark">
      <HomeAuthRedirect />

      {/* JSON-LD FAQ rich-result eligibility — the same Q&A also renders as
          visible page content in <Faq/> below, never hidden/duplicate content. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        }}
      />

      <SiteHeader />
      <Hero />
      <AboutApp />
      <HowItWorks />
      <Features />
      <AppAdvantage />
      <WhyChoose />
      <HighlightBanner />
      <Testimonials />
      <Faq />
      <Pricing />
      <AppDownloadCta />
      <Resources />
      <SiteFooter />
    </div>
  );
}
