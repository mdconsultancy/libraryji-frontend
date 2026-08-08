"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  showStrength?: boolean;
}

function strengthOf(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "bg-gray-200" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-error" };
  if (score <= 3) return { score, label: "Fair", color: "bg-warning" };
  return { score, label: "Strong", color: "bg-success" };
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  autoComplete = "new-password",
  showStrength = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = strengthOf(value);

  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-darklink hover:text-primary"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon icon={visible ? "tabler:eye-off" : "tabler:eye"} width={18} height={18} />
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-1.5">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : "bg-gray-200 dark:bg-gray-700"}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
        </div>
      )}
    </div>
  );
}
