const DIGITS = /\D/g;

/** Strips all non-digits for database storage. */
export function phoneDigitsOnly(input: string): string {
  return input.replace(DIGITS, "");
}

/**
 * Normalizes to digits only (optionally strips leading US country code 1).
 */
export function normalizePhoneDigits(input: string): string {
  const d = phoneDigitsOnly(input);
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
}

/**
 * US-style display: (XXX) XXX-XXXX when 10 digits; otherwise returns trimmed original if non-empty.
 */
export function formatPhoneDisplay(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const digits = normalizePhoneDigits(trimmed);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length > 0 && digits.length < 10) {
    return trimmed;
  }

  if (digits.length > 10) {
    return trimmed;
  }

  return trimmed;
}
