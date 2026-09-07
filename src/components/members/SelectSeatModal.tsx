"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { Seat, SeatCategory, SeatStatus } from "@/types";

const seatCardStyles: Record<SeatStatus, { face: string }> = {
  available: { face: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  occupied: { face: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
  expired: { face: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  reserved: { face: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  maintenance: { face: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

export default function SelectSeatModal({
  open,
  onClose,
  seats,
  seatsLoading,
  selectedId,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  seats: Seat[];
  seatsLoading: boolean;
  selectedId: number | null;
  onConfirm: (id: number) => void;
}) {
  const [category, setCategory] = useState<SeatCategory>("regular");
  const [pending, setPending] = useState<number | null>(selectedId);

  useEffect(() => {
    if (open) {
      setPending(selectedId);
      const current = seats.find((s) => s.id === selectedId);
      if (current) setCategory(current.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const counts = useMemo(() => {
    const byCategory: Record<SeatCategory, Seat[]> = { regular: [], rotation: [] };
    for (const s of seats) byCategory[s.category]?.push(s);
    return byCategory;
  }, [seats]);

  const visibleSeats = counts[category] ?? [];
  const freeCount = visibleSeats.filter((s) => s.status === "available").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:armchair-2-bold-duotone" width={20} height={20} className="text-primary" />
            Select Seat
          </DialogTitle>
        </DialogHeader>

        <Tabs value={category} onValueChange={(v) => setCategory(v as SeatCategory)}>
          <TabsList className="w-full">
            <TabsTrigger value="regular" className="flex-1 flex items-center gap-1.5">
              <Icon icon="solar:armchair-2-linear" width={16} height={16} />
              Regular
              <span className="text-[10px] opacity-80">{counts.regular.filter((s) => s.status === "available").length} free</span>
            </TabsTrigger>
            <TabsTrigger value="rotation" className="flex-1 flex items-center gap-1.5">
              <Icon icon="solar:refresh-linear" width={16} height={16} />
              Rotation
              <span className="text-[10px] opacity-80">{counts.rotation.filter((s) => s.status === "available").length} free</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4 text-xs text-darklink">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Free</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Filled</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Renewal due</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Selected</span>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {seatsLoading ? (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-100 dark:bg-darkgray" />
              ))}
            </div>
          ) : visibleSeats.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No {category} seats configured yet.</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {visibleSeats.map((seat) => {
                const selected = seat.id === pending;
                const selectable = seat.status === "available" || selected;
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={!selectable}
                    onClick={() => setPending(seat.id)}
                    title={seat.seat_number}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-xs font-bold transition-colors",
                      selected
                        ? "bg-primary text-white border-primary"
                        : selectable
                          ? `${seatCardStyles[seat.status].face} border-transparent hover:border-primary/40 cursor-pointer`
                          : "bg-lightgray text-gray-400 dark:bg-white/5 border-transparent cursor-not-allowed opacity-60"
                    )}
                  >
                    <Icon icon="solar:armchair-2-bold" width={18} height={18} />
                    {seat.seat_number}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-darklink">{freeCount} of {visibleSeats.length} {category} seats free.</p>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-md flex items-center gap-1.5"
            disabled={!pending}
            onClick={() => pending && onConfirm(pending)}
          >
            <Icon icon="solar:check-circle-bold" width={16} height={16} />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
