import LegalPage, { type LegalBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms & Conditions — LibraryJi",
};

const blocks: LegalBlock[] = [
  {
    type: "p",
    text: 'These Terms & Conditions ("Terms") govern your access to and use of the LibraryJi platform, website, mobile application, software, and related services ("Service").',
  },
  {
    type: "p",
    text: "By registering for an account, starting a free trial, purchasing a subscription, or using LibraryJi, you agree to these Terms.",
  },
  { type: "p", text: "If you do not agree with these Terms, you should not use the Service." },

  { type: "h2", text: "1. About LibraryJi" },
  { type: "p", text: "LibraryJi is a SaaS-based library management platform designed to help libraries and organizations manage their operations digitally." },
  { type: "p", text: "Features may include:" },
  {
    type: "ul",
    items: [
      "Library management",
      "Student/member management",
      "Book management",
      "Book issue and return management",
      "Fine management",
      "Records and reports",
      "Staff/user management",
      "Subscription management",
      "Dashboard and analytics",
      "Other features introduced by LibraryJi from time to time",
    ],
  },
  { type: "p", text: "Features may vary depending on the subscription plan selected." },

  { type: "h2", text: "2. Account Registration" },
  { type: "p", text: "To use LibraryJi, you may be required to create an account." },
  { type: "p", text: "You agree to:" },
  {
    type: "ul",
    items: [
      "Provide accurate information",
      "Keep account information updated",
      "Maintain the confidentiality of your login credentials",
      "Prevent unauthorized access",
      "Immediately notify LibraryJi of suspected unauthorized access",
    ],
  },
  {
    type: "p",
    text: "You are responsible for all activity performed through your account unless caused by a security failure attributable to LibraryJi.",
  },

  { type: "h2", text: "3. Free Trial" },
  { type: "p", text: "LibraryJi may provide a 30-day free trial for eligible new accounts." },
  { type: "p", text: "The trial period begins from the date the trial account is activated." },
  { type: "p", text: "During the trial:" },
  {
    type: "ul",
    items: [
      "Eligible features may be available without payment",
      "Trial access may be subject to plan limitations",
      "LibraryJi may modify or discontinue trial availability",
      "One organization may not create multiple accounts solely to repeatedly obtain free trials",
    ],
  },
  { type: "p", text: "After the trial period ends, the account may require a paid subscription to continue accessing paid features." },

  { type: "h2", text: "4. Paid Subscription" },
  { type: "p", text: "After the free trial, users may select an available paid subscription plan." },
  { type: "p", text: "The applicable:" },
  { type: "ul", items: ["Plan", "Price", "Billing frequency", "Features", "Taxes, if applicable"] },
  { type: "p", text: "will be displayed at the time of purchase." },
  { type: "p", text: "A subscription becomes active after successful payment confirmation." },

  { type: "h2", text: "5. Contract / Subscription Period" },
  { type: "p", text: "The subscription contract period will correspond to the billing period selected by the customer, such as:" },
  { type: "ul", items: ["Monthly subscription — one month", "Annual subscription — twelve months"] },
  { type: "p", text: "The subscription starts from the date the paid plan becomes active or from the date specified during purchase." },
  { type: "p", text: "Unless otherwise stated on the applicable plan, subscriptions do not create a permanent or lifetime license." },

  { type: "h2", text: "6. Renewal" },
  {
    type: "p",
    text: "If automatic renewal is enabled for a subscription, the subscription may renew for another applicable billing period unless cancelled before the renewal date.",
  },
  { type: "p", text: "LibraryJi may provide renewal notifications where required or appropriate." },
  { type: "p", text: "If payment for renewal fails, LibraryJi may restrict or suspend paid features until the payment issue is resolved." },

  { type: "h2", text: "7. Cancellation" },
  { type: "p", text: "Users may request cancellation of their subscription." },
  { type: "p", text: "Cancellation generally stops future renewals." },
  {
    type: "p",
    text: "Unless otherwise provided by the applicable refund policy, cancellation does not automatically entitle the customer to a refund for the current billing period.",
  },

  { type: "h2", text: "8. Refunds" },
  { type: "p", text: "Refund requests are governed by the separate Refund & Cancellation Policy published by LibraryJi." },
  { type: "p", text: "The refund policy forms part of these Terms." },

  { type: "h2", text: "9. User Content and Library Data" },
  { type: "p", text: "You retain responsibility for the information and content you enter into LibraryJi." },
  { type: "p", text: "This may include:" },
  {
    type: "ul",
    items: [
      "Student records",
      "Member records",
      "Book records",
      "Transaction information",
      "Staff information",
      "Notes",
      "Reports",
      "Other library-related data",
    ],
  },
  {
    type: "p",
    text: "You grant LibraryJi the limited right to process such information solely as reasonably necessary to provide, secure, maintain, and improve the Service and fulfil our contractual obligations.",
  },

  { type: "h2", text: "10. Prohibited Activities" },
  { type: "p", text: "You must not:" },
  {
    type: "ul",
    items: [
      "Use LibraryJi for unlawful activities",
      "Attempt unauthorized access",
      "Reverse engineer the platform",
      "Copy or redistribute the software",
      "Circumvent subscription restrictions",
      "Upload malicious software",
      "Interfere with platform infrastructure",
      "Abuse API or system resources",
      "Use another person's account without authorization",
      "Attempt to access another organization's data",
      "Use LibraryJi to violate privacy or other applicable laws",
    ],
  },

  { type: "h2", text: "11. Intellectual Property" },
  {
    type: "p",
    text: "LibraryJi's software, interface, design, branding, source code, features, documentation, and other proprietary materials are owned by or licensed to LibraryJi unless otherwise stated.",
  },
  { type: "p", text: "Your subscription gives you a limited, non-exclusive, non-transferable right to use the Service during your active subscription period." },
  { type: "p", text: "It does not transfer ownership of the software to you." },

  { type: "h2", text: "12. Service Availability" },
  { type: "p", text: "We aim to provide reliable and continuous service." },
  { type: "p", text: "However, temporary interruptions may occur because of:" },
  {
    type: "ul",
    items: [
      "Maintenance",
      "Security updates",
      "Infrastructure failures",
      "Internet/network issues",
      "Third-party service failures",
      "Force majeure events",
      "Other circumstances beyond our reasonable control",
    ],
  },
  { type: "p", text: "LibraryJi does not guarantee uninterrupted or error-free operation at all times." },

  { type: "h2", text: "13. Account Suspension or Termination" },
  { type: "p", text: "LibraryJi may suspend or terminate an account if:" },
  {
    type: "ul",
    items: [
      "These Terms are violated",
      "Payment obligations remain unpaid",
      "The account is involved in fraudulent activity",
      "The platform is being abused",
      "Security risks are identified",
      "Required by law or governmental authority",
    ],
  },
  { type: "p", text: "Where reasonably possible, we may provide notice before suspension or termination." },

  { type: "h2", text: "14. Data After Termination" },
  { type: "p", text: "After subscription termination, access to paid features may be restricted." },
  {
    type: "p",
    text: "Data retention, deletion, export, and restoration may be subject to LibraryJi's technical capabilities, applicable plan, applicable law, and our Privacy Policy.",
  },
  { type: "p", text: "Users should maintain appropriate backups of important information." },

  { type: "h2", text: "15. Limitation of Liability" },
  {
    type: "p",
    text: "To the maximum extent permitted by applicable law, LibraryJi will not be responsible for indirect, incidental, special, consequential, or loss-of-profit damages arising from use or inability to use the Service.",
  },
  {
    type: "p",
    text: "LibraryJi's aggregate liability arising from a paid subscription will, to the extent legally permissible, be limited to the amount actually paid by the customer to LibraryJi for the applicable subscription period giving rise to the claim.",
  },
  { type: "p", text: "Nothing in these Terms excludes liability that cannot legally be excluded." },

  { type: "h2", text: "16. Changes to the Service" },
  { type: "p", text: "LibraryJi may add, modify, remove, or update features from time to time." },
  { type: "p", text: "We may also introduce new plans, modify pricing, or discontinue features, subject to applicable law and reasonable notice where required." },

  { type: "h2", text: "17. Changes to Terms" },
  { type: "p", text: "We may update these Terms from time to time." },
  {
    type: "p",
    text: "Continued use of LibraryJi after updated Terms become effective constitutes acceptance of the revised Terms, subject to applicable law.",
  },

  { type: "h2", text: "18. Governing Law" },
  { type: "p", text: "These Terms shall be governed by the laws applicable in India." },
  {
    type: "p",
    text: "Any dispute shall be subject to the jurisdiction of the competent courts having jurisdiction over the applicable location of LibraryJi, subject to applicable law.",
  },

  { type: "h2", text: "19. Contact" },
  { type: "p", text: "LibraryJi" },
  { type: "ul", items: ["Email: libraryji54@gmail.com", "Support: support@libraryji.in", "Phone: +91 70697 63365"] },
];

export default function TermsConditionsPage() {
  return <LegalPage title="Terms & Conditions" lastUpdated="15 August 2026" blocks={blocks} />;
}
