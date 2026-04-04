export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type EndCondition = "never" | "count" | "until";
export type DayOfWeek = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

// Intra-day timing modes
export type IntradayMode =
  | "single" // One specific time (current behavior)
  | "anytime" // X times per day, no specific times
  | "specific_times" // Multiple specific times
  | "interval" // Every X minutes between start-end
  | "window"; // Sometime within a time range

export interface RecurrenceState {
  frequency: Frequency;
  interval: number;
  byDay: DayOfWeek[];
  endCondition: EndCondition;
  count: number;
  until: string;
  // Intra-day timing
  intradayMode: IntradayMode;
  specificTimes: string[]; // Array of "HH:MM" for specific_times mode
  intervalMinutes: number; // For interval mode
  windowStart: string; // "HH:MM" for interval/window modes
  windowEnd: string; // "HH:MM" for interval/window modes
  dailyOccurrences: number; // For anytime mode or interval max
}

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: "MO", label: "Mon" },
  { key: "TU", label: "Tue" },
  { key: "WE", label: "Wed" },
  { key: "TH", label: "Thu" },
  { key: "FR", label: "Fri" },
  { key: "SA", label: "Sat" },
  { key: "SU", label: "Sun" },
];

export const FREQUENCIES: { key: Frequency; label: string; plural: string }[] =
  [
    { key: "DAILY", label: "Day", plural: "days" },
    { key: "WEEKLY", label: "Week", plural: "weeks" },
    { key: "MONTHLY", label: "Month", plural: "months" },
    { key: "YEARLY", label: "Year", plural: "years" },
  ];

export const parseRRule = (rrule: string | undefined): RecurrenceState => {
  const defaults: RecurrenceState = {
    frequency: "DAILY",
    interval: 1,
    byDay: [],
    endCondition: "never",
    count: 0,
    until: "",
    intradayMode: "single",
    specificTimes: [],
    intervalMinutes: 30,
    windowStart: "09:00",
    windowEnd: "21:00",
    dailyOccurrences: 1,
  };

  if (!rrule) return defaults;

  const parts = rrule.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    frequency: (parts.FREQ as Frequency) || "DAILY",
    interval: parseInt(parts.INTERVAL || "1", 10),
    byDay: parts.BYDAY ? (parts.BYDAY.split(",") as DayOfWeek[]) : [],
    endCondition: parts.COUNT ? "count" : parts.UNTIL ? "until" : "never",
    count: parseInt(parts.COUNT || "0", 10),
    until: parts.UNTIL || "",
    // Intra-day fields (custom extensions with X- prefix)
    intradayMode: (parts["X-INTRADAY"] as IntradayMode) || "single",
    specificTimes: parts["X-TIMES"] ? parts["X-TIMES"].split(",") : [],
    intervalMinutes: parseInt(parts["X-INTERVALMIN"] || "30", 10),
    windowStart: parts["X-WINSTART"] || "09:00",
    windowEnd: parts["X-WINEND"] || "21:00",
    dailyOccurrences: parseInt(parts["X-DAILYOCC"] || "1", 10),
  };
};

export const buildRRule = (state: RecurrenceState): string => {
  const parts: string[] = [`FREQ=${state.frequency}`];

  if (state.interval > 1) {
    parts.push(`INTERVAL=${state.interval}`);
  }

  if (state.frequency === "WEEKLY" && state.byDay.length > 0) {
    parts.push(`BYDAY=${state.byDay.join(",")}`);
  }

  if (state.endCondition === "count" && state.count > 0) {
    parts.push(`COUNT=${state.count}`);
  } else if (state.endCondition === "until" && state.until) {
    parts.push(`UNTIL=${state.until}`);
  }

  // Intra-day fields (custom extensions)
  if (state.intradayMode !== "single") {
    parts.push(`X-INTRADAY=${state.intradayMode}`);

    if (
      state.intradayMode === "specific_times" &&
      state.specificTimes.length > 0
    ) {
      parts.push(`X-TIMES=${state.specificTimes.join(",")}`);
    }

    if (state.intradayMode === "interval") {
      parts.push(`X-INTERVALMIN=${state.intervalMinutes}`);
      parts.push(`X-WINSTART=${state.windowStart}`);
      parts.push(`X-WINEND=${state.windowEnd}`);
      if (state.dailyOccurrences > 0) {
        parts.push(`X-DAILYOCC=${state.dailyOccurrences}`);
      }
    }

    if (state.intradayMode === "window") {
      parts.push(`X-WINSTART=${state.windowStart}`);
      parts.push(`X-WINEND=${state.windowEnd}`);
    }

    if (state.intradayMode === "anytime" && state.dailyOccurrences > 0) {
      parts.push(`X-DAILYOCC=${state.dailyOccurrences}`);
    }
  }

  return parts.join(";");
};

export const getFrequencyDescription = (state: RecurrenceState): string => {
  const freq = FREQUENCIES.find((f) => f.key === state.frequency);
  if (!freq) return "Custom";

  let desc =
    state.interval === 1
      ? `Every ${freq.label.toLowerCase()}`
      : `Every ${state.interval} ${freq.plural}`;

  if (state.frequency === "WEEKLY" && state.byDay.length > 0) {
    const dayLabels = state.byDay
      .map((d) => DAYS_OF_WEEK.find((dw) => dw.key === d)?.label)
      .filter(Boolean);
    desc += ` on ${dayLabels.join(", ")}`;
  }

  // For intra-day modes with multiple occurrences per day, show count as "recurrences" after frequency
  const hasMultipleDaily =
    state.intradayMode === "interval" ||
    state.intradayMode === "window" ||
    state.intradayMode === "anytime" ||
    state.intradayMode === "specific_times";

  if (state.endCondition === "count" && hasMultipleDaily) {
    desc +=
      state.count > 0 ? ` (${state.count} recurrences)` : ` (X recurrences)`;
  }

  // Intra-day timing description
  if (state.intradayMode === "anytime" && state.dailyOccurrences > 0) {
    desc += `, ${state.dailyOccurrences}x per day`;
  } else if (
    state.intradayMode === "specific_times" &&
    state.specificTimes.length > 0
  ) {
    const formatted = state.specificTimes.map(formatTime12h).join(", ");
    desc += ` at ${formatted}`;
  } else if (state.intradayMode === "interval") {
    desc += `, every ${state.intervalMinutes}min`;
    desc += ` ${formatTime12h(state.windowStart)}-${formatTime12h(state.windowEnd)}`;
    if (state.dailyOccurrences > 0) {
      desc += ` (max ${state.dailyOccurrences}x)`;
    }
  } else if (state.intradayMode === "window") {
    desc += `, between ${formatTime12h(state.windowStart)}-${formatTime12h(state.windowEnd)}`;
  }

  // For single-occurrence modes, show count at the end as "times"
  if (state.endCondition === "count" && !hasMultipleDaily) {
    desc +=
      state.count > 0 ? `, ${state.count} times total` : `, X times total`;
  } else if (state.endCondition === "until" && state.until) {
    // Format date nicely
    const [y, m, d] = state.until.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = parseInt(m, 10) - 1;
    const formattedDate = `${months[monthIndex]} ${parseInt(d, 10)}, ${y}`;
    desc += `, until ${formattedDate}`;
  } else if (state.endCondition === "until") {
    desc += `, until [date]`;
  }

  return desc;
};

// Helper to format time as 12h
const formatTime12h = (time: string): string => {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "pm" : "am";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${minute}${ampm}`;
};
