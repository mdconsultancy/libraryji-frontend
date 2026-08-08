"use client";

import SearchableSelect from "./SearchableSelect";
import { Input } from "@/components/ui/input";
import { indianStates } from "@/data/countries";

interface StateSelectProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  id?: string;
}

/** Searchable dropdown of Indian states/UTs (this product is India-first); falls back to free text for other countries since no full state dataset is bundled. */
export default function StateSelect({ value, onChange, country, id }: StateSelectProps) {
  if (country && country !== "India") {
    return (
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="State / Province" />
    );
  }

  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      options={indianStates.map((s) => ({ value: s, label: s }))}
      placeholder="Select state"
      searchPlaceholder="Search states..."
    />
  );
}
