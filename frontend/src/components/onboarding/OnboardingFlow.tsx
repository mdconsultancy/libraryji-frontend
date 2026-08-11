"use client";

import { useEffect, useState } from "react";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { Hall, Seat, SeatCategory, SeatType } from "@/types";

const SEAT_TYPES: { label: string; value: SeatType }[] = [
  { label: "General", value: "general" },
  { label: "AC", value: "ac" },
  { label: "Non-AC", value: "non_ac" },
  { label: "Cabin", value: "cabin" },
  { label: "Premium", value: "premium" },
];

const SEAT_CATEGORIES: { label: string; value: SeatCategory }[] = [
  { label: "Regular — fixed to one member", value: "regular" },
  { label: "Rotation — shared across shifts", value: "rotation" },
];

interface DetailsForm {
  alternate_phone: string;
  established_year: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string;
}

const emptyDetails: DetailsForm = {
  alternate_phone: "",
  established_year: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gst_number: "",
};

export default function OnboardingFlow() {
  const { user, refreshMe } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [savingDetails, setSavingDetails] = useState(false);
  const [details, setDetails] = useState<DetailsForm>(emptyDetails);

  const [halls, setHalls] = useState<Hall[]>([]);
  const [hallsLoaded, setHallsLoaded] = useState(false);
  const [newHallName, setNewHallName] = useState("");
  const [addingHall, setAddingHall] = useState(false);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatHallId, setSeatHallId] = useState<string>("none");
  const [prefix, setPrefix] = useState("A");
  const [startNumber, setStartNumber] = useState("1");
  const [count, setCount] = useState("10");
  const [seatType, setSeatType] = useState<SeatType>("general");
  const [category, setCategory] = useState<SeatCategory>("regular");
  const [generating, setGenerating] = useState(false);

  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (step !== 2 || hallsLoaded) return;
    (async () => {
      try {
        const [hallsData, seatsData] = await Promise.all([
          api.get<Hall[]>("/admin/onboarding/halls"),
          api.get<Seat[]>("/admin/onboarding/seats"),
        ]);
        setHalls(hallsData);
        setSeats(seatsData);
      } catch {
        // Non-fatal — an empty starting list is still a usable onboarding step.
      } finally {
        setHallsLoaded(true);
      }
    })();
  }, [step, hallsLoaded]);

  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      const payload: Record<string, string | number | undefined> = {
        alternate_phone: details.alternate_phone || undefined,
        established_year: details.established_year ? Number(details.established_year) : undefined,
        address: details.address || undefined,
        city: details.city || undefined,
        state: details.state || undefined,
        pincode: details.pincode || undefined,
        gst_number: details.gst_number || undefined,
      };
      await api.put("/admin/onboarding/library-details", payload);
      setStep(2);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save those details. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  };

  const addHall = async () => {
    if (!newHallName.trim()) return;
    setAddingHall(true);
    try {
      const hall = await api.post<Hall>("/admin/onboarding/halls", { name: newHallName.trim(), status: "active" });
      setHalls((prev) => [...prev, hall]);
      setSeatHallId(String(hall.id));
      setNewHallName("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't add that hall. Please try again.");
    } finally {
      setAddingHall(false);
    }
  };

  const generateSeats = async () => {
    const start = Number(startNumber);
    const n = Number(count);
    if (!start || !n || n < 1) {
      toast.error("Enter a valid start number and seat count.");
      return;
    }
    setGenerating(true);
    try {
      const created = await api.post<Seat[]>("/admin/onboarding/seats/bulk", {
        hall_id: seatHallId === "none" ? null : Number(seatHallId),
        prefix,
        start,
        end: start + n - 1,
        seat_type: seatType,
        category,
      });
      setSeats((prev) => [...prev, ...created]);
      toast.success(`${created.length} seat${created.length === 1 ? "" : "s"} created.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't generate seats. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const finishOnboarding = async () => {
    setFinishing(true);
    try {
      await api.post("/admin/onboarding/complete");
      await refreshMe();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't finish setup. Please try again.");
      setFinishing(false);
    }
  };

  const seatsByHall = new Map<string, Seat[]>();
  for (const seat of seats) {
    const key = seat.hall_id ? String(seat.hall_id) : "none";
    if (!seatsByHall.has(key)) seatsByHall.set(key, []);
    seatsByHall.get(key)!.push(seat);
  }

  return (
    <div className="min-h-screen w-full bg-lightprimary py-10 px-4">
      <div className="flex justify-center mb-4">
        <FullLogo />
      </div>

      <div className="max-w-3xl mx-auto text-center mb-8">
        <h4 className="text-2xl font-bold text-dark mb-2">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</h4>
        <p className="text-sm text-charcoal">Let&apos;s get {user?.current_tenant?.name ?? "your library"} set up before you pick a plan.</p>
      </div>

      <div className="max-w-3xl mx-auto mb-8 flex items-center justify-center gap-3">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step === n ? "bg-primary text-white" : step > n ? "bg-success text-white" : "bg-white text-darklink"
              }`}
            >
              {step > n ? <Icon icon="tabler:check" width={16} height={16} /> : n}
            </div>
            <span className={`text-sm ${step === n ? "font-semibold text-dark" : "text-darklink"}`}>
              {n === 1 ? "Library Details" : "Library Setup"}
            </span>
            {n === 1 && <div className="h-px w-10 bg-border" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-white dark:bg-darkgray shadow-md p-6 sm:p-8">
          <h5 className="text-lg font-bold text-dark dark:text-white mb-1">Complete your library details</h5>
          <p className="text-sm text-darklink mb-6">All optional — fill in what you have, you can add the rest later.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="alternate_phone">Alternate Phone</Label>
              <Input id="alternate_phone" value={details.alternate_phone} onChange={(e) => setDetails({ ...details, alternate_phone: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="established_year">Established Year</Label>
              <Input
                id="established_year"
                type="number"
                value={details.established_year}
                onChange={(e) => setDetails({ ...details, established_year: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={details.state} onChange={(e) => setDetails({ ...details, state: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={details.pincode} onChange={(e) => setDetails({ ...details, pincode: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input id="gst_number" value={details.gst_number} onChange={(e) => setDetails({ ...details, gst_number: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={saveDetails} disabled={savingDetails} className="flex items-center gap-1.5">
              {savingDetails ? "Saving..." : "Continue"}
              {!savingDetails && <Icon icon="tabler:arrow-right" width={18} height={18} />}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="rounded-2xl bg-white dark:bg-darkgray shadow-md p-6 sm:p-8">
            <h5 className="text-lg font-bold text-dark dark:text-white mb-1">Set up Halls (optional)</h5>
            <p className="text-sm text-darklink mb-4">
              Add as many Halls as you need — or skip this and create seats directly below without a Hall.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {halls.map((hall) => (
                <span
                  key={hall.id}
                  className="flex items-center gap-1.5 rounded-full bg-lightprimary text-primary px-3 py-1.5 text-sm font-medium"
                >
                  <Icon icon="solar:home-2-bold-duotone" width={16} height={16} />
                  {hall.name}
                </span>
              ))}
              {hallsLoaded && halls.length === 0 && <p className="text-sm text-gray-500">No halls added yet.</p>}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. Ground Floor Hall"
                value={newHallName}
                onChange={(e) => setNewHallName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHall())}
              />
              <Button type="button" onClick={addHall} disabled={addingHall || !newHallName.trim()} className="flex items-center gap-1.5 shrink-0">
                <Icon icon="solar:add-circle-linear" width={18} height={18} />
                {addingHall ? "Adding..." : "Add Hall"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-darkgray shadow-md p-6 sm:p-8">
            <h5 className="text-lg font-bold text-dark dark:text-white mb-1">Generate Seats (optional)</h5>
            <p className="text-sm text-darklink mb-4">
              Pick a prefix and count — seats are numbered automatically (e.g. A1, A2, A3…).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                <Label>Hall</Label>
                <Select value={seatHallId} onValueChange={setSeatHallId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Hall (unassigned)</SelectItem>
                    {halls.map((hall) => (
                      <SelectItem key={hall.id} value={String(hall.id)}>{hall.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="A" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="start">Start #</Label>
                <Input id="start" type="number" min={1} value={startNumber} onChange={(e) => setStartNumber(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="count">How many seats?</Label>
                <Input id="count" type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Seat Type</Label>
                <Select value={seatType} onValueChange={(v) => setSeatType(v as SeatType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEAT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as SeatCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEAT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-darklink mb-4">
              Preview: {prefix || "—"}{startNumber || "1"}, {prefix || "—"}{startNumber && count ? Number(startNumber) + 1 : "2"}, … {prefix || "—"}
              {startNumber && count ? Number(startNumber) + Number(count) - 1 : "10"}
            </p>

            <Button type="button" onClick={generateSeats} disabled={generating} className="flex items-center gap-1.5">
              <Icon icon="solar:widget-add-linear" width={18} height={18} />
              {generating ? "Generating..." : "Generate Seats"}
            </Button>

            {seats.length > 0 && (
              <div className="mt-6 flex flex-col gap-4">
                {Array.from(seatsByHall.entries()).map(([hallId, hallSeats]) => (
                  <div key={hallId}>
                    <p className="text-xs font-semibold text-darklink mb-2">
                      {hallId === "none" ? "No Hall" : halls.find((h) => String(h.id) === hallId)?.name ?? "Hall"} · {hallSeats.length} seats
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hallSeats.map((seat) => (
                        <span key={seat.id} className="rounded-lg bg-lightsuccess text-success px-2.5 py-1 text-xs font-semibold">
                          {seat.seat_number}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex items-center gap-1.5">
              <Icon icon="tabler:arrow-left" width={18} height={18} />
              Back
            </Button>
            <Button onClick={finishOnboarding} disabled={finishing} className="flex items-center gap-1.5">
              {finishing ? "Finishing..." : "Next: Plan & Pricing"}
              {!finishing && <Icon icon="tabler:arrow-right" width={18} height={18} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
