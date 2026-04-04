export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type EndCondition = "never" | "count" | "until";
export type DayOfWeek = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export interface RecurrenceState {
  frequency: Frequency;
  interval: number;
  byDay: DayOfWeek[];
  endCondition: EndCondition;
  count: number;
  until: string;
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

  if (state.endCondition === "count") {
    desc += state.count > 0 ? `, ${state.count} times` : `, X times`;
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
