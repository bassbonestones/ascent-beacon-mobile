/**
 * Utilities for displaying human-readable recurrence descriptions.
 */

/**
 * Converts an RRULE string to a human-readable description.
 * Examples:
 *   - "FREQ=DAILY" -> "Daily"
 *   - "FREQ=WEEKLY;BYDAY=MO,WE,FR" -> "Mon, Wed, Fri"
 *   - "FREQ=DAILY;INTERVAL=2" -> "Every 2 days"
 *
 * @param rrule The iCal RRULE string (e.g., "FREQ=DAILY;INTERVAL=1")
 * @returns Human-readable description
 */
export const getRecurrenceDescription = (rrule: string | null): string => {
  if (!rrule) return "Not set";

  const parts = rrule.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const freq = parts.FREQ || "DAILY";
  const interval = parseInt(parts.INTERVAL || "1", 10);

  const freqLabels: Record<string, string[]> = {
    DAILY: ["day", "days"],
    WEEKLY: ["week", "weeks"],
    MONTHLY: ["month", "months"],
    YEARLY: ["year", "years"],
  };

  const [singular, plural] = freqLabels[freq] || ["time", "times"];

  // Simple "Daily", "Weekly", etc. for interval=1 without BYDAY
  if (interval === 1 && !parts.BYDAY) {
    const simpleLabels: Record<string, string> = {
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      YEARLY: "Yearly",
    };
    return simpleLabels[freq] || `Every ${singular}`;
  }

  let desc =
    interval === 1 ? `Every ${singular}` : `Every ${interval} ${plural}`;

  if (parts.BYDAY) {
    const dayMap: Record<string, string> = {
      MO: "Mon",
      TU: "Tue",
      WE: "Wed",
      TH: "Thu",
      FR: "Fri",
      SA: "Sat",
      SU: "Sun",
    };
    const days = parts.BYDAY.split(",")
      .map((d) => dayMap[d] || d)
      .join(", ");
    // For weekly with specific days, just show the days
    if (freq === "WEEKLY" && interval === 1) {
      return days;
    }
    desc += ` on ${days}`;
  }

  return desc;
};

/**
 * Returns a short label for the recurrence (for compact display).
 * Examples:
 *   - "FREQ=DAILY" -> "Daily"
 *   - "FREQ=WEEKLY;BYDAY=MO,WE,FR" -> "3x/week"
 *
 * @param rrule The iCal RRULE string
 * @returns Short label
 */
export const getRecurrenceShortLabel = (rrule: string | null): string => {
  if (!rrule) return "";

  const parts = rrule.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const freq = parts.FREQ || "DAILY";
  const interval = parseInt(parts.INTERVAL || "1", 10);

  if (parts.BYDAY) {
    const dayCount = parts.BYDAY.split(",").length;
    if (freq === "WEEKLY" && interval === 1) {
      if (dayCount === 7) return "Daily";
      return `${dayCount}x/week`;
    }
  }

  if (interval === 1) {
    const labels: Record<string, string> = {
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      YEARLY: "Yearly",
    };
    return labels[freq] || "";
  }

  return `${interval}x`;
};
