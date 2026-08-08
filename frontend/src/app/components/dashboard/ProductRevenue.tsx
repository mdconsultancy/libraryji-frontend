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
import { storageUrl } from "@/lib/api";
import type { Member } from "@/types";

const statusStyles: Record<string, string> = {
  active: "text-green-600 bg-green-100",
  inactive: "text-yellow-600 bg-yellow-100",
  expired: "text-red-600 bg-red-100",
};

const ProductRevenue = ({ members }: { members: Member[] }) => {
  return (
    <div className="rounded-xl shadow-xs bg-white dark:bg-darkgray pt-6 px-0 w-full">
      <div className="px-6 flex items-center justify-between">
        <h5 className="card-title mb-6 text-lg font-semibold">
          Recent Members
        </h5>
        <Link href="/members" className="text-sm text-primary mb-6">
          View all
        </Link>
      </div>

      <ScrollArea className="max-h-[450px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-6">Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-sm text-gray-500">
                    No members yet
                  </TableCell>
                </TableRow>
              )}
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="whitespace-nowrap ps-6">
                    <div className="flex gap-3 items-center">
                      <Image
                        src={storageUrl(member.photo_path) || "/images/profile/user-1.jpg"}
                        alt={member.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div className="truncate max-w-56">
                        <h6 className="text-sm font-medium">{member.name}</h6>
                        <p className="text-xs text-gray-500">{member.member_code}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusStyles[member.status]} border-none capitalize`}
                    >
                      {member.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm">{new Date(member.join_date).toLocaleDateString()}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProductRevenue;
