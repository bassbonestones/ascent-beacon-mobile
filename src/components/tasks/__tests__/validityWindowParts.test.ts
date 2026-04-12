import {
  parseWindowPartText,
  partsToInputStrings,
  partsToTotalMinutes,
  totalMinutesToParts,
} from "../validityWindowParts";

describe("validityWindowParts", () => {
  describe("totalMinutesToParts / partsToTotalMinutes", () => {
    it("round-trips 1500 minutes as 1d 1h 0m", () => {
      const p = totalMinutesToParts(1500);
      expect(p).toEqual({ days: 1, hours: 1, minutes: 0 });
      expect(partsToTotalMinutes(p)).toBe(1500);
    });

    it("round-trips 90 minutes", () => {
      const p = totalMinutesToParts(90);
      expect(p).toEqual({ days: 0, hours: 1, minutes: 30 });
      expect(partsToTotalMinutes(p)).toBe(90);
    });

    it("returns null for zero parts", () => {
      expect(partsToTotalMinutes({ days: 0, hours: 0, minutes: 0 })).toBeNull();
    });

    it("treats null total as zero parts", () => {
      expect(totalMinutesToParts(null)).toEqual({
        days: 0,
        hours: 0,
        minutes: 0,
      });
    });
  });

  describe("partsToInputStrings", () => {
    it("returns empty strings when null", () => {
      expect(partsToInputStrings(null)).toEqual({
        days: "",
        hours: "",
        minutes: "",
      });
    });

    it("includes zeros for non-null totals", () => {
      expect(partsToInputStrings(60)).toEqual({
        days: "0",
        hours: "1",
        minutes: "0",
      });
    });
  });

  describe("parseWindowPartText", () => {
    it("parses empty as 0", () => {
      expect(parseWindowPartText("")).toBe(0);
      expect(parseWindowPartText("  ")).toBe(0);
    });

    it("returns 0 for invalid", () => {
      expect(parseWindowPartText("abc")).toBe(0);
    });
  });
});
