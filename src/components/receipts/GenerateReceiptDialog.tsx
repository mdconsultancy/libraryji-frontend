"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { useApi } from "@/hooks/useApi";
import { useMemberOptions } from "@/hooks/useOptions";
import { downloadFile } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import ReceiptPreview, { type ReceiptLibraryInfo } from "./ReceiptPreview";
import type { Member, MemberSubscription } from "@/types";
import { DetailSkeleton } from "@/components/shared/skeletons";

interface ReceiptData {
  member: Member;
  library: ReceiptLibraryInfo | null;
  subscriptions: MemberSubscription[];
  generated_at: string;
}

interface GenerateReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a student (e.g. opened from a member row) instead of starting on the search step. */
  initialMemberId?: number | null;
}

export default function GenerateReceiptDialog({ open, onOpenChange, initialMemberId }: GenerateReceiptDialogProps) {
  const toast = useToast();
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(initialMemberId ?? null);
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<"pdf" | "jpeg" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const members = useMemberOptions(memberSearch);

  const { data: receipt, isLoading } = useApi<ReceiptData>(
    selectedMemberId ? `/admin/members/${selectedMemberId}/receipt` : null
  );

  const reset = () => {
    setMemberSearch("");
    setSelectedMemberId(initialMemberId ?? null);
    setSubscriptionFilter("all");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const filteredSubscriptions =
    receipt && subscriptionFilter !== "all"
      ? receipt.subscriptions.filter((s) => String(s.id) === subscriptionFilter)
      : receipt?.subscriptions ?? [];

  const isBatch = (receipt?.subscriptions.length ?? 0) > 1;

  const handleDownloadPdf = async () => {
    if (!selectedMemberId) return;
    setDownloading("pdf");
    try {
      await downloadFile(
        `/admin/members/${selectedMemberId}/receipt/pdf`,
        subscriptionFilter !== "all" ? { member_subscription_id: subscriptionFilter } : undefined,
        `receipt-${receipt?.member.member_code ?? selectedMemberId}.pdf`
      );
    } catch {
      toast.error("Unable to download the receipt PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadJpeg = async () => {
    if (!previewRef.current) return;
    setDownloading("jpeg");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      if (!blob) throw new Error("Failed to render image");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${receipt?.member.member_code ?? selectedMemberId}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to generate the receipt image. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Receipt</DialogTitle>
        </DialogHeader>

        {!selectedMemberId ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-darklink">Search for a student to generate their fee receipt.</p>
            <div className="relative">
              <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
              <Input
                autoFocus
                placeholder="Search by name, phone, or member code..."
                className="pl-10"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border max-h-72 overflow-y-auto">
              {members.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  {memberSearch ? "No students found." : "Start typing to search students."}
                </p>
              ) : (
                members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className="flex items-center justify-between px-4 py-3 text-left hover:bg-lightprimary/40"
                  >
                    <div>
                      <p className="font-medium text-dark dark:text-white">{m.name}</p>
                      <p className="text-xs text-darklink">{m.member_code} &middot; {m.phone}</p>
                    </div>
                    <Icon icon="solar:alt-arrow-right-linear" width={16} height={16} className="text-darklink" />
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedMemberId(null); setSubscriptionFilter("all"); }}>
                <Icon icon="solar:alt-arrow-left-linear" width={16} height={16} className="mr-1" />
                Change student
              </Button>

              <div className="flex items-center gap-2">
                {isBatch && (
                  <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="All subscriptions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subscriptions (full history)</SelectItem>
                      {receipt?.subscriptions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.plan_name_snapshot} ({new Date(s.start_date).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" disabled={isLoading || !!downloading || !receipt}>
                      <Icon icon="solar:download-minimalistic-linear" width={16} height={16} className="mr-1.5" />
                      {downloading ? "Downloading..." : "Download"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadPdf}>
                      <Icon icon="solar:file-text-linear" width={16} height={16} className="mr-2" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadJpeg}>
                      <Icon icon="solar:gallery-linear" width={16} height={16} className="mr-2" />
                      Download as JPEG
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {isLoading || !receipt ? (
              <div className="rounded-lg border border-border p-6">
                <DetailSkeleton rows={7} />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-gray-50 dark:bg-darkgray/40 p-4">
                <ReceiptPreview
                  ref={previewRef}
                  member={receipt.member}
                  subscriptions={filteredSubscriptions}
                  library={receipt.library}
                  generatedAt={receipt.generated_at}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
