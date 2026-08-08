"use client";

import SearchableSelect from "./SearchableSelect";
import { currencies } from "@/data/currencies";

interface CurrencySelectProps {
  value: string;
  onChange: (code: string, currency: (typeof currencies)[number]) => void;
  id?: string;
}

export default function CurrencySelect({ value, onChange, id }: CurrencySelectProps) {
  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={(code) => {
        const currency = currencies.find((c) => c.code === code);
        if (currency) onChange(code, currency);
      }}
      options={currencies.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}`, description: c.name }))}
      placeholder="Select currency"
      searchPlaceholder="Search currencies..."
    />
  );
}
