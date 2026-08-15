import LegalPage, { type LegalBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Contact Us — LibraryJi",
};

const blocks: LegalBlock[] = [
  {
    type: "p",
    text: "If you have any questions or need assistance, feel free to reach out to us using the contact details below. We are here to help you!",
  },
  { type: "h2", text: "Need Help?" },
  {
    type: "ul",
    items: [
      "WhatsApp: +91 70697 63365",
      "WhatsApp: +91 99829 25680",
      "Call: +91 70697 63365",
      "Call: +91 99829 25680",
      "Email: support@libraryji.in",
      "Email: libraryji54@gmail.com",
    ],
  },
];

export default function ContactUsPage() {
  return <LegalPage title="Contact Us" lastUpdated="15 August 2026" blocks={blocks} />;
}
