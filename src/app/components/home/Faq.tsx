import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Reveal from "./Reveal";
import MockupFrame from "./MockupFrame";

export const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is LibraryJi a cloud-based library management system?",
    answer:
      "Yes — LibraryJi is a SaaS (cloud-based) library management system. There's nothing to install; you sign up and start managing your library or study room from any browser or the mobile app.",
  },
  {
    question: "Can I use LibraryJi for a study room or reading room, not just a traditional library?",
    answer:
      "Yes. LibraryJi is built for both traditional libraries and paid study room / reading room businesses — seat rental, shift-wise rotation seats, and student fee collection are core features.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes — you can start a 30-day free trial with no card required and upgrade to a paid plan whenever you're ready.",
  },
  {
    question: "What am I paying for, and what does a paid plan include?",
    answer:
      "LibraryJi is a recurring software subscription. A paid plan gives your library ongoing access to the LibraryJi web panel and Android/iOS apps and the features in that plan — seat and shift management, student and member enrollment, attendance, membership plans, fee and payment collection, renewals, reports and exports, staff accounts, plus product updates and support. Higher plans raise usage limits (such as the number of seats or students).",
  },
  {
    question: "How is LibraryJi billed?",
    answer:
      "Plans are billed as a subscription on a monthly or yearly cycle, shown before you pay. The subscription starts once payment is confirmed and renews each cycle unless you cancel. Refunds are handled per our Refund & Cancellation Policy (a 7-day refund window for eligible paid purchases).",
  },
  {
    question: "Does LibraryJi work for libraries outside big metro cities?",
    answer:
      "Yes — LibraryJi is used by libraries and study centres across India, in metro cities and smaller towns alike, including Gujarat, Rajasthan, and every other state.",
  },
  {
    question: "Is there a mobile app?",
    answer: "Yes — LibraryJi has an app on Android and iOS so you can manage seats, students, attendance, and fees from your phone.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lightprimary px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/10">
          FAQ
        </span>
        <h2 className="mt-4 text-2xl font-bold text-dark dark:text-white sm:text-3xl">Frequently Asked Questions</h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal delay={0.1} className="order-2 lg:order-1">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.question} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold text-dark dark:text-white sm:text-base">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-charcoal dark:text-darklink">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal className="relative mx-auto hidden w-full max-w-sm lg:order-2 lg:block">
          <MockupFrame tone="primary" className="rotate-[2deg]" rows={4} />
          <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full rounded-[1.75rem] bg-success/10" />
        </Reveal>
      </div>
    </section>
  );
}
