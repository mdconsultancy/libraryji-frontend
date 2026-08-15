"use client";

import Image from "next/image";
import Link from "next/link";
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
  active: "text-green-600 bg-green-100",
  inactive: "text-yellow-600 bg-yellow-100",
  expired: "text-red-600 bg-red-100",
};

const feeStatusStyles: Record<string, string> = {
  paid: "text-green-600 bg-green-100",
  partial: "text-yellow-600 bg-yellow-100",
  pending: "text-red-600 bg-red-100",
  none: "text-gray-500 bg-gray-100",
};

const ProductRevenue = ({ members }: { members: Member[] }) => {
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
                        <Image
                          src={member.photo_url || "/images/profile/user-1.jpg"}
                          alt={member.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
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
                      <p className="text-xs">{sub?.days_left != null ? `${sub.days_left}d` : "—"}</p>
                    </TableCell>

                    <TableCell className="py-2">
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
    </div>
  );
};

export default ProductRevenue;
