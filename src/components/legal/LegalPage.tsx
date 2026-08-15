import Link from "next/link";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";

export type LegalBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

const LEGAL_PAGES = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
  { href: "/refund-cancellation-policy", label: "Refund & Cancellation Policy" },
  { href: "/return-policy", label: "Return Policy" },
];

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "h2") {
    return <h2 className="mt-8 mb-3 text-lg font-bold text-dark dark:text-white first:mt-0">{block.text}</h2>;
  }
  if (block.type === "ul") {
    return (
      <ul className="mb-4 ms-5 list-disc space-y-1.5 text-sm text-charcoal dark:text-white/80">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p className="mb-4 text-sm leading-relaxed text-charcoal dark:text-white/80">{block.text}</p>;
}

export default function LegalPage({
  title,
  lastUpdated,
  blocks,
}: {
  title: string;
  lastUpdated: string;
  blocks: LegalBlock[];
}) {
  return (
    <div className="min-h-screen bg-lightgray dark:bg-dark">
      <header className="border-b border-border bg-white dark:border-darkborder dark:bg-darkgray">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <FullLogo />
          </Link>
          <Link href="/auth/login" className="text-sm font-semibold text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-xs dark:bg-darkgray sm:p-10">
          <h1 className="text-2xl font-extrabold text-dark dark:text-white">{title}</h1>
          <p className="mt-1 mb-8 text-xs text-darklink">Last Updated: {lastUpdated}</p>

          {blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>

        <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
          {LEGAL_PAGES.map((p) => (
            <Link key={p.href} href={p.href} className="text-darklink hover:text-primary hover:underline">
              {p.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
