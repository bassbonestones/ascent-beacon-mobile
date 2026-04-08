import { toLocalDateString } from "../../utils/taskSorting";

// State for each occurrence: none | completed | skipped
// mixed is only for aggregate display (week/day/month), never set directly
export type OccurrenceState = "none" | "completed" | "skipped" | "mixed";

// Key format: "YYYY-MM-DD:occIdx" e.g. "2026-04-08:0", "2026-04-08:1"
export type OccurrenceStates = Record<string, OccurrenceState>;

// Colors for states
export const STATE_COLORS = {
  none: "#E5E7EB", // gray
  completed: "#22C55E", // green
  skipped: "#F97316", // orange
  mixed: "#EAB308", // yellow
};

export const STATE_LABELS = {
  none: "None",
  completed: "Done",
  skipped: "Skip",
  mixed: "Mixed",
};

// Day of week labels
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Cycle to next state (mixed cycles to completed since it's aggregate-only)
export function cycleState(current: OccurrenceState): OccurrenceState {
  if (current === "none") return "completed";
  if (current === "completed") return "skipped";
  if (current === "mixed") return "completed";
  return "none";
}

// Get week number for a date (Monday start)
export function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return toLocalDateString(d);
}

// Get week label - always show date range
export function getWeekLabel(
  weekStart: string,
  days: { date: string }[],
): string {
  const firstDate = new Date(days[0].date + "T00:00:00");
  const lastDate = new Date(days[days.length - 1].date + "T00:00:00");

  const firstMonth = firstDate.toLocaleDateString("en-US", { month: "short" });
  const lastMonth = lastDate.toLocaleDateString("en-US", { month: "short" });

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${firstDate.getDate()} - ${lastDate.getDate()}`;
  }
  return `${firstMonth} ${firstDate.getDate()} - ${lastMonth} ${lastDate.getDate()}`;
}

// Get month label
export function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
