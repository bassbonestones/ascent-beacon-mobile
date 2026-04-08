/**
 * Storage helpers for Time Machine state persistence.
 * Uses SecureStore on native, localStorage on web.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export async function getStoredValue(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

export async function setStoredValue(
  key: string,
  value: string,
): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

/**
 * Get the current date/time adjusted to a specific timezone.
 * Returns a Date object whose local getters (getDate, getHours, etc.)
 * return values as they would appear in the target timezone.
 *
 * @param baseDate - The base date (defaults to now)
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Date adjusted to the target timezone
 */
export function getDateInTimezone(baseDate: Date, timezone: string): Date {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(baseDate);
    const get = (type: string): number =>
      parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

    // Construct a Date from the timezone-adjusted components
    return new Date(
      get("year"),
      get("month") - 1, // JS months are 0-indexed
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
  } catch {
    // Fallback if Intl fails
    return baseDate;
  }
}
