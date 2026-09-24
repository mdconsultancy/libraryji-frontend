"use client";

import { Icon } from "@iconify/react";

export interface ActivityPagination {
  page: number;
  lastPage: number;
  total?: number;
  perPage: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

/** Page numbers to render, with "…" gaps — e.g. 1 … 4 5 6 … 12. */
function pageList(page: number, lastPage: number): (number | "gap")[] {
  if (lastPage <= 5) return Array.from({ length: lastPage }, (_, i) => i + 1);
  const pages = new Set([1, lastPage, page - 1, page, page + 1].filter((p) => p >= 1 && p <= lastPage));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/** Numbered pager shared by the desktop and mobile Recent Activities cards. */
const ActivityPager = ({ pagination, count }: { pagination: ActivityPagination; count: number }) => {
  const { page, lastPage, total, perPage, loading, onPageChange } = pagination;
  const from = count === 0 ? 0 : (page - 1) * perPage + 1;
  const to = (page - 1) * perPage + count;

  const btn =
    "h-8 min-w-8 px-2 rounded-md text-sm flex items-center justify-center border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-darklink">
        Showing {from}–{to}
        {total !== undefined ? ` of ${total}` : ""}
        {loading ? " · Loading…" : ""}
      </p>

      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            className={`${btn} hover:bg-lightprimary`}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} height={16} />
          </button>
          {pageList(page, lastPage).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-darklink">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? "page" : undefined}
                className={`${btn} ${p === page ? "bg-primary text-white border-primary" : "hover:bg-lightprimary text-dark dark:text-white"}`}
                onClick={() => p !== page && onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            aria-label="Next page"
            className={`${btn} hover:bg-lightprimary`}
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            <Icon icon="solar:alt-arrow-right-linear" width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityPager;
