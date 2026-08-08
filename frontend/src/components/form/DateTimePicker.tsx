"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";

interface DateTimePickerProps {
  value?: string; // 'YYYY-MM-DDTHH:mm'
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function parseValue(value?: string): { date?: Date; time: string } {
  if (!value) return { time: "00:00" };
  const [datePart, timePart] = value.split("T");
  const date = datePart ? new Date(datePart + "T00:00:00") : undefined;
  return { date: date && !isNaN(date.getTime()) ? date : undefined, time: timePart?.slice(0, 5) || "00:00" };
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time", disabled, id }: DateTimePickerProps) {
  const { date, time } = parseValue(value);

  const setDate = (newDate: Date) => onChange(`${toDatePart(newDate)}T${time}`);
  const setTime = (newTime: string) => onChange(`${date ? toDatePart(date) : ""}T${newTime}`);

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" disabled={disabled} className="flex-1 justify-start font-normal">
            <Icon icon="tabler:calendar" width={16} height={16} className="mr-2 shrink-0" />
            {date ? date.toLocaleDateString() : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        disabled={disabled}
        className="w-32"
      />
    </div>
  );
}
