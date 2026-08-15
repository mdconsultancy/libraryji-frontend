import LegalPage, { type LegalBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy — LibraryJi",
};

const blocks: LegalBlock[] = [
  {
    type: "p",
    text: 'Welcome to LibraryJi ("LibraryJi", "we", "us", or "our"). LibraryJi is a SaaS-based library management platform that enables libraries and organizations to manage students/members, books, subscriptions, records, transactions, and other library-related operations through our website, application, and related services.',
  },
  { type: "p", text: "This Privacy Policy explains how we collect, use, store, protect, and disclose information when you use LibraryJi." },
  { type: "p", text: "By creating an account or using LibraryJi, you acknowledge that you have read and understood this Privacy Policy." },

  { type: "h2", text: "1. Information We Collect" },
  { type: "p", text: "Depending on how you use LibraryJi, we may collect the following information:" },

  { type: "h2", text: "1.1 Account Information" },
  { type: "p", text: "When you register, we may collect:" },
  {
    type: "ul",
    items: [
      "Full name",
      "Email address",
      "Mobile number",
      "Password or authentication information",
      "Organization/library name",
      "Library address and business information",
      "Account and subscription information",
    ],
  },

  { type: "h2", text: "1.2 Library and Student Information" },
  {
    type: "p",
    text: "Library administrators may enter information relating to their library users, students, members, or staff, including:",
  },
  {
    type: "ul",
    items: [
      "Student/member name",
      "Contact details",
      "Student/member ID",
      "Enrollment information",
      "Membership information",
      "Book issue and return records",
      "Due dates and fine information",
      "Transaction history",
      "Other information entered by the library administrator",
    ],
  },
  {
    type: "p",
    text: "The library or organization that enters such information is responsible for ensuring that it has the appropriate authority to collect and provide such information to LibraryJi.",
  },

  { type: "h2", text: "1.3 Payment Information" },
  { type: "p", text: "When you purchase a paid plan, payment may be processed through a third-party payment gateway." },
  { type: "p", text: "LibraryJi may receive information such as:" },
  { type: "ul", items: ["Payment status", "Transaction ID", "Amount paid", "Subscription plan", "Payment date", "Refund status"] },
  {
    type: "p",
    text: "We generally do not store your complete debit card, credit card, UPI PIN, CVV, or banking credentials on our servers.",
  },

  { type: "h2", text: "1.4 Technical Information" },
  { type: "p", text: "We may automatically collect certain technical information, including:" },
  {
    type: "ul",
    items: [
      "IP address",
      "Browser type",
      "Device type",
      "Operating system",
      "Login timestamps",
      "Application usage information",
      "Error and diagnostic information",
      "Cookies and similar technologies",
    ],
  },

  { type: "h2", text: "2. How We Use Your Information" },
  { type: "p", text: "We may use information to:" },
  {
    type: "ul",
    items: [
      "Create and manage your account",
      "Provide LibraryJi services",
      "Provide library management functionality",
      "Manage students and members",
      "Manage books and library transactions",
      "Process subscriptions and payments",
      "Provide customer support",
      "Send important account and service notifications",
      "Detect fraud, abuse, or unauthorized activity",
      "Maintain platform security",
      "Improve our services and features",
      "Troubleshoot technical problems",
      "Comply with applicable legal obligations",
      "Enforce our Terms & Conditions",
    ],
  },
  { type: "p", text: "We do not sell your personal information to third parties for their independent marketing purposes." },

  { type: "h2", text: "3. Free Trial and Subscription Information" },
  { type: "p", text: "LibraryJi may provide a 30-day free trial to eligible users or organizations." },
  { type: "p", text: "During the free trial, we may collect and process the same information necessary to provide the service." },
  {
    type: "p",
    text: "A paid subscription will begin only when the user selects and completes the applicable paid plan purchase, unless a different arrangement is expressly communicated at the time of purchase.",
  },
  { type: "p", text: "Subscription-related information may be used to:" },
  {
    type: "ul",
    items: [
      "Determine your plan",
      "Monitor subscription status",
      "Provide plan-specific features",
      "Process renewals",
      "Manage cancellations",
      "Process refunds where applicable",
    ],
  },

  { type: "h2", text: "4. Data Sharing" },
  {
    type: "p",
    text: "We may share information with trusted third-party service providers where reasonably necessary to operate LibraryJi, including:",
  },
  {
    type: "ul",
    items: [
      "Payment processors",
      "Cloud hosting providers",
      "Database and infrastructure providers",
      "Email/SMS service providers",
      "Security and authentication providers",
      "Analytics and monitoring providers",
      "Customer support tools",
    ],
  },
  { type: "p", text: "These service providers are expected to process information only for legitimate service-related purposes." },
  {
    type: "p",
    text: "We may also disclose information where required by applicable law, regulation, court order, government authority, or to protect the rights, security, and property of LibraryJi or its users.",
  },

  { type: "h2", text: "5. Library Administrator Responsibility" },
  { type: "p", text: "LibraryJi provides software infrastructure for managing library information." },
  { type: "p", text: "If you are a library administrator or organization administrator, you are responsible for:" },
  {
    type: "ul",
    items: [
      "Providing accurate information",
      "Obtaining appropriate permissions/consents where required",
      "Using student/member information lawfully",
      "Restricting access to authorized staff",
      "Protecting your account credentials",
      "Removing unnecessary data when appropriate",
    ],
  },
  {
    type: "p",
    text: "Library administrators should not upload information that they are not legally authorized to collect or process.",
  },

  { type: "h2", text: "6. Data Security" },
  {
    type: "p",
    text: "We use reasonable technical and organizational security measures designed to protect information against unauthorized access, alteration, disclosure, loss, or destruction.",
  },
  { type: "p", text: "However, no internet-based system can be guaranteed to be completely secure." },
  {
    type: "p",
    text: "You are also responsible for maintaining the confidentiality of your account credentials and administrator access.",
  },

  { type: "h2", text: "7. Data Retention" },
  { type: "p", text: "We generally retain information for as long as reasonably necessary to:" },
  {
    type: "ul",
    items: [
      "Provide the service",
      "Maintain account records",
      "Fulfil contractual obligations",
      "Resolve disputes",
      "Prevent fraud and abuse",
      "Comply with applicable legal requirements",
    ],
  },
  {
    type: "p",
    text: "When information is no longer reasonably required, we may delete, anonymize, or otherwise dispose of it subject to applicable law and legitimate business requirements.",
  },

  { type: "h2", text: "8. Account Deletion" },
  { type: "p", text: "You may request deletion of your LibraryJi account by contacting us." },
  {
    type: "p",
    text: "Some information may need to be retained where required for legal, accounting, security, fraud-prevention, or dispute-resolution purposes.",
  },
  {
    type: "p",
    text: "For organization accounts, deletion of an individual student's/member's data may also depend on the organization's instructions and applicable legal requirements.",
  },

  { type: "h2", text: "9. Cookies" },
  { type: "p", text: "LibraryJi may use cookies and similar technologies to:" },
  { type: "ul", items: ["Maintain login sessions", "Remember preferences", "Improve functionality", "Analyze service performance", "Improve security"] },
  { type: "p", text: "You may configure your browser to reject certain cookies, although some features may not function properly as a result." },

  { type: "h2", text: "10. Children's Data" },
  {
    type: "p",
    text: "LibraryJi may be used by libraries that maintain records relating to students, including individuals under 18 years of age.",
  },
  { type: "p", text: "LibraryJi does not intentionally use children's information for unrelated advertising purposes." },
  {
    type: "p",
    text: "Where children's personal data is processed through a library or organization account, the relevant library/organization is responsible for ensuring that the required authorization, consent, or other lawful basis exists under applicable law.",
  },

  { type: "h2", text: "11. Third-Party Services" },
  { type: "p", text: "LibraryJi may contain integrations or links to third-party services." },
  {
    type: "p",
    text: "We are not responsible for the privacy practices, security, or content of third-party services. Users should review the privacy policies of those services separately.",
  },

  { type: "h2", text: "12. Your Rights" },
  { type: "p", text: "Subject to applicable law, you may have rights relating to your personal data, including rights to:" },
  {
    type: "ul",
    items: [
      "Access information",
      "Request correction of inaccurate information",
      "Request deletion where legally applicable",
      "Withdraw consent where applicable",
      "Raise a privacy-related grievance",
    ],
  },
  { type: "p", text: "Requests may be submitted using the contact information provided below." },
  {
    type: "p",
    text: "The Digital Personal Data Protection Act, 2023 establishes a framework concerning processing of digital personal data in India.",
  },

  { type: "h2", text: "13. Changes to This Privacy Policy" },
  { type: "p", text: "We may update this Privacy Policy from time to time." },
  { type: "p", text: 'Any updated version will be published on this page with a revised "Last Updated" date.' },

  { type: "h2", text: "14. Contact Us" },
  { type: "p", text: "For privacy-related questions or requests:" },
  { type: "p", text: "LibraryJi" },
  { type: "ul", items: ["Email: libraryji54@gmail.com", "Support: support@libraryji.in", "Phone: +91 70697 63365"] },
];

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" lastUpdated="15 August 2026" blocks={blocks} />;
}
