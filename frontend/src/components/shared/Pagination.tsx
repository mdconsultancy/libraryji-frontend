"use client";

import { Button } from "@/components/ui/button";
import type { Paginated } from "@/types";

interface PaginationProps<T> {
  meta: Paginated<T> | null;
  onPageChange: (page: number) => void;
}

export default function PaginationBar<T>({ meta, onPageChange }: PaginationProps<T>) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
      <p className="text-sm text-darklink">
        Showing {meta.from ?? 0}-{meta.to ?? 0} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm px-2">
          Page {meta.current_page} of {meta.last_page}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
