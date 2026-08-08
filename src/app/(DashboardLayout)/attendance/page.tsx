"use client";

import { useState, FormEvent } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useMemberOptions } from "@/hooks/useOptions";
import type { Attendance, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Attendance" }];

export default function AttendancePage() {
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: records, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Attendance>>("/admin/attendance", {
    page,
    date: dateFilter || undefined,
  });
  const error = loadError ? "Unable to load attendance records." : null;

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const members = useMemberOptions(memberSearch);
  const [checkInMemberId, setCheckInMemberId] = useState("");
  const [checkInErrors, setCheckInErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);

  const openCheckIn = () => {
    setCheckInMemberId("");
    setMemberSearch("");
    setCheckInErrors({});
    setCheckInOpen(true);
  };

  const handleCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCheckInErrors({});
    try {
      await api.post("/admin/attendance/check-in", { member_id: Number(checkInMemberId) });
      setCheckInOpen(false);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setCheckInErrors(err.errors || { general: [err.message] });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (attendance: Attendance) => {
    setCheckingOutId(attendance.id);
    try {
      await api.post(`/admin/attendance/${attendance.id}/check-out`);
      mutate();
    } finally {
      setCheckingOutId(null);
    }
  };

  return (
    <>
      <BreadcrumbComp title="Attendance" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex flex-wrap gap-3">
            <Input type="date" className="w-full sm:w-48" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} />
            {dateFilter && (
              <Button variant="outline" size="sm" onClick={() => setDateFilter("")}>Clear date</Button>
            )}
          </div>
          <Button onClick={openCheckIn} className="flex items-center gap-1.5">
            <Icon icon="solar:login-3-linear" width={18} height={18} />
            Check In
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={6} />
              ) : records?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">No attendance records found</TableCell>
                </TableRow>
              ) : (
                records?.data.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="ps-6 font-medium">{rec.member?.name || `#${rec.member_id}`}</TableCell>
                    <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(rec.check_in).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      {rec.check_out ? (
                        new Date(rec.check_out).toLocaleTimeString()
                      ) : (
                        <Badge variant="secondary" className="border-none bg-lightsuccess text-success">Checked in</Badge>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{rec.method}</TableCell>
                    <TableCell className="text-right pe-6">
                      {!rec.check_out && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(rec)}
                          disabled={checkingOutId === rec.id}
                        >
                          {checkingOutId === rec.id ? "..." : "Check Out"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar meta={records ?? null} onPageChange={setPage} />
      </CardBox>

      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Check In Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckIn} className="grid grid-cols-1 gap-4">
            {checkInErrors.general && <p className="text-sm text-error">{checkInErrors.general[0]}</p>}
            <div className="flex flex-col gap-2">
              <Label>Member</Label>
              <Input placeholder="Search member..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="mb-2" />
              <Select value={checkInMemberId} onValueChange={setCheckInMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.member_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {checkInErrors.member_id && <p className="text-xs text-error">{checkInErrors.member_id[0]}</p>}
            </div>

            <DialogFooter className="flex gap-2 mt-4">
              <Button type="submit" className="rounded-md" disabled={saving || !checkInMemberId}>
                {saving ? "Checking in..." : "Check In"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setCheckInOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
