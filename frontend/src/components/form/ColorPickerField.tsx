"use client";

import { Input } from "@/components/ui/input";

interface ColorPickerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
}

export default function ColorPickerField({ id, value, onChange, placeholder = "#5D87FF" }: ColorPickerFieldProps) {
  const swatch = isValidHex(value) ? value : "#ffffff";

  return (
    <div className="flex items-center gap-2">
      <label className="relative shrink-0 h-9 w-9 rounded-md border border-border overflow-hidden cursor-pointer" style={{ backgroundColor: swatch }}>
        <input
          type="color"
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
        />
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
    </div>
  );
}
