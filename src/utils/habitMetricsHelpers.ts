import type { DailyCompletionStatus } from "../types";

/**
 * Get color based on completion rate.
 */
export function getCompletionColor(rate: number): string {
  if (rate >= 0.8) return "#4CAF50";
  if (rate >= 0.5) return "#FF9800";
  return "#F44336";
}

/**
 * Get icon for day status.
 */
export function getDayIcon(status: DailyCompletionStatus["status"]): string {
  switch (status) {
    case "completed":
      return "⭐";
    case "skipped":
      return "⏭️";
    case "missed":
      return "❌";
    case "partial":
      return "◐";
    default:
      return "";
  }
}

/**
 * Get style object for day cell based on status.
 */
export function getDayCellStyle(
  status: DailyCompletionStatus["status"],
): object {
  switch (status) {
    case "completed":
      return { backgroundColor: "#E8F5E9" };
    case "skipped":
      return { backgroundColor: "#FFF3E0" };
    case "missed":
      return { backgroundColor: "#FFEBEE" };
    case "partial":
      return { backgroundColor: "#E3F2FD" };
    default:
      return {};
  }
}

/**
 * Group days by week for calendar display.
 * Pads incomplete weeks with nulls.
 */
export function groupDaysByWeek(
  days: DailyCompletionStatus[],
): (DailyCompletionStatus | null)[][] {
  if (days.length === 0) return [];

  const result: (DailyCompletionStatus | null)[][] = [];
  const firstDate = new Date(days[0].date);
  const startOfWeek = firstDate.getDay(); // 0 = Sunday

  // Pad the first week with nulls
  let currentWeek: (DailyCompletionStatus | null)[] =
    Array(startOfWeek).fill(null);

  for (const day of days) {
    if (currentWeek.length === 7) {
      result.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }

  // Pad the last week with nulls
  while (currentWeek.length < 7) {
    currentWeek.push(null);
  }
  result.push(currentWeek);

  return result;
}

export interface WeeklyDataPoint {
  label: string;
  rate: number;
  completed: number;
  total: number;
}

/**
 * Calculate weekly summary data for bar chart.
 */
export function calculateWeeklyData(
  days: DailyCompletionStatus[],
): WeeklyDataPoint[] {
  if (days.length === 0) return [];

  const weeks: WeeklyDataPoint[] = [];
  let weekStart = new Date(days[0].date);
  let weekCompleted = 0;
  let weekTotal = 0;

  for (const day of days) {
    const dayDate = new Date(day.date);
    const weekDiff = Math.floor(
      (dayDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );

    if (weekDiff > 0) {
      // Save current week
      weeks.push({
        label: formatWeekLabel(weekStart),
        rate: weekTotal > 0 ? weekCompleted / weekTotal : 0,
        completed: weekCompleted,
        total: weekTotal,
      });
      // Start new week
      weekStart = new Date(dayDate);
      weekCompleted = 0;
      weekTotal = 0;
    }

    if (day.status === "completed") weekCompleted++;
    weekTotal++;
  }

  // Don't forget the last week
  if (weekTotal > 0) {
    weeks.push({
      label: formatWeekLabel(weekStart),
      rate: weekCompleted / weekTotal,
      completed: weekCompleted,
      total: weekTotal,
    });
  }

  return weeks;
}

/**
 * Calculate 10-day chunk data for 90-day bar chart (9 bars).
 */
export function calculateTenDayChunkData(
  days: DailyCompletionStatus[],
): WeeklyDataPoint[] {
  if (days.length === 0) return [];

  const chunks: WeeklyDataPoint[] = [];
  const chunkSize = 10;

  for (let i = 0; i < days.length; i += chunkSize) {
    const chunkDays = days.slice(i, i + chunkSize);
    if (chunkDays.length === 0) continue;

    const completed = chunkDays.filter((d) => d.status === "completed").length;
    const total = chunkDays.length;
    const startDate = new Date(chunkDays[0].date);
    const endDate = new Date(chunkDays[chunkDays.length - 1].date);

    // Format as "1/6-\n1/15" (two lines: start and end)
    const startM = startDate.getMonth() + 1;
    const startD = startDate.getDate();
    const endM = endDate.getMonth() + 1;
    const endD = endDate.getDate();
    const label = `${startM}/${startD}-\n${endM}/${endD}`;

    chunks.push({
      label,
      rate: total > 0 ? completed / total : 0,
      completed,
      total,
    });
  }

  return chunks;
}

/**
 * Calculate monthly data for yearly bar chart (12 bars).
 */
export function calculateMonthlyData(
  days: DailyCompletionStatus[],
): WeeklyDataPoint[] {
  if (days.length === 0) return [];

  // Group by month using a sortable key
  const monthlyMap = new Map<
    string,
    { completed: number; total: number; year: number; month: number }
  >();

  for (const day of days) {
    const date = new Date(day.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    // Use zero-padded key for proper sorting
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { completed: 0, total: 0, year, month });
    }

    const data = monthlyMap.get(monthKey)!;
    data.total++;
    if (day.status === "completed") {
      data.completed++;
    }
  }

  // Convert to array sorted chronologically
  const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  // Check if data spans multiple years
  const years = new Set(sortedEntries.map(([, data]) => data.year));
  const multiYear = years.size > 1;

  const result: WeeklyDataPoint[] = [];
  for (const [, data] of sortedEntries) {
    const date = new Date(data.year, data.month, 1);
    // If multi-year, show "Jan '25" format; otherwise just "Jan"
    let label = date.toLocaleDateString("en-US", { month: "short" });
    if (multiYear) {
      label += ` '${String(data.year).slice(-2)}`;
    }

    result.push({
      label,
      rate: data.total > 0 ? data.completed / data.total : 0,
      completed: data.completed,
      total: data.total,
    });
  }

  return result;
}

/**
 * Format week label from date (e.g., "Jan 15")
 */
export function formatWeekLabel(date: Date): string {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}
