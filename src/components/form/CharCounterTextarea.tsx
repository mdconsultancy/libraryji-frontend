"use client";

import { Textarea } from "@/components/ui/textarea";

interface CharCounterTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  rows?: number;
}

export default function CharCounterTextarea({ id, value, onChange, maxLength, placeholder, rows }: CharCounterTextareaProps) {
  return (
    <div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
      <p className="text-xs text-gray-500 mt-1 text-right">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
