"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import SearchableSelect from "./SearchableSelect";
import { countries } from "@/data/countries";

interface PhoneInputProps {
  value: string; // stored as "+91 9876543210"
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
}

function splitValue(value: string): { dialCode: string; number: string } {
  const match = value.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) return { dialCode: match[1], number: match[2] };
  return { dialCode: "+91", number: value };
}

export default function PhoneInput({ value, onChange, id, required }: PhoneInputProps) {
  const { dialCode, number } = splitValue(value || "+91 ");

  const dialOptions = useMemo(
    () =>
      Array.from(new Map(countries.map((c) => [c.dialCode, c])).values()).map((c) => ({
        value: c.dialCode,
        label: `${c.dialCode} ${c.name}`,
      })),
    []
  );

  return (
    <div className="flex gap-2">
      <div className="w-32 shrink-0">
        <SearchableSelect
          value={dialCode}
          onChange={(code) => onChange(`${code} ${number}`)}
          options={dialOptions}
          placeholder="Code"
          searchPlaceholder="Search..."
        />
      </div>
      <Input
        id={id}
        type="tel"
        value={number}
        required={required}
        placeholder="Phone number"
        onChange={(e) => onChange(`${dialCode} ${e.target.value.replace(/[^\d]/g, "")}`)}
        className="flex-1"
      />
    </div>
  );
}
