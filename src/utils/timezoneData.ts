/**
 * Timezone data for Time Machine timezone override.
 * Provides common timezones with UTC offsets and region names.
 */

export interface TimezoneOption {
  /** IANA timezone identifier (e.g., "America/New_York") */
  id: string;
  /** Display label with UTC offset (e.g., "UTC-5 Eastern") */
  label: string;
  /** Numeric offset from UTC in hours (for sorting) */
  offset: number;
}

/**
 * Common timezones sorted by UTC offset.
 * Covers major regions: Americas, Europe, Asia, Pacific, UTC.
 */
export const TIMEZONES: TimezoneOption[] = [
  // UTC
  { id: "UTC", label: "UTC+0 UTC", offset: 0 },

  // Americas (West to East)
  { id: "Pacific/Honolulu", label: "UTC-10 Hawaii", offset: -10 },
  { id: "America/Anchorage", label: "UTC-9 Alaska", offset: -9 },
  { id: "America/Los_Angeles", label: "UTC-8 Pacific", offset: -8 },
  { id: "America/Denver", label: "UTC-7 Mountain", offset: -7 },
  { id: "America/Chicago", label: "UTC-6 Central", offset: -6 },
  { id: "America/New_York", label: "UTC-5 Eastern", offset: -5 },
  { id: "America/Sao_Paulo", label: "UTC-3 São Paulo", offset: -3 },

  // Europe & Africa
  { id: "Europe/London", label: "UTC+0 London", offset: 0 },
  { id: "Europe/Paris", label: "UTC+1 Paris", offset: 1 },
  { id: "Europe/Berlin", label: "UTC+1 Berlin", offset: 1 },
  { id: "Europe/Moscow", label: "UTC+3 Moscow", offset: 3 },

  // Middle East & South Asia
  { id: "Asia/Dubai", label: "UTC+4 Dubai", offset: 4 },
  { id: "Asia/Kolkata", label: "UTC+5:30 India", offset: 5.5 },

  // East Asia & Pacific
  { id: "Asia/Singapore", label: "UTC+8 Singapore", offset: 8 },
  { id: "Asia/Shanghai", label: "UTC+8 China", offset: 8 },
  { id: "Asia/Tokyo", label: "UTC+9 Tokyo", offset: 9 },
  { id: "Australia/Sydney", label: "UTC+10 Sydney", offset: 10 },
  { id: "Pacific/Auckland", label: "UTC+12 Auckland", offset: 12 },
];

/**
 * Get the device's current timezone identifier.
 * Returns IANA timezone like "America/New_York".
 */
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback if Intl is not available
    return "UTC";
  }
}

/**
 * Get a display label for a timezone.
 * If the timezone is in our list, returns its label.
 * Otherwise, formats it as "UTC±X [Zone Name]".
 */
export function getTimezoneLabel(timezoneId: string | null): string {
  if (!timezoneId) {
    const deviceTz = getDeviceTimezone();
    const found = TIMEZONES.find((tz) => tz.id === deviceTz);
    return found ? `Device (${found.label})` : `Device (${deviceTz})`;
  }

  const found = TIMEZONES.find((tz) => tz.id === timezoneId);
  if (found) {
    return found.label;
  }

  // For unknown timezones, try to compute offset
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezoneId,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "";
    return `${tzName} (${timezoneId})`;
  } catch {
    return timezoneId;
  }
}

/**
 * Get the UTC offset in minutes for a timezone at a given date.
 * Positive = ahead of UTC, negative = behind UTC.
 */
export function getTimezoneOffsetMinutes(
  timezoneId: string,
  date: Date = new Date(),
): number {
  try {
    // Get local time in the target timezone
    const tzDate = new Date(
      date.toLocaleString("en-US", { timeZone: timezoneId }),
    );
    // Get UTC time
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    // Difference in minutes
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
}

/**
 * Format a timezone offset for display (e.g., "+5:30" or "-8").
 */
export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  if (mins === 0) {
    return `${sign}${hours}`;
  }
  return `${sign}${hours}:${mins.toString().padStart(2, "0")}`;
}
