"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const HAS_KEY = !!API_KEY && API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";

interface Suggestion {
  placeId: string;
  text: string;
  secondaryText: string;
}

async function fetchSuggestions(input: string): Promise<Suggestion[]> {
  if (!HAS_KEY || input.length < 3) return [];

  const res = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
      },
      body: JSON.stringify({ input }),
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.suggestions ?? [])
    .filter((s: Record<string, unknown>) => s.placePrediction)
    .map(
      (s: {
        placePrediction: {
          placeId: string;
          text: { text: string };
          structuredFormat?: {
            mainText: { text: string };
            secondaryText?: { text: string };
          };
        };
      }) => ({
        placeId: s.placePrediction.placeId,
        text: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text.text,
        secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text ?? "",
      })
    )
    .slice(0, 5);
}

async function getPlaceAddress(placeId: string): Promise<string> {
  if (!HAS_KEY) return "";

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=formattedAddress,displayName`,
    {
      headers: {
        "X-Goog-Api-Key": API_KEY,
      },
    }
  );

  if (!res.ok) return "";
  const data = await res.json();
  return data.formattedAddress || data.displayName?.text || "";
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export function LocationPicker({
  value,
  onChange,
  id,
  placeholder = "Search for a location...",
}: LocationPickerProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (val.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const results = await fetchSuggestions(val);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      }, 300);
    },
    [onChange]
  );

  async function handleSelect(suggestion: Suggestion) {
    setShowDropdown(false);
    setSuggestions([]);
    const address = await getPlaceAddress(suggestion.placeId);
    onChange(address || `${suggestion.text}, ${suggestion.secondaryText}`);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || !HAS_KEY) {
      setEmbedUrl(null);
      return;
    }
    const q = encodeURIComponent(value);
    setEmbedUrl(
      `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${q}&zoom=15`
    );
  }, [value]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative">
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          autoComplete="off"
        />

        {showDropdown && (
          <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border border-border/60 bg-popover shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {s.text}
                  </p>
                  {s.secondaryText && (
                    <p className="truncate text-xs text-muted-foreground">
                      {s.secondaryText}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {embedUrl && (
        <div className="overflow-hidden rounded-md border border-border/60">
          <iframe
            title="Location preview"
            src={embedUrl}
            className="h-40 w-full"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

export function LocationPreview({ location }: { location: string }) {
  if (!location || !HAS_KEY) return null;

  const q = encodeURIComponent(location);
  const src = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${q}&zoom=15`;

  return (
    <div className="overflow-hidden rounded-md border border-border/60">
      <iframe
        title="Event location"
        src={src}
        className="h-32 w-full"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
