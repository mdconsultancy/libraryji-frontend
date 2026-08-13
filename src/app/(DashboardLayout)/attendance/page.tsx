"use client";

import { useMemo, useState } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Icon } from "@iconify/react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import type { AttendanceRoster } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Attendance" }];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TODAY = toDateString(new Date());

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

type Tab = "all" | "present" | "absent";

export default function AttendancePage() {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [marking, setMarking] = useState<"present" | "absent" | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  const editable = selectedDate === TODAY;

  const { data: roster, isLoading, error: loadError, mutate } = useApi<AttendanceRoster>(
    "/admin/attendance/roster",
    { date: selectedDate }
  );
  const error = loadError ? "Unable to load attendance." : null;
  const members = roster?.members ?? [];

  // "All" here means "not yet marked" — the moment a student is marked
  // present/absent they drop out of it and show up under their own tab
  // instead, so this list is always just what's left to process.
  const visibleMembers = useMemo(() => {
    if (tab === "present") return members.filter((m) => m.status === "present");
    if (tab === "absent") return members.filter((m) => m.status === "absent");
    return members.filter((m) => m.status === null);
  }, [members, tab]);

  const allSelected = visibleMembers.length > 0 && visibleMembers.every((m) => selectedIds.has(m.id));

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(visibleMembers.map((m) => m.id)));
  };

  const toggleOne = (id: number) => {
    if (!editable) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mark = async (status: "present" | "absent") => {
    if (selectedIds.size === 0) return;
    setMarking(status);
    try {
      await api.post("/admin/attendance/bulk-mark", {
        date: selectedDate,
        member_ids: Array.from(selectedIds),
        status,
      });
      setSelectedIds(new Set());
      mutate();
      toast.success(status === "present" ? "Marked present." : "Marked absent.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update attendance.");
    } finally {
      setMarking(null);
    }
  };

  const calendarSelected = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(toDateString(date));
    setSelectedIds(new Set());
    setCalendarOpen(false);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setSelectedIds(new Set());
  };

  return (
    <>
      <BreadcrumbComp title="Attendance" items={BCrumb} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: student roster */}
        <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
            <div>
              <h5 className="card-title">
                {editable ? "Today's Attendance" : `Attendance — ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
              </h5>
            </div>
            {!editable && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-warning bg-lightwarning rounded-md px-3 py-1.5">
                <Icon icon="solar:eye-linear" width={14} height={14} />
                Read-only — only today can be edited
              </div>
            )}
          </div>

          {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

          <div className="flex items-center gap-2 px-6 pb-3">
            {([
              ["all", "All", roster?.unmarked_count ?? 0],
              ["present", "Present", roster?.present_count ?? 0],
              ["absent", "Absent", roster?.absent_count ?? 0],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchTab(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  tab === key
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-link dark:text-darklink border-border hover:bg-lightprimary/40"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {editable && visibleMembers.length > 0 && (
            <div className="flex items-center gap-2 px-6 pb-3">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <span className="text-sm font-medium text-link dark:text-darklink">
                {allSelected ? "Unselect all" : "Select all"}
              </span>
            </div>
          )}

          <div className={`max-h-[60vh] overflow-y-auto ${editable && selectedIds.size > 0 ? "pb-20" : ""}`}>
            {isLoading ? (
              <p className="text-center py-10 text-sm text-gray-500">Loading...</p>
            ) : visibleMembers.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-500">
                {tab === "all" ? "Everyone's been marked for today." : `No ${tab} students yet.`}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {visibleMembers.map((member) => {
                  const selected = selectedIds.has(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleOne(member.id)}
                      className={`flex items-center gap-3 px-6 py-3 ${editable ? "cursor-pointer hover:bg-lightprimary/40" : ""} ${selected ? "bg-lightprimary/60" : ""}`}
                    >
                      {editable && <Checkbox checked={selected} onCheckedChange={() => toggleOne(member.id)} onClick={(e) => e.stopPropagation()} />}
                      <div className="h-10 w-10 rounded-full bg-lightprimary text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                        {member.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          initials(member.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark dark:text-white truncate">{member.name}</p>
                        <p className="text-xs text-darklink truncate">{member.email || member.member_code}</p>
                      </div>
                      {member.status === "present" ? (
                        <Badge variant="secondary" className="border-none bg-lightsuccess text-success shrink-0">Present</Badge>
                      ) : member.status === "absent" ? (
                        <Badge variant="secondary" className="border-none bg-lighterror text-error shrink-0">Absent</Badge>
                      ) : (
                        <Badge variant="secondary" className="border-none bg-lightsecondary text-secondary shrink-0">Unmarked</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </CardBox>

        {/* Right: calendar — desktop only, xl and up. On smaller screens a
            floating button opens the same calendar in a side sheet instead,
            so it doesn't eat into the roster's vertical space. */}
        <CardBox className="hidden xl:block p-4 bg-background border-none rounded-xl shadow-xs">
          <Calendar
            mode="single"
            selected={calendarSelected}
            onSelect={handleSelectDate}
            disabled={(date) => date > new Date()}
            className="w-full"
          />
        </CardBox>
      </div>

      {/* Fixed to the viewport (not `sticky` inside the roster card) so it's
          always pinned above the bottom edge regardless of how tall the
          roster list or the page is — sticky-inside-a-normal-flow-card only
          "sticks" once that card's own bottom edge nears the viewport,
          which on mobile made it appear inconsistently, often below the
          fold entirely. */}
      {editable && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <span className="text-sm font-medium text-link dark:text-darklink">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" className="border-error text-error hover:bg-error hover:text-white" disabled={marking !== null} onClick={() => mark("absent")}>
              {marking === "absent" ? "Marking..." : "Mark Absent"}
            </Button>
            <Button disabled={marking !== null} onClick={() => mark("present")}>
              {marking === "present" ? "Marking..." : "Mark Present"}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile/tablet: floating calendar button + slide-in sheet — sticky
          near the top (below the app header) rather than bottom, so it never
          collides with the "Mark Present/Absent" bar that docks to the
          bottom once a selection is active. */}
      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        aria-label="Choose date"
        className="xl:hidden fixed top-20 right-4 z-40 h-12 w-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Icon icon="solar:calendar-mark-bold-duotone" width={22} height={22} />
      </button>

      <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[340px] p-4">
          <VisuallyHidden>
            <SheetTitle>Choose a date</SheetTitle>
          </VisuallyHidden>
          <div className="mt-8">
            <Calendar
              mode="single"
              selected={calendarSelected}
              onSelect={handleSelectDate}
              disabled={(date) => date > new Date()}
              className="w-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
