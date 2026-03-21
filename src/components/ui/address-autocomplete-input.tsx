"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

type Suggestion = {
  placeId: string;
  text: string;
  secondaryText?: string;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  invalid?: boolean;
};

function createSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AddressAutocompleteInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  invalid = false,
}: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sessionToken, setSessionToken] = useState(createSessionToken());
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/address-autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: trimmedQuery,
            sessionToken,
          }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Autocomplete mislukt");
        }

        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [trimmedQuery, sessionToken]);

  function handleSelect(suggestion: Suggestion) {
    // Belangrijk: niet secondaryText er nog eens achter plakken
    // omdat Google text vaak al als volledig leesbaar adres teruggeeft.
    setQuery(suggestion.text);
    onChange(suggestion.text);
    setOpen(false);
    setSuggestions([]);
    setSessionToken(createSessionToken());
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0f1720]">
        <MapPin className="h-4 w-4 text-[#0b5a4e]" />
        {label}
        {required ? (
          <span className="rounded-full bg-[#f4c542]/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#0b5a4e]">
            Verplicht
          </span>
        ) : null}
      </label>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={invalid}
          className={[
            "w-full rounded-2xl border bg-white px-4 py-4 pr-12 outline-none transition focus:ring-4",
            invalid
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
              : "border-[#d6d9df] focus:border-[#0b5a4e] focus:ring-[#0b5a4e]/10",
          ].join(" ")}
        />

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0b5a4e]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white p-2 shadow-[0_20px_60px_rgba(15,23,32,0.12)]">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-[#f8fafc]"
            >
              <p className="font-semibold text-[#0f1720]">{suggestion.text}</p>
              {suggestion.secondaryText ? (
                <p className="mt-1 text-sm text-[#64748b]">
                  {suggestion.secondaryText}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
