import {
  getRecurrenceDescription,
  getRecurrenceShortLabel,
} from "../recurrenceDescription";

describe("recurrenceDescription", () => {
  describe("getRecurrenceDescription", () => {
    it("returns 'Not set' for null input", () => {
      expect(getRecurrenceDescription(null)).toBe("Not set");
    });

    it("returns 'Daily' for simple FREQ=DAILY", () => {
      expect(getRecurrenceDescription("FREQ=DAILY")).toBe("Daily");
    });

    it("returns 'Weekly' for simple FREQ=WEEKLY", () => {
      expect(getRecurrenceDescription("FREQ=WEEKLY")).toBe("Weekly");
    });

    it("returns 'Monthly' for simple FREQ=MONTHLY", () => {
      expect(getRecurrenceDescription("FREQ=MONTHLY")).toBe("Monthly");
    });

    it("returns 'Yearly' for simple FREQ=YEARLY", () => {
      expect(getRecurrenceDescription("FREQ=YEARLY")).toBe("Yearly");
    });

    it("handles interval > 1 for daily", () => {
      expect(getRecurrenceDescription("FREQ=DAILY;INTERVAL=2")).toBe(
        "Every 2 days"
      );
    });

    it("handles interval > 1 for weekly", () => {
      expect(getRecurrenceDescription("FREQ=WEEKLY;INTERVAL=3")).toBe(
        "Every 3 weeks"
      );
    });

    it("shows days for weekly with BYDAY", () => {
      expect(getRecurrenceDescription("FREQ=WEEKLY;BYDAY=MO,WE,FR")).toBe(
        "Mon, Wed, Fri"
      );
    });

    it("shows days for weekly with interval and BYDAY", () => {
      expect(
        getRecurrenceDescription("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH")
      ).toBe("Every 2 weeks on Tue, Thu");
    });

    it("handles single day BYDAY", () => {
      expect(getRecurrenceDescription("FREQ=WEEKLY;BYDAY=SA")).toBe("Sat");
    });

    it("handles all days", () => {
      expect(
        getRecurrenceDescription("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU")
      ).toBe("Mon, Tue, Wed, Thu, Fri, Sat, Sun");
    });

    it("handles daily with BYDAY", () => {
      expect(getRecurrenceDescription("FREQ=DAILY;BYDAY=MO,TU")).toBe(
        "Every day on Mon, Tue"
      );
    });

    it("handles unknown frequency gracefully", () => {
      expect(getRecurrenceDescription("FREQ=UNKNOWN")).toBe("Every time");
    });

    it("handles interval with BYDAY for non-weekly", () => {
      expect(getRecurrenceDescription("FREQ=DAILY;INTERVAL=2;BYDAY=MO")).toBe(
        "Every 2 days on Mon"
      );
    });
  });

  describe("getRecurrenceShortLabel", () => {
    it("returns empty string for null input", () => {
      expect(getRecurrenceShortLabel(null)).toBe("");
    });

    it("returns 'Daily' for FREQ=DAILY", () => {
      expect(getRecurrenceShortLabel("FREQ=DAILY")).toBe("Daily");
    });

    it("returns 'Weekly' for FREQ=WEEKLY", () => {
      expect(getRecurrenceShortLabel("FREQ=WEEKLY")).toBe("Weekly");
    });

    it("returns 'Monthly' for FREQ=MONTHLY", () => {
      expect(getRecurrenceShortLabel("FREQ=MONTHLY")).toBe("Monthly");
    });

    it("returns 'Yearly' for FREQ=YEARLY", () => {
      expect(getRecurrenceShortLabel("FREQ=YEARLY")).toBe("Yearly");
    });

    it("returns short form for specific days per week", () => {
      expect(getRecurrenceShortLabel("FREQ=WEEKLY;BYDAY=MO,WE,FR")).toBe(
        "3x/week"
      );
    });

    it("returns 'Daily' for all 7 days", () => {
      expect(
        getRecurrenceShortLabel("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU")
      ).toBe("Daily");
    });

    it("returns interval for interval > 1", () => {
      expect(getRecurrenceShortLabel("FREQ=DAILY;INTERVAL=2")).toBe("2x");
    });

    it("returns empty for unknown freq", () => {
      expect(getRecurrenceShortLabel("FREQ=HOURLY")).toBe("");
    });
  });
});
