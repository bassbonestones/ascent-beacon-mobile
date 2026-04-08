/**
 * Tests for timezoneData utility.
 */
import {
  TIMEZONES,
  getDeviceTimezone,
  getTimezoneLabel,
  getTimezoneOffsetMinutes,
  formatOffset,
} from "../timezoneData";

describe("timezoneData", () => {
  describe("TIMEZONES", () => {
    it("contains expected number of timezones", () => {
      expect(TIMEZONES.length).toBeGreaterThanOrEqual(15);
    });

    it("has UTC as first timezone", () => {
      expect(TIMEZONES[0].id).toBe("UTC");
    });

    it("each timezone has required properties", () => {
      TIMEZONES.forEach((tz) => {
        expect(tz.id).toBeTruthy();
        expect(tz.label).toBeTruthy();
        expect(typeof tz.offset).toBe("number");
      });
    });

    it("includes major US timezones", () => {
      const ids = TIMEZONES.map((tz) => tz.id);
      expect(ids).toContain("America/New_York");
      expect(ids).toContain("America/Los_Angeles");
      expect(ids).toContain("America/Chicago");
    });

    it("includes major international timezones", () => {
      const ids = TIMEZONES.map((tz) => tz.id);
      expect(ids).toContain("Europe/London");
      expect(ids).toContain("Asia/Tokyo");
      expect(ids).toContain("Australia/Sydney");
    });
  });

  describe("getDeviceTimezone", () => {
    it("returns a valid IANA timezone string", () => {
      const tz = getDeviceTimezone();
      expect(typeof tz).toBe("string");
      expect(tz.length).toBeGreaterThan(0);
      // IANA timezones contain a slash (e.g., "America/New_York") or are "UTC"
      expect(tz === "UTC" || tz.includes("/")).toBe(true);
    });
  });

  describe("getTimezoneLabel", () => {
    it("returns device default label when null is passed", () => {
      const label = getTimezoneLabel(null);
      expect(label).toContain("Device");
    });

    it("returns label for known timezone", () => {
      const label = getTimezoneLabel("America/New_York");
      expect(label).toBe("UTC-5 Eastern");
    });

    it("returns label for UTC", () => {
      const label = getTimezoneLabel("UTC");
      expect(label).toBe("UTC+0 UTC");
    });

    it("handles unknown timezone gracefully", () => {
      const label = getTimezoneLabel("Unknown/Timezone");
      // Should include the timezone name in some form
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });
  });

  describe("getTimezoneOffsetMinutes", () => {
    it("returns 0 for UTC", () => {
      const offset = getTimezoneOffsetMinutes("UTC");
      expect(offset).toBe(0);
    });

    it("returns negative for US timezones", () => {
      const offset = getTimezoneOffsetMinutes("America/New_York");
      // EST is -5 hours or -4 hours during DST
      expect(offset).toBeLessThanOrEqual(-240); // -4 hours in minutes
      expect(offset).toBeGreaterThanOrEqual(-300); // -5 hours in minutes
    });

    it("returns positive for Tokyo", () => {
      const offset = getTimezoneOffsetMinutes("Asia/Tokyo");
      // JST is +9 hours
      expect(offset).toBe(540); // 9 * 60
    });
  });

  describe("formatOffset", () => {
    it("formats positive integer offset", () => {
      expect(formatOffset(480)).toBe("+8"); // 8 hours
    });

    it("formats negative integer offset", () => {
      expect(formatOffset(-300)).toBe("-5"); // 5 hours
    });

    it("formats zero offset", () => {
      expect(formatOffset(0)).toBe("+0");
    });

    it("formats fractional offset", () => {
      expect(formatOffset(330)).toBe("+5:30"); // 5.5 hours
      expect(formatOffset(-330)).toBe("-5:30");
    });
  });
});
