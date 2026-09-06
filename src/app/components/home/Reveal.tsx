"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Fade-and-rise-in-on-scroll wrapper. Purely a visual enhancement — the
 * wrapped content is present in the server-rendered HTML from the start
 * (this only animates opacity/transform client-side), so it never hides
 * anything from search engines or from JS-disabled visitors.
 *
 * Regression fix: this used to gate visibility purely on `whileInView`'s
 * IntersectionObserver firing (`initial={{opacity:0}}` + `viewport={{once:
 * true}}`). On a client-side route transition — e.g. logging in, then
 * logging out, then navigating back to "/" without a full page reload —
 * the observer's very first check can race with layout/paint and never
 * fire, leaving the section stuck at opacity:0 forever ("data" that looks
 * missing but is actually just invisible). A short mount-based fallback
 * timer now forces visibility regardless, so a missed observer callback
 * can never permanently hide a section — the scroll-reveal effect still
 * plays normally whenever the observer *does* fire first.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const fallback = setTimeout(() => setShown(true), 700);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={shown ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setShown(true)}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
