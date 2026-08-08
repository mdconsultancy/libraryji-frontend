"use client";

import SearchableSelect from "./SearchableSelect";
import { countries } from "@/data/countries";

interface CountrySelectProps {
  value: string; // country name
  onChange: (name: string) => void;
  id?: string;
}

export default function CountrySelect({ value, onChange, id }: CountrySelectProps) {
  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      options={countries.map((c) => ({ value: c.name, label: c.name }))}
      placeholder="Select country"
      searchPlaceholder="Search countries..."
    />
  );
}
