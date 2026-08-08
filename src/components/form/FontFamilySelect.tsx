"use client";

import SearchableSelect from "./SearchableSelect";
import { fontFamilies } from "@/data/fonts";

interface FontFamilySelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export default function FontFamilySelect({ value, onChange, id }: FontFamilySelectProps) {
  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      options={fontFamilies.map((f) => ({ value: f, label: f }))}
      placeholder="Select font family"
      searchPlaceholder="Search fonts..."
    />
  );
}
