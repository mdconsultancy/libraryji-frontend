import LegalPage, { type LegalBlock } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Refund & Cancellation Policy — LibraryJi",
};

const blocks: LegalBlock[] = [
  { type: "p", text: "This Refund & Cancellation Policy explains the rules applicable to subscriptions purchased through LibraryJi." },

  { type: "h2", text: "1. Free Trial" },
  { type: "p", text: "LibraryJi may offer a 30-day free trial to eligible users." },
  { type: "p", text: "No subscription payment is required during the free trial unless expressly stated otherwise." },
  { type: "p", text: "The customer must purchase a paid plan after the trial if they wish to continue using paid features." },

  { type: "h2", text: "2. Paid Subscription" },
  { type: "p", text: "Once a customer purchases a paid LibraryJi plan, the subscription becomes active after successful payment." },
  { type: "p", text: "The subscription period will be based on the selected billing cycle." },
  { type: "p", text: "For example:" },
  { type: "ul", items: ["Monthly plan → one-month subscription period", "Annual plan → twelve-month subscription period"] },

  { type: "h2", text: "3. Seven-Day Refund Policy" },
  { type: "p", text: "LibraryJi provides a 7-day refund window for eligible paid subscription purchases." },
  { type: "p", text: "A customer may request a refund within 7 calendar days from the date of the successful paid subscription transaction." },
  { type: "p", text: "To request a refund, the customer must contact LibraryJi within the applicable seven-day period." },

  { type: "h2", text: "4. Refund Eligibility" },
  { type: "p", text: "A refund may be considered where:" },
  {
    type: "ul",
    items: [
      "The request is submitted within 7 calendar days",
      "The transaction can be verified",
      "The subscription was purchased directly through LibraryJi or an applicable authorized payment channel",
      "The account has not been involved in fraud or abuse",
    ],
  },
  { type: "p", text: "Refund approval may also depend on the circumstances of the request and applicable law." },

  { type: "h2", text: "5. Non-Refundable Situations" },
  { type: "p", text: "A refund may not be available where:" },
  {
    type: "ul",
    items: [
      "The 7-day refund period has expired",
      "The account has been terminated because of a serious Terms violation",
      "The customer has intentionally abused the free trial or refund system",
      "The customer has purchased through an unrelated third-party reseller whose refund terms apply",
      "The request relates only to unused days after the refund period",
      "The customer simply changes their mind after the applicable refund period",
    ],
  },

  { type: "h2", text: "6. Cancellation" },
  { type: "p", text: "Customers may request cancellation of their subscription." },
  { type: "p", text: "Cancellation generally prevents the next subscription renewal." },
  { type: "p", text: "Unless the customer qualifies for a refund under this policy, cancellation does not automatically result in a refund of the current billing period." },

  { type: "h2", text: "7. Refund Processing" },
  { type: "p", text: "Once a refund is approved, LibraryJi will initiate the refund through the applicable payment method or payment gateway." },
  {
    type: "p",
    text: "The actual time taken for the amount to appear in the customer's bank account, card, UPI account, or other payment method may depend on the payment gateway and financial institution.",
  },

  { type: "h2", text: "8. Payment Gateway Charges" },
  {
    type: "p",
    text: "Where applicable, payment gateway charges, transaction fees, taxes, or other third-party charges may affect the amount refunded, subject to applicable law and the specific transaction.",
  },

  { type: "h2", text: "9. Duplicate Payments" },
  {
    type: "p",
    text: "If a customer is charged more than once for the same subscription due to a duplicate transaction, the customer should contact support with the relevant transaction details.",
  },
  { type: "p", text: "Verified duplicate payments may be refunded appropriately." },

  { type: "h2", text: "10. Failed Payments" },
  {
    type: "p",
    text: "If a payment fails but the customer's bank/payment provider shows a temporary debit, the amount may be automatically reversed by the payment gateway or bank.",
  },
  {
    type: "p",
    text: "If the amount is not reversed within the expected processing period, the customer should contact LibraryJi with the transaction/reference details.",
  },

  { type: "h2", text: "11. How to Request a Refund" },
  { type: "p", text: "Refund requests can be submitted through:" },
  { type: "p", text: "Email: support@libraryji.in" },
  { type: "p", text: "Please include:" },
  {
    type: "ul",
    items: [
      "Registered name",
      "Registered email address",
      "Phone number",
      "Subscription plan",
      "Payment/transaction ID",
      "Payment date",
      "Reason for refund",
    ],
  },

  { type: "h2", text: "12. Refund Abuse" },
  {
    type: "p",
    text: "LibraryJi reserves the right to investigate suspected refund abuse, fraudulent transactions, repeated trial abuse, or other misuse of the refund system.",
  },

  { type: "h2", text: "13. Contact" },
  { type: "p", text: "LibraryJi" },
  { type: "ul", items: ["Email: libraryji54@gmail.com", "Support: support@libraryji.in", "Phone: +91 70697 63365"] },
];

export default function RefundCancellationPolicyPage() {
  return <LegalPage title="Refund & Cancellation Policy" lastUpdated="15 August 2026" blocks={blocks} />;
}
