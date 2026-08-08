"use client";

import SearchableSelect from "./SearchableSelect";
import { languages } from "@/data/languages";

interface LanguageSelectProps {
  value: string;
  onChange: (code: string) => void;
  id?: string;
}

export default function LanguageSelect({ value, onChange, id }: LanguageSelectProps) {
  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      options={languages.map((l) => ({ value: l.code, label: l.name }))}
      placeholder="Select language"
      searchPlaceholder="Search languages..."
    />
  );
}
