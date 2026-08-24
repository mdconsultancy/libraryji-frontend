"use client";

import { useState } from "react";
import CardBox from "@/app/components/shared/CardBox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@iconify/react";
import { api, ApiError, downloadFile } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type BackupCategory = "members" | "payments" | "staff" | "attendance" | "expenses";

const CATEGORIES: { key: BackupCategory; label: string; hint: string }[] = [
  { key: "members", label: "Students", hint: "All student/member records" },
  { key: "payments", label: "Payments / Fees", hint: "All payment & fee records" },
  { key: "staff", label: "Staff", hint: "Staff accounts of this library" },
  { key: "attendance", label: "Attendance", hint: "Check-in / check-out history" },
  { key: "expenses", label: "Expenses", hint: "Recorded library expenses" },
];

type GenerateSummary = Record<string, { label: string; count: number }>;

/**
 * Tenant Settings -> "Backup & Management": pick which record types to
 * include, generate a preview (record counts per category), then download
 * as Excel or PDF. Deliberately one-way — there's no upload/restore step,
 * this is a "get my data out" export only.
 */
export default function BackupManagement() {
  const toast = useToast();
  const [selected, setSelected] = useState<Set<BackupCategory>>(new Set(["members", "payments"]));
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<GenerateSummary | null>(null);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);

  const toggle = (key: BackupCategory) => {
    setSummary(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const categories = Array.from(selected);

  const handleGenerate = async () => {
    if (categories.length === 0) {
      toast.error("Select at least one category to export.");
      return;
    }
    setGenerating(true);
    setSummary(null);
    try {
      const data = await api.post<{ categories: GenerateSummary }>("/admin/backup/generate", { categories });
      setSummary(data.categories);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to generate export.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (format: "excel" | "pdf") => {
    setDownloading(format);
    try {
      const ext = format === "excel" ? "xlsx" : "pdf";
      await downloadFile(
        "/admin/backup/download",
        { format, categories: categories.join(",") },
        `library-export-${new Date().toISOString().slice(0, 10)}.${ext}`
      );
      toast.success("Export downloaded.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to download export.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
      <h5 className="card-title mb-1">Data Export</h5>
      <p className="text-xs text-gray-500 mb-6">
        Select what to include, then generate a downloadable copy of your library&apos;s data. This is a
        one-way export for your own records — nothing is stored, and files can&apos;t be re-uploaded or used
        to restore data.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <label
            key={c.key}
            className="flex items-start gap-3 rounded-lg border border-border dark:border-darkborder p-3 cursor-pointer hover:bg-hover dark:hover:bg-white/5"
          >
            <Checkbox checked={selected.has(c.key)} onCheckedChange={() => toggle(c.key)} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{c.label}</span>
              <span className="block text-xs text-gray-500">{c.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex justify-end mt-5">
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={generating || categories.length === 0}
          className="flex items-center gap-1.5"
        >
          <Icon icon="tabler:database-export" width={18} height={18} />
          {generating ? "Generating..." : "Generate Export"}
        </Button>
      </div>

      {summary && (
        <div className="mt-6 rounded-lg border border-border dark:border-darkborder p-4">
          <p className="text-sm font-medium mb-3">Export ready</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
            {Object.entries(summary).map(([key, s]) => (
              <div key={key} className="text-xs">
                <span className="text-gray-500">{s.label}:</span>{" "}
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-3">Choose a format to download:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDownload("excel")}
              disabled={downloading !== null}
              className="flex items-center gap-1.5"
            >
              <Icon icon="tabler:file-spreadsheet" width={18} height={18} />
              {downloading === "excel" ? "Downloading..." : "Download Excel"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDownload("pdf")}
              disabled={downloading !== null}
              className="flex items-center gap-1.5"
            >
              <Icon icon="tabler:file-type-pdf" width={18} height={18} />
              {downloading === "pdf" ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </div>
      )}
    </CardBox>
  );
}
