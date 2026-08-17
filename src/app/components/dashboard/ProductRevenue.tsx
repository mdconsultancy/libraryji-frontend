"use client";

import Link from "next/link";
import Avatar from "@/components/shared/Avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Member } from "@/types";

const statusStyles: Record<string, string> = {
  active: "text-white bg-success hover:bg-success/90",
  inactive: "text-dark bg-warning hover:bg-warning/90",
  expired: "text-white bg-error hover:bg-error/90",
};

const feeStatusStyles: Record<string, string> = {
  paid: "text-white bg-success hover:bg-success/90",
  partial: "text-dark bg-warning hover:bg-warning/90",
  pending: "text-white bg-error hover:bg-error/90",
  none: "text-white bg-gray-400 hover:bg-gray-400/90",
};

// Same red/yellow/green cell backgrounds the fee-status badge above already
// uses, just as a light wash on the whole cell (not only the badge text) —
// reuses the light/dark pairing from members/page.tsx's avatarPalette (e.g.
// bg-lightsuccess text-success) rather than inventing new colors.
const feeCellBg: Record<string, string> = {
  paid: "bg-lightsuccess",
  partial: "bg-lightwarning",
  pending: "bg-lighterror",
  none: "",
};

/** Same red/yellow/green thresholds as daysLeftLabel() in members/page.tsx:
 *  expired or due today = red, 5 days or fewer = yellow, otherwise green. */
function daysLeftClassName(days: number | null | undefined): string {
  if (days == null) return "text-gray-400";
  if (days <= 0) return "text-error font-medium";
  if (days <= 5) return "text-warning font-medium";
  return "text-success font-medium";
}

const ProductRevenue = ({
  members,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  members: Member[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) => {
  return (
    <div className="rounded-xl shadow-xs bg-white dark:bg-darkgray pt-4 px-0 w-full">
      <div className="px-6 flex items-center justify-between">
        <h5 className="card-title mb-4 text-base font-semibold">
          Recent Members
        </h5>
        <Link href="/members" className="text-sm text-primary mb-4">
          View all
        </Link>
      </div>

      <ScrollArea className="max-h-[340px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-3 ps-6">Member</TableHead>
                <TableHead className="p-3">Status</TableHead>
                <TableHead className="p-3">Joined</TableHead>
                <TableHead className="p-3">Seat</TableHead>
                <TableHead className="p-3">Days Left</TableHead>
                <TableHead className="p-3">Fee</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-sm text-gray-500">
                    No members yet
                  </TableCell>
                </TableRow>
              )}
              {members.map((member) => {
                const sub = member.active_subscription;
                return (
                  <TableRow key={member.id}>
                    <TableCell className="whitespace-nowrap ps-6 py-2">
                      <div className="flex gap-2.5 items-center">
                        <Avatar src={member.photo_url} name={member.name} seed={member.id} size={32} />
                        <div className="truncate max-w-40">
                          <h6 className="text-sm font-medium truncate">{member.name}</h6>
                          <p className="text-xs text-gray-500 truncate">{member.member_code}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2">
                      <Badge
                        variant="secondary"
                        className={`${statusStyles[member.status]} border-none capitalize text-xs`}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2">
                      <p className="text-xs whitespace-nowrap">{new Date(member.join_date).toLocaleDateString()}</p>
                    </TableCell>

                    <TableCell className="py-2">
                      <p className="text-xs">{sub?.seat?.seat_number ?? "—"}</p>
                    </TableCell>

                    <TableCell className="py-2">
                      <p className={`text-xs ${daysLeftClassName(sub?.days_left)}`}>
                        {sub?.days_left != null ? `${sub.days_left}d` : "—"}
                      </p>
                    </TableCell>

                    <TableCell className={`py-2 ${feeCellBg[sub?.fee_status ?? "none"]}`}>
                      <Badge
                        variant="secondary"
                        className={`${feeStatusStyles[sub?.fee_status ?? "none"]} border-none capitalize text-xs`}
                      >
                        {sub ? sub.fee_status : "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      {hasMore && (
        <div className="mt-4 mb-2 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductRevenue;
