import { toLocalDateString } from "../../utils/taskSorting";
import { getWeekKey } from "./rhythmSimulatorConstants";
import type { MonthData } from "./HierarchyView";

export interface HierarchyData {
  months: MonthData[];
}

/**
 * Build a hierarchical structure of months -> weeks -> days
 * from a start date to today.
 */
export function buildHierarchyData(
  startDate: string,
  today: string,
): HierarchyData {
  const startD = new Date(startDate + "T00:00:00");
  const todayD = new Date(today + "T00:00:00");

  const monthsMap = new Map<
    string,
    {
      yearMonth: string;
      weeks: Map<
        string,
        { weekStart: string; days: { date: string; dayOfWeek: number }[] }
      >;
    }
  >();

  const current = new Date(startD);
  while (current <= todayD) {
    const dateStr = toLocalDateString(current);
    const yearMonth = dateStr.substring(0, 7);
    const weekStart = getWeekKey(current);

    if (!monthsMap.has(yearMonth)) {
      monthsMap.set(yearMonth, { yearMonth, weeks: new Map() });
    }

    const monthData = monthsMap.get(yearMonth)!;
    if (!monthData.weeks.has(weekStart)) {
      monthData.weeks.set(weekStart, { weekStart, days: [] });
    }

    monthData.weeks.get(weekStart)!.days.push({
      date: dateStr,
      dayOfWeek: current.getDay(),
    });

    current.setDate(current.getDate() + 1);
  }

  return {
    months: Array.from(monthsMap.values()).map((m) => ({
      yearMonth: m.yearMonth,
      weeks: Array.from(m.weeks.values()),
    })),
  };
}
