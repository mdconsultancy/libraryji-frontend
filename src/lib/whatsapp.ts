import type { Member, WhatsAppLanguage } from "@/types";

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

// Always emitted in this fixed order regardless of the order the admin
// picked the checkboxes in, so the combined message reads English first,
// then Hindi, then Gujarati.
export const WHATSAPP_LANGUAGE_ORDER: WhatsAppLanguage[] = ["en", "hi", "gu"];

export const WHATSAPP_LANGUAGE_LABELS: Record<WhatsAppLanguage, string> = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
};

/** Normalizes a possibly-empty/unset selection down to at least English, so a message always goes out. */
export function normalizeWhatsAppLanguages(languages: WhatsAppLanguage[] | null | undefined): WhatsAppLanguage[] {
  const selected = WHATSAPP_LANGUAGE_ORDER.filter((l) => languages?.includes(l));
  return selected.length > 0 ? selected : ["en"];
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
function admissionMessageIn(language: WhatsAppLanguage, member: Member, libraryName: string): string {
  const seat = member.active_subscription?.seat?.seat_number ?? "__";
  const admissionDate = formatDate(member.join_date);
  const validTill = member.active_subscription?.end_date ? formatDate(member.active_subscription.end_date) : "__";
  const fees = member.active_subscription?.amount != null ? Number(member.active_subscription.amount).toLocaleString("en-IN") : "__";

  if (language === "hi") {
    return [
      `👋 नमस्ते ${member.name},`,
      `✅ ${libraryName} में आपका एडमिशन सफलतापूर्वक रजिस्टर हो गया है।`,
      ``,
      `📌 सीट नंबर: ${seat}`,
      `📅 एडमिशन तारीख: ${admissionDate}`,
      `📅 वैध तारीख: ${validTill}`,
      `💰 फीस: ₹${fees}`,
      ``,
      `📚 ${libraryName} चुनने के लिए धन्यवाद।`,
      `पढ़ाई - फोकस - सफलता`,
    ].join("\n");
  }

  if (language === "gu") {
    return [
      `👋 નમસ્તે ${member.name},`,
      `✅ ${libraryName} માં તમારું એડમિશન સફળતાપૂર્વક રજીસ્ટર થયું છે.`,
      ``,
      `📌 સીટ નંબર: ${seat}`,
      `📅 એડમિશન તારીખ: ${admissionDate}`,
      `📅 માન્યતા તારીખ: ${validTill}`,
      `💰 ફી: ₹${fees}`,
      ``,
      `📚 ${libraryName} પસંદ કરવા બદલ આભાર.`,
    ].join("\n");
  }

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

function paymentReminderMessageIn(
  language: WhatsAppLanguage,
  member: Member,
  libraryName: string,
  daysRemaining: number,
  payment: AdminPaymentInfo
): string {
  const upiId = payment.upiId || "__";
  const paymentNumber = payment.paymentNumber || "__";

  if (language === "hi") {
    return [
      `📚 रिमाइंडर - ${libraryName}`,
      ``,
      `👋 नमस्ते ${member.name},`,
      ``,
      `⏳ आपकी लाइब्रेरी सदस्यता में ${daysRemaining} दिन शेष हैं।`,
      `🔄 अपनी सीट बिना रुकावट जारी रखने के लिए जल्द रिन्यू करें।`,
      ``,
      `💳 UPI: ${upiId}`,
      `📱 पेमेंट नंबर: ${paymentNumber}`,
      ``,
      `❤️ धन्यवाद!`,
      `${libraryName}`,
      `by libraryji.in`,
    ].join("\n");
  }

  if (language === "gu") {
    return [
      `📚 રિમાઇન્ડર – ${libraryName}`,
      ``,
      `👋 નમસ્તે ${member.name},`,
      ``,
      `⏳ તમારી લાઇબ્રેરી સબસ્ક્રિપ્શનમાં ${daysRemaining} દિવસ બાકી છે.`,
      ``,
      `🔄 અભ્યાસમાં કોઈ વિરામ ન આવે તે માટે સમયસર તમારી Membership Renew કરો.`,
      ``,
      `💳 UPI: ${upiId}`,
      `📱 Payment Number: ${paymentNumber}`,
      ``,
      `❤️ આભાર!`,
      `${libraryName}`,
      `by libraryji.in`,
    ].join("\n");
  }

  return [
    `📚 Reminder - ${libraryName}`,
    ``,
    `👋 Hi ${member.name},`,
    ``,
    `⏳ Your library subscription has ${daysRemaining} days remaining.`,
    `🔄 Renew soon to continue your seat without interruption.`,
    ``,
    `💳 UPI: ${upiId}`,
    `📱 Payment No.: ${paymentNumber}`,
    ``,
    `❤️ Thank you!`,
    `${libraryName}`,
    `by libraryji.in`,
  ].join("\n");
}

const LANGUAGE_DIVIDER = "\n\n〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n\n";

/** Builds the admission-welcome message once per selected language (English/Hindi/Gujarati, always in that order) and joins them into a single WhatsApp message. */
export function buildAdmissionMessage(member: Member, libraryName: string, languages?: WhatsAppLanguage[] | null): string {
  return normalizeWhatsAppLanguages(languages)
    .map((lang) => admissionMessageIn(lang, member, libraryName))
    .join(LANGUAGE_DIVIDER);
}

/** Builds the fee-reminder message once per selected language (English/Hindi/Gujarati, always in that order) and joins them into a single WhatsApp message. */
export function buildPaymentReminderMessage(
  member: Member,
  libraryName: string,
  daysRemaining: number,
  payment: AdminPaymentInfo,
  languages?: WhatsAppLanguage[] | null
): string {
  return normalizeWhatsAppLanguages(languages)
    .map((lang) => paymentReminderMessageIn(lang, member, libraryName, daysRemaining, payment))
    .join(LANGUAGE_DIVIDER);
}
