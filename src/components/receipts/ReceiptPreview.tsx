"use client";

import { forwardRef } from "react";
import type { Member, MemberSubscription } from "@/types";

export interface ReceiptLibraryInfo {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  gst_number?: string | null;
}

interface ReceiptPreviewProps {
  member: Member;
  subscriptions: MemberSubscription[];
  library?: ReceiptLibraryInfo | null;
  generatedAt?: string;
}

const statusColor: Record<string, string> = {
  paid: "#15803d",
  pending: "#b45309",
  failed: "#b91c1c",
  refunded: "#b91c1c",
};

function money(value: string | number | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * The visual receipt used both for the on-screen preview and as the exact
 * DOM captured by html2canvas for the JPEG download — kept visually close to
 * the backend's dompdf receipt (resources/views/receipts/receipt.blade.php),
 * including the same faint "Powered by LibraryJi" watermark.
 *
 * Rendered at a fixed pixel width (not responsive) so the on-screen preview
 * and the rasterized JPEG always match 1:1, and so long payment histories
 * don't reflow oddly inside a narrow dialog (it scrolls horizontally there
 * instead).
 */
const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(function ReceiptPreview(
  { member, subscriptions, library, generatedAt },
  ref
) {
  const totalBilled = subscriptions.reduce((sum, s) => sum + Number(s.amount ?? 0), 0);
  const totalPaid = subscriptions.reduce((sum, s) => sum + Number(s.paid_amount ?? 0), 0);
  const totalDue = Math.max(totalBilled - totalPaid, 0);
  const generated = generatedAt ? new Date(generatedAt) : new Date();

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: 760,
        background: "#ffffff",
        color: "#222222",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 12,
        padding: "28px 34px",
        overflow: "hidden",
      }}
    >
      {/* Faint colorful watermark — ~6% opacity logo centered behind the content, echoing the PDF. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logos/logo.jpeg" alt="" style={{ width: 340, opacity: 0.06 }} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 9,
          letterSpacing: 1,
          color: "#999999",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      >
        POWERED BY LIBRARYJI &mdash; SMART LIBRARY MANAGEMENT SYSTEM
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #eee", paddingBottom: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b", margin: "0 0 3px" }}>{library?.name || "Library"}</p>
            <div style={{ fontSize: 10, color: "#666", lineHeight: 1.5 }}>
              {library?.address && <div>{library.address}</div>}
              {library?.phone && <div>Phone: {library.phone}</div>}
              {library?.gst_number && <div>GSTIN: {library.gst_number}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 15, fontWeight: "bold", color: "#4f46e5", margin: "0 0 3px" }}>Fee Receipt</p>
            <div style={{ fontSize: 10, color: "#666" }}>
              Generated: {generated.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })},{" "}
              {generated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(248, 250, 252, 0.55)", borderRadius: 6, padding: "10px 14px", marginBottom: 16, display: "flex" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#888", letterSpacing: 0.5 }}>Student</div>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#1e293b", marginTop: 2 }}>{member.name}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#888", letterSpacing: 0.5 }}>Member Code</div>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#1e293b", marginTop: 2 }}>{member.member_code}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#888", letterSpacing: 0.5 }}>Phone</div>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#1e293b", marginTop: 2 }}>{member.phone}</div>
          </div>
        </div>

        {subscriptions.length === 0 && <p>No subscription records found for this student.</p>}

        {subscriptions.map((subscription) => {
          const paid = Number(subscription.paid_amount ?? 0);
          const due = Number(subscription.due_amount ?? Math.max(Number(subscription.amount ?? 0) - paid, 0));
          return (
            <div key={subscription.id} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#1e293b", background: "rgba(238, 242, 255, 0.6)", padding: "6px 10px", borderRadius: "4px 4px 0 0", display: "flex", justifyContent: "space-between" }}>
                <span>
                  {subscription.plan_name_snapshot} &middot;{" "}
                  {new Date(subscription.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} &ndash;{" "}
                  {new Date(subscription.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  {subscription.seat && <> &middot; Seat {subscription.seat.seat_number}</>}
                </span>
                <span style={{ textTransform: "capitalize", color: "#4f46e5" }}>{subscription.status}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Invoice #", "Date", "Method", "Status", "Amount"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "6px 8px",
                          textAlign: i === 4 ? "right" : "left",
                          background: "rgba(249, 250, 251, 0.65)",
                          fontSize: 10,
                          textTransform: "uppercase",
                          color: "#555",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(subscription.payments ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ border: "1px solid #e5e7eb", padding: "6px 8px" }}>No payments recorded yet.</td>
                    </tr>
                  ) : (
                    (subscription.payments ?? []).map((payment, i) => (
                      <tr key={payment.id} style={{ background: i % 2 === 1 ? "rgba(250, 250, 250, 0.5)" : undefined }}>
                        <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px" }}>{payment.invoice_number}</td>
                        <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px" }}>
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                        </td>
                        <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textTransform: "capitalize" }}>{payment.payment_method.replace("_", " ")}</td>
                        <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textTransform: "capitalize", color: statusColor[payment.status] || "#222", fontWeight: "bold" }}>
                          {payment.status}
                        </td>
                        <td style={{ border: "1px solid #e5e7eb", padding: "6px 8px", textAlign: "right" }}>{money(payment.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div style={{ display: "flex", gap: 20, marginTop: 6, fontSize: 10.5 }}>
                <div>
                  Plan Amount: <strong>{money(subscription.amount)}</strong>
                </div>
                <div>
                  Paid: <strong style={{ color: "#15803d" }}>{money(paid)}</strong>
                </div>
                <div>
                  Due: <strong style={{ color: due > 0 ? "#b45309" : undefined }}>{money(due)}</strong>
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 10, borderTop: "2px solid #1e293b", paddingTop: 10, display: "flex" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#888" }}>Total Billed</div>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#1e293b", marginTop: 2 }}>{money(totalBilled)}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#888" }}>Total Paid</div>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#15803d", marginTop: 2 }}>{money(totalPaid)}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#888" }}>Balance Due</div>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#b91c1c", marginTop: 2 }}>{money(totalDue)}</div>
          </div>
        </div>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 9, color: "#999" }}>This is a system-generated receipt. &mdash; Powered by LibraryJi</p>
      </div>
    </div>
  );
});

export default ReceiptPreview;
