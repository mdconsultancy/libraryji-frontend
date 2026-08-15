import Link from 'next/link';

export default function PolicyLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-darklink mt-2">
      <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
      <span>&middot;</span>
      <Link href="/terms-conditions" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link>
      <span>&middot;</span>
      <Link href="/refund-cancellation-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
      <span>&middot;</span>
      <Link href="/return-policy" className="hover:text-primary transition-colors">Return Policy</Link>
      <span>&middot;</span>
      <Link href="/contact-us" className="hover:text-primary transition-colors">Contact Us</Link>
    </div>
  );
}
