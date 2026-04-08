import {
  getCompletionColor,
  getDayIcon,
  getDayCellStyle,
  groupDaysByWeek,
  calculateWeeklyData,
  formatWeekLabel,
  calculateTenDayChunkData,
  calculateMonthlyData,
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

  describe("getDayIcon edge cases", () => {
    it("returns empty string for unknown status", () => {
      // @ts-expect-error - testing unknown status
      expect(getDayIcon("unknown")).toBe("");
    });
  });

  describe("getDayCellStyle edge cases", () => {
    it("returns empty object for unknown status", () => {
      // @ts-expect-error - testing unknown status
      expect(getDayCellStyle("unknown")).toEqual({});
    });
  });

  describe("calculateTenDayChunkData", () => {
    it("returns empty array for empty input", () => {
      expect(calculateTenDayChunkData([])).toEqual([]);
    });

    it("groups days into 10-day chunks", () => {
      // Create 15 days of data
      const days: DailyCompletionStatus[] = [];
      for (let i = 0; i < 15; i++) {
        const date = new Date(2024, 0, i + 1); // Jan 1-15, 2024
        days.push({
          date: date.toISOString().split("T")[0],
          status: i < 8 ? "completed" : "missed",
          expected: 1,
          completed: i < 8 ? 1 : 0,
          skipped: 0,
        });
      }

      const chunks = calculateTenDayChunkData(days);
      expect(chunks.length).toBe(2); // 10 days + 5 days
      expect(chunks[0].total).toBe(10);
      expect(chunks[0].completed).toBe(8); // First 8 completed
      expect(chunks[1].total).toBe(5);
    });

    it("formats labels with start-end dates", () => {
      const days: DailyCompletionStatus[] = [];
      for (let i = 1; i <= 10; i++) {
        days.push({
          date: `2024-06-${String(i).padStart(2, "0")}`,
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        });
      }

      const chunks = calculateTenDayChunkData(days);
      // Label format is "M/D-\nM/D" with newline between start and end
      expect(chunks[0].label).toContain("-\n");
      expect(chunks[0].label).toMatch(/\d+\/\d+/);
    });
  });

  describe("calculateMonthlyData", () => {
    it("returns empty array for empty input", () => {
      expect(calculateMonthlyData([])).toEqual([]);
    });

    it("groups days by month", () => {
      const days: DailyCompletionStatus[] = [
        {
          date: "2024-01-15",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        },
        {
          date: "2024-01-20",
          status: "missed",
          expected: 1,
          completed: 0,
          skipped: 0,
        },
        {
          date: "2024-02-10",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        },
      ];

      const monthly = calculateMonthlyData(days);
      expect(monthly.length).toBe(2); // Jan and Feb
      expect(monthly[0].label).toContain("Jan");
      expect(monthly[0].total).toBe(2);
      expect(monthly[0].completed).toBe(1);
      expect(monthly[1].label).toContain("Feb");
      expect(monthly[1].total).toBe(1);
      expect(monthly[1].completed).toBe(1);
    });

    it("shows year suffix when data spans multiple years", () => {
      const days: DailyCompletionStatus[] = [
        {
          date: "2024-12-15",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        },
        {
          date: "2025-01-10",
          status: "completed",
          expected: 1,
          completed: 1,
          skipped: 0,
        },
      ];

      const monthly = calculateMonthlyData(days);
      expect(monthly.length).toBe(2);
      expect(monthly[0].label).toContain("'24"); // Dec '24
      expect(monthly[1].label).toContain("'25"); // Jan '25
    });

    it("calculates correct rates", () => {
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
        {
          date: "2024-06-13",
          status: "missed",
          expected: 1,
          completed: 0,
          skipped: 0,
        },
      ];

      const monthly = calculateMonthlyData(days);
      expect(monthly[0].rate).toBe(0.5); // 2/4
    });
  });
});
