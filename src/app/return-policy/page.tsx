import LegalPage, { type LegalBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Return Policy — LibraryJi",
};

const blocks: LegalBlock[] = [
  {
    type: "p",
    text: "LibraryJi is a digital SaaS-based software service. We do not generally sell physical products through the LibraryJi platform.",
  },
  { type: "p", text: "Therefore, physical product returns are not applicable to LibraryJi subscriptions or software services." },

  { type: "h2", text: "1. No Physical Product Returns" },
  { type: "p", text: "LibraryJi subscriptions provide access to digital software and online services." },
  { type: "p", text: "There is no physical product shipped to the customer." },
  { type: "p", text: "Accordingly, customers cannot return a physical product because no physical product is supplied as part of a standard LibraryJi subscription." },

  { type: "h2", text: "2. Digital Service Cancellation" },
  { type: "p", text: "Customers who no longer wish to use LibraryJi may cancel their subscription in accordance with the applicable cancellation terms." },
  { type: "p", text: "Cancellation does not automatically create a refund entitlement." },
  { type: "p", text: "Refund eligibility is governed by the separate Refund & Cancellation Policy." },

  { type: "h2", text: "3. Seven-Day Refund Window" },
  {
    type: "p",
    text: "For eligible paid subscriptions, customers may request a refund within 7 calendar days from the successful payment transaction, subject to the eligibility requirements described in the Refund & Cancellation Policy.",
  },

  { type: "h2", text: "4. Service Issues" },
  { type: "p", text: "If a customer experiences a significant technical issue that prevents normal use of a paid LibraryJi service, the customer should contact support." },
  { type: "p", text: "We may investigate the issue and, where appropriate, provide:" },
  { type: "ul", items: ["Technical assistance", "Service restoration", "Account correction", "Subscription adjustment", "Refund where applicable"] },

  { type: "h2", text: "5. Account Termination" },
  {
    type: "p",
    text: "If an account is terminated because of fraud, abuse, unauthorized access, violation of the Terms & Conditions, or unlawful activity, the customer may not be eligible for a refund except where required by applicable law.",
  },

  { type: "h2", text: "6. Contact for Service or Refund Requests" },
  { type: "ul", items: ["Email: support@libraryji.in", "General Email: libraryji54@gmail.com", "Phone: +91 70697 63365"] },
];

export default function ReturnPolicyPage() {
  return <LegalPage title="Return Policy" lastUpdated="15 August 2026" blocks={blocks} />;
}
