/** Convert API field `validity_window_minutes` to day/hour/minute parts for UI. */
export const MINUTES_PER_DAY = 1440;
export const MINUTES_PER_HOUR = 60;

export interface ValidityWindowParts {
  days: number;
  hours: number;
  minutes: number;
}

export function totalMinutesToParts(total: number | null): ValidityWindowParts {
  if (total === null || total < 1) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  return {
    days: Math.floor(total / MINUTES_PER_DAY),
    hours: Math.floor((total % MINUTES_PER_DAY) / MINUTES_PER_HOUR),
    minutes: total % MINUTES_PER_HOUR,
  };
}

/** Returns null when total is less than 1 (use server default for window). */
export function partsToTotalMinutes(parts: ValidityWindowParts): number | null {
  const d = Math.max(0, Math.floor(parts.days));
  const h = Math.max(0, Math.floor(parts.hours));
  const m = Math.max(0, Math.floor(parts.minutes));
  const total = d * MINUTES_PER_DAY + h * MINUTES_PER_HOUR + m;
  if (total < 1) {
    return null;
  }
  return total;
}

/** Empty or non-numeric → 0 for combining; negative or NaN → 0. */
export function parseWindowPartText(text: string): number {
  const t = text.trim();
  if (t === "") {
    return 0;
  }
  const n = parseInt(t, 10);
  if (Number.isNaN(n) || n < 0) {
    return 0;
  }
  return n;
}

/** String values for controlled inputs when a custom window is set (show zeros). */
export function partsToInputStrings(total: number | null): {
  days: string;
  hours: string;
  minutes: string;
} {
  if (total === null || total < 1) {
    return { days: "", hours: "", minutes: "" };
  }
  const p = totalMinutesToParts(total);
  return {
    days: String(p.days),
    hours: String(p.hours),
    minutes: String(p.minutes),
  };
}
