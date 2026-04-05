import {
  getCompletionColor,
  getDayIcon,
  getDayCellStyle,
  groupDaysByWeek,
  calculateWeeklyData,
  formatWeekLabel,
} from "../habitMetricsHelpers";
import type { DailyCompletionStatus } from "../../types";

describe("habitMetricsHelpers", () => {
  describe("getCompletionColor", () => {
    it("returns green for high completion (>= 80%)", () => {
      expect(getCompletionColor(0.8)).toBe("#4CAF50");
      expect(getCompletionColor(1.0)).toBe("#4CAF50");
      expect(getCompletionColor(0.95)).toBe("#4CAF50");
    });

    it("returns orange for medium completion (50-79%)", () => {
      expect(getCompletionColor(0.5)).toBe("#FF9800");
      expect(getCompletionColor(0.79)).toBe("#FF9800");
    });

    it("returns red for low completion (< 50%)", () => {
      expect(getCompletionColor(0.0)).toBe("#F44336");
      expect(getCompletionColor(0.49)).toBe("#F44336");
    });
  });

  describe("getDayIcon", () => {
    it("returns star for completed", () => {
      expect(getDayIcon("completed")).toBe("⭐");
    });

    it("returns skip icon for skipped", () => {
      expect(getDayIcon("skipped")).toBe("⏭️");
    });

    it("returns x for missed", () => {
      expect(getDayIcon("missed")).toBe("❌");
    });

    it("returns half circle for partial", () => {
      expect(getDayIcon("partial")).toBe("◐");
    });
  });

  describe("getDayCellStyle", () => {
    it("returns green background for completed", () => {
      const style = getDayCellStyle("completed");
      expect(style).toHaveProperty("backgroundColor", "#E8F5E9");
    });

    it("returns orange background for skipped", () => {
      const style = getDayCellStyle("skipped");
      expect(style).toHaveProperty("backgroundColor", "#FFF3E0");
    });

    it("returns red background for missed", () => {
      const style = getDayCellStyle("missed");
      expect(style).toHaveProperty("backgroundColor", "#FFEBEE");
    });

    it("returns blue background for partial", () => {
      const style = getDayCellStyle("partial");
      expect(style).toHaveProperty("backgroundColor", "#E3F2FD");
    });
  });

  describe("groupDaysByWeek", () => {
    it("returns empty array for empty input", () => {
      expect(groupDaysByWeek([])).toEqual([]);
    });

    it("groups days into weeks", () => {
      const days: DailyCompletionStatus[] = [
        {
          date: "2024-06-10",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        }, // Monday
        {
          date: "2024-06-11",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        },
        {
          date: "2024-06-12",
          status: "missed",
          expected: 1,
          completed: 0,
          skipped: 0,
        },
      ];

      const weeks = groupDaysByWeek(days);
      expect(weeks.length).toBeGreaterThan(0);
      expect(weeks[0].length).toBe(7); // Each week has 7 slots
    });

    it("pads first week with nulls for missing days", () => {
      const days: DailyCompletionStatus[] = [
        {
          date: "2024-06-12",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        }, // Wednesday
      ];

      const weeks = groupDaysByWeek(days);
      // Some positions will be null (padding), some will have data
      const hasNulls = weeks[0].some((d) => d === null);
      const hasData = weeks[0].some((d) => d !== null);
      expect(hasNulls).toBe(true);
      expect(hasData).toBe(true);
    });
  });

  describe("calculateWeeklyData", () => {
    it("returns empty array for empty input", () => {
      expect(calculateWeeklyData([])).toEqual([]);
    });

    it("calculates completion rate for a week", () => {
      const days: DailyCompletionStatus[] = [
        {
          date: "2024-06-10",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        },
        {
          date: "2024-06-11",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        },
        {
          date: "2024-06-12",
          status: "missed",
          expected: 1,
          completed: 0,
          skipped: 0,
        },
      ];

      const weeklyData = calculateWeeklyData(days);
      expect(weeklyData.length).toBe(1);
      expect(weeklyData[0].completed).toBe(2);
      expect(weeklyData[0].total).toBe(3);
      expect(weeklyData[0].rate).toBeCloseTo(2 / 3);
    });
  });

  describe("formatWeekLabel", () => {
    it("formats date as month day", () => {
      const date = new Date(2024, 5, 15); // June 15, 2024 (month is 0-indexed)
      const label = formatWeekLabel(date);
      expect(label).toContain("Jun");
      // Just check that it contains a number
      expect(label).toMatch(/\d+/);
    });
  });
});
