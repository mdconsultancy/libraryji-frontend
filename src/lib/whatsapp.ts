import type { Member } from "@/types";

/** Same number-cleaning rule used everywhere else a wa.me link is built —
 *  prefers the dedicated WhatsApp number, falls back to phone. */
export function whatsappNumber(member: Member): string | undefined {
  const number = (member.whatsapp_number || member.phone || "").replace(/[^\d]/g, "");
  return number || undefined;
}

/**
 * `wa.me` links get handed off to the WhatsApp Desktop app's own URL-scheme
 * handler on Windows, which has a long-standing bug where it decodes the
 * percent-encoded text using the system ANSI codepage instead of UTF-8 —
 * every emoji (and anything else outside ASCII) comes through as "�".
 * `api.whatsapp.com/send` opens WhatsApp Web in the browser instead, which
 * parses the URL as UTF-8 correctly and doesn't hit that bug.
 */
export function whatsappLink(member: Member, message?: string): string | undefined {
  const number = whatsappNumber(member);
  if (!number) return undefined;
  const base = `https://api.whatsapp.com/send?phone=${number}`;
  return message ? `${base}&text=${encodeURIComponent(message)}` : base;
}

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "__";

export interface AdminPaymentInfo {
  upiId?: string | null;
  paymentNumber?: string | null;
}

/**
 * Emoji here are deliberately limited to long-established, universally
 * supported ones (all Unicode 6.0/2010 or older, same vintage as the ✅ 👋
 * ❤️ 📦 examples every platform ships a glyph for). The earlier version of
 * this file used 🪑 (chair) for the seat line, which is a Unicode 12.0
 * (2019) emoji — plenty of devices (older Windows emoji-font caches
 * especially) don't have that glyph yet and render it as "�", which looked
 * identical to the encoding bug but was actually just a missing font glyph.
 * `whatsappLink()` already runs this through `encodeURIComponent`, which is
 * the correct/only encoding step needed — verified it produces correct
 * UTF-8 percent-encoding (e.g. 👋 -> %F0%9F%91%8B).
 */
export function buildAdmissionMessage(member: Member, libraryName: string): string {
  const sub = member.active_subscription;
  const seat = sub?.seat?.seat_number ?? "__";
  const admissionDate = formatDate(member.join_date);
  const validTill = sub?.end_date ? formatDate(sub.end_date) : "__";
  const fees = sub?.amount != null ? Number(sub.amount).toLocaleString("en-IN") : "__";

  return [
    `👋 Hi ${member.name},`,
    `✅ Your admission has been successfully registered with ${libraryName}.`,
    ``,
    `📌 Seat No.: ${seat}`,
    `📅 Admission Date: ${admissionDate}`,
    `📅 Valid Till: ${validTill}`,
    `💰 Fees: ₹${fees}`,
    ``,
    `📚 Thank you for choosing ${libraryName}.`,
    `Study - Focus - Achieve`,
  ].join("\n");
}

export function buildPaymentReminderMessage(
  member: Member,
  libraryName: string,
  daysRemaining: number,
  payment: AdminPaymentInfo
): string {
  return [
    `📚 Reminder - ${libraryName}`,
    ``,
    `👋 Hi ${member.name},`,
    ``,
    `⏳ Your library subscription has ${daysRemaining} days remaining.`,
    `🔄 Renew soon to continue your seat without interruption.`,
    ``,
    `💳 UPI: ${payment.upiId || "__"}`,
    `📱 Payment No.: ${payment.paymentNumber || "__"}`,
    ``,
    `❤️ Thank you!`,
    `${libraryName}`,
    `by libraryji.in`,
  ].join("\n");
}
