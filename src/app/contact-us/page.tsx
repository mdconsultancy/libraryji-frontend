import LegalPage, { type LegalBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with LibraryJi for support, sales, or questions about our library management software and study room management system.",
};

const blocks: LegalBlock[] = [
  {
    type: "p",
    text: "LibraryJi is a subscription-based (SaaS) library and study room management software for libraries, reading rooms and self-study centres in India. LibraryJi is operated from India. Use the details below to reach us for sales, onboarding, billing, technical support, or any question about your subscription.",
  },
  {
    type: "p",
    text: "If you have any questions or need assistance, feel free to reach out to us using the contact details below. We are here to help you!",
  },
  { type: "h2", text: "Contact Details" },
  {
    type: "ul",
    items: [
      "WhatsApp: +91 70697 63365",
      "WhatsApp: +91 99829 25680",
      "Call: +91 70697 63365",
      "Call: +91 99829 25680",
      "Support email: support@libraryji.in",
      "General email: libraryji54@gmail.com",
    ],
  },
  { type: "h2", text: "Support" },
  {
    type: "p",
    text: "We aim to respond to support and billing requests as quickly as possible on working days. For the fastest help, message us on WhatsApp using the numbers above.",
  },
  { type: "h2", text: "Billing & Subscriptions" },
  {
    type: "p",
    text: "For questions about plans, invoices, renewals, cancellations, or refunds, email support@libraryji.in with your registered email and payment/transaction ID. Refunds are handled per our Refund & Cancellation Policy.",
  },
  { type: "h2", text: "Data Requests" },
  {
    type: "p",
    text: "To request access to, correction of, or deletion of your personal data, contact us at support@libraryji.in from your registered email address.",
  },
];

export default function ContactUsPage() {
  return <LegalPage title="Contact Us" lastUpdated="15 August 2026" blocks={blocks} />;
}
