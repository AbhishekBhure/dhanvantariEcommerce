"use client";

import { ChangeEvent } from "react";

export function PhoneField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value.replace(/\D/g, "").slice(0, 10));
  }

  return (
    <div>
      <div className={`flex h-11 overflow-hidden rounded-lg border bg-white ${error ? "border-destructive" : "border-input"}`}>
        <div className="flex items-center gap-2 border-r border-input px-3 text-sm text-foreground" aria-label="Country India">
          <span aria-hidden="true" className="text-lg leading-none">🇮🇳</span>
          <span className="font-medium">+91</span>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          maxLength={10}
          pattern="[6-9][0-9]{9}"
          value={value}
          onChange={handleChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder="Enter 10-digit mobile number"
          className="min-w-0 flex-1 px-3 text-sm outline-none"
        />
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
