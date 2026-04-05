import {
  parseRRule,
  buildRRule,
  getFrequencyDescription,
  type RecurrenceState,
  DAYS_OF_WEEK,
  FREQUENCIES,
} from "../rruleUtils";

describe("rruleUtils", () => {
  describe("parseRRule", () => {
    it("returns defaults for empty/undefined input", () => {
      const result = parseRRule(undefined);
      expect(result.frequency).toBe("DAILY");
      expect(result.interval).toBe(1);
      expect(result.byDay).toEqual([]);
      expect(result.endCondition).toBe("never");
      expect(result.count).toBe(0);
      expect(result.until).toBe("");
      expect(result.intradayMode).toBe("single");
      expect(result.specificTimes).toEqual([]);
      expect(result.intervalMinutes).toBe(30);
      expect(result.windowStart).toBe("09:00");
      expect(result.windowEnd).toBe("21:00");
      expect(result.dailyOccurrences).toBe(1);
    });

    it("parses basic daily rule", () => {
      const result = parseRRule("FREQ=DAILY");
      expect(result.frequency).toBe("DAILY");
      expect(result.interval).toBe(1);
    });

    it("parses weekly rule with days", () => {
      const result = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR");
      expect(result.frequency).toBe("WEEKLY");
      expect(result.byDay).toEqual(["MO", "WE", "FR"]);
    });

    it("parses rule with interval", () => {
      const result = parseRRule("FREQ=DAILY;INTERVAL=3");
      expect(result.interval).toBe(3);
    });

    it("parses rule with count", () => {
      const result = parseRRule("FREQ=DAILY;COUNT=10");
      expect(result.endCondition).toBe("count");
      expect(result.count).toBe(10);
    });

    it("parses rule with until date", () => {
      const result = parseRRule("FREQ=DAILY;UNTIL=2026-12-31");
      expect(result.endCondition).toBe("until");
      expect(result.until).toBe("2026-12-31");
    });

    it("parses anytime intraday mode", () => {
      const result = parseRRule("FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=8");
      expect(result.intradayMode).toBe("anytime");
      expect(result.dailyOccurrences).toBe(8);
    });

    it("parses specific_times intraday mode", () => {
      const result = parseRRule(
        "FREQ=DAILY;X-INTRADAY=specific_times;X-TIMES=09:00,12:00,18:00",
      );
      expect(result.intradayMode).toBe("specific_times");
      expect(result.specificTimes).toEqual(["09:00", "12:00", "18:00"]);
    });

    it("parses interval intraday mode", () => {
      const result = parseRRule(
        "FREQ=DAILY;X-INTRADAY=interval;X-INTERVALMIN=45;X-WINSTART=10:00;X-WINEND=22:00;X-DAILYOCC=8",
      );
      expect(result.intradayMode).toBe("interval");
      expect(result.intervalMinutes).toBe(45);
      expect(result.windowStart).toBe("10:00");
      expect(result.windowEnd).toBe("22:00");
      expect(result.dailyOccurrences).toBe(8);
    });

    it("parses window intraday mode", () => {
      const result = parseRRule(
        "FREQ=DAILY;X-INTRADAY=window;X-WINSTART=16:00;X-WINEND=19:00",
      );
      expect(result.intradayMode).toBe("window");
      expect(result.windowStart).toBe("16:00");
      expect(result.windowEnd).toBe("19:00");
    });
  });

  describe("buildRRule", () => {
    const baseState: RecurrenceState = {
      frequency: "DAILY",
      interval: 1,
      byDay: [],
      endCondition: "never",
      count: 0,
      until: "",
      intradayMode: "single",
      specificTimes: [],
      intervalMinutes: 30,
      windowStart: "09:00",
      windowEnd: "21:00",
      dailyOccurrences: 1,
    };

    it("builds basic daily rule", () => {
      const result = buildRRule(baseState);
      expect(result).toBe("FREQ=DAILY");
    });

    it("builds rule with interval", () => {
      const result = buildRRule({ ...baseState, interval: 2 });
      expect(result).toBe("FREQ=DAILY;INTERVAL=2");
    });

    it("builds weekly rule with days", () => {
      const result = buildRRule({
        ...baseState,
        frequency: "WEEKLY",
        byDay: ["MO", "FR"],
      });
      expect(result).toBe("FREQ=WEEKLY;BYDAY=MO,FR");
    });

    it("builds rule with count", () => {
      const result = buildRRule({
        ...baseState,
        endCondition: "count",
        count: 5,
      });
      expect(result).toBe("FREQ=DAILY;COUNT=5");
    });

    it("does not include count if zero", () => {
      const result = buildRRule({
        ...baseState,
        endCondition: "count",
        count: 0,
      });
      expect(result).toBe("FREQ=DAILY");
    });

    it("builds rule with until date", () => {
      const result = buildRRule({
        ...baseState,
        endCondition: "until",
        until: "2026-12-31",
      });
      expect(result).toBe("FREQ=DAILY;UNTIL=2026-12-31");
    });

    it("builds anytime intraday mode", () => {
      const result = buildRRule({
        ...baseState,
        intradayMode: "anytime",
        dailyOccurrences: 8,
      });
      expect(result).toContain("X-INTRADAY=anytime");
      expect(result).toContain("X-DAILYOCC=8");
    });

    it("builds specific_times intraday mode", () => {
      const result = buildRRule({
        ...baseState,
        intradayMode: "specific_times",
        specificTimes: ["09:00", "12:00"],
      });
      expect(result).toContain("X-INTRADAY=specific_times");
      expect(result).toContain("X-TIMES=09:00,12:00");
    });

    it("builds interval intraday mode", () => {
      const result = buildRRule({
        ...baseState,
        intradayMode: "interval",
        intervalMinutes: 45,
        windowStart: "10:00",
        windowEnd: "22:00",
        dailyOccurrences: 8,
      });
      expect(result).toContain("X-INTRADAY=interval");
      expect(result).toContain("X-INTERVALMIN=45");
      expect(result).toContain("X-WINSTART=10:00");
      expect(result).toContain("X-WINEND=22:00");
      expect(result).toContain("X-DAILYOCC=8");
    });

    it("builds window intraday mode", () => {
      const result = buildRRule({
        ...baseState,
        intradayMode: "window",
        windowStart: "16:00",
        windowEnd: "19:00",
      });
      expect(result).toContain("X-INTRADAY=window");
      expect(result).toContain("X-WINSTART=16:00");
      expect(result).toContain("X-WINEND=19:00");
    });
  });

  describe("getFrequencyDescription", () => {
    const baseState: RecurrenceState = {
      frequency: "DAILY",
      interval: 1,
      byDay: [],
      endCondition: "never",
      count: 0,
      until: "",
      intradayMode: "single",
      specificTimes: [],
      intervalMinutes: 30,
      windowStart: "09:00",
      windowEnd: "21:00",
      dailyOccurrences: 1,
    };

    it("describes daily frequency", () => {
      const result = getFrequencyDescription(baseState);
      expect(result).toBe("Every day");
    });

    it("describes weekly frequency", () => {
      const result = getFrequencyDescription({
        ...baseState,
        frequency: "WEEKLY",
      });
      expect(result).toBe("Every week");
    });

    it("describes interval > 1", () => {
      const result = getFrequencyDescription({ ...baseState, interval: 2 });
      expect(result).toBe("Every 2 days");
    });

    it("describes weekly with days", () => {
      const result = getFrequencyDescription({
        ...baseState,
        frequency: "WEEKLY",
        byDay: ["MO", "FR"],
      });
      expect(result).toBe("Every week on Mon, Fri");
    });

    it("describes count ending", () => {
      const result = getFrequencyDescription({
        ...baseState,
        endCondition: "count",
        count: 10,
      });
      expect(result).toBe("Every day, 10 times total");
    });

    it("describes until ending", () => {
      const result = getFrequencyDescription({
        ...baseState,
        endCondition: "until",
        until: "2026-12-31",
      });
      expect(result).toBe("Every day, until Dec 31, 2026");
    });

    it("describes anytime intraday", () => {
      const result = getFrequencyDescription({
        ...baseState,
        intradayMode: "anytime",
        dailyOccurrences: 8,
      });
      expect(result).toBe("Every day, 8x per day");
    });

    it("describes specific times intraday", () => {
      const result = getFrequencyDescription({
        ...baseState,
        intradayMode: "specific_times",
        specificTimes: ["09:00", "12:00"],
      });
      expect(result).toContain("at 9:00am, 12:00pm");
    });

    it("describes interval intraday", () => {
      const result = getFrequencyDescription({
        ...baseState,
        intradayMode: "interval",
        intervalMinutes: 45,
        windowStart: "10:00",
        windowEnd: "22:00",
        dailyOccurrences: 8,
      });
      expect(result).toContain("every 45min");
      expect(result).toContain("10:00am-10:00pm");
      expect(result).toContain("(max 8x)");
    });

    it("describes window intraday", () => {
      const result = getFrequencyDescription({
        ...baseState,
        intradayMode: "window",
        windowStart: "16:00",
        windowEnd: "19:00",
      });
      expect(result).toContain("between 4:00pm-7:00pm");
    });

    it("handles count = 0 with X placeholder", () => {
      const result = getFrequencyDescription({
        ...baseState,
        endCondition: "count",
        count: 0,
      });
      expect(result).toContain("X times total");
    });

    it("handles until without date", () => {
      const result = getFrequencyDescription({
        ...baseState,
        endCondition: "until",
        until: "",
      });
      expect(result).toContain("until [date]");
    });

    it("includes start date when provided", () => {
      const result = getFrequencyDescription(baseState, "2026-04-05");
      expect(result).toBe("Every day, from Apr 5");
    });

    it("includes start date with until condition", () => {
      const result = getFrequencyDescription(
        {
          ...baseState,
          endCondition: "until",
          until: "2026-04-15",
        },
        "2026-04-05",
      );
      expect(result).toBe("Every day, from Apr 5, until Apr 15, 2026");
    });

    it("handles null start date", () => {
      const result = getFrequencyDescription(baseState, null);
      expect(result).toBe("Every day");
    });
  });

  describe("constants", () => {
    it("has all 7 days of week", () => {
      expect(DAYS_OF_WEEK).toHaveLength(7);
      expect(DAYS_OF_WEEK.map((d) => d.key)).toEqual([
        "MO",
        "TU",
        "WE",
        "TH",
        "FR",
        "SA",
        "SU",
      ]);
    });

    it("has 4 frequencies", () => {
      expect(FREQUENCIES).toHaveLength(4);
      expect(FREQUENCIES.map((f) => f.key)).toEqual([
        "DAILY",
        "WEEKLY",
        "MONTHLY",
        "YEARLY",
      ]);
    });
  });
});
