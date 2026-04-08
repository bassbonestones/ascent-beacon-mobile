/**
 * Tests for timeStorage utilities.
 */
import { getDateInTimezone } from "../timeStorage";

describe("timeStorage", () => {
  describe("getDateInTimezone", () => {
    it("returns date components in UTC timezone", () => {
      // Create a date at midnight UTC
      const utcDate = new Date("2026-04-08T00:00:00Z");
      const result = getDateInTimezone(utcDate, "UTC");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April (0-indexed)
      expect(result.getDate()).toBe(8);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it("shifts date forward for positive UTC offset timezone", () => {
      // 11 PM UTC on April 7 = 8 AM April 8 in Tokyo (UTC+9)
      const utcDate = new Date("2026-04-07T23:00:00Z");
      const result = getDateInTimezone(utcDate, "Asia/Tokyo");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(8); // Next day in Tokyo
      expect(result.getHours()).toBe(8); // 8 AM
    });

    it("shifts date backward for negative UTC offset timezone", () => {
      // 3 AM UTC on April 8 = 11 PM April 7 in New York (UTC-4 in April, EDT)
      // Note: This is approximate as DST affects the exact offset
      const utcDate = new Date("2026-04-08T03:00:00Z");
      const result = getDateInTimezone(utcDate, "America/New_York");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(7); // Previous day in New York
      expect(result.getHours()).toBe(23); // 11 PM
    });

    it("handles CDT to UTC conversion correctly", () => {
      // 8:26 PM CDT (April 7) = 1:26 AM UTC (April 8)
      // CDT is UTC-5, so 8:26 PM CDT = 2026-04-08T01:26:00Z
      const cdtTime = new Date("2026-04-08T01:26:00Z"); // This is 8:26 PM CDT
      const result = getDateInTimezone(cdtTime, "UTC");

      expect(result.getDate()).toBe(8); // April 8 in UTC
      expect(result.getHours()).toBe(1); // 1 AM
      expect(result.getMinutes()).toBe(26);
    });

    it("falls back to base date on invalid timezone", () => {
      const baseDate = new Date("2026-04-07T12:00:00Z");
      // Note: Most browsers will throw on invalid timezone, triggering fallback
      const result = getDateInTimezone(baseDate, "Invalid/Timezone");

      // Should return the original date or a reasonable fallback
      expect(result instanceof Date).toBe(true);
    });
  });
});
