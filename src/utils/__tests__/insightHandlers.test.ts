import { handleKeepBoth, handleReviewInsight } from "../insightHandlers";
import api from "../../services/api";
import { logError } from "../logger";
import type { ValueInsight } from "../../types";
import type { RefObject } from "react";
import type { ScrollView } from "react-native";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    acknowledgeValueInsight: jest.fn(),
  },
}));

jest.mock("../logger", () => ({
  logError: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;
const mockedLogError = logError as jest.Mock;

describe("insightHandlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleKeepBoth", () => {
    it("acknowledges insight and removes from state", async () => {
      const setValueInsights = jest.fn();
      mockedApi.acknowledgeValueInsight.mockResolvedValue(undefined as any);

      await handleKeepBoth("value-1", setValueInsights);

      expect(mockedApi.acknowledgeValueInsight).toHaveBeenCalledWith("value-1");
      expect(setValueInsights).toHaveBeenCalledWith(expect.any(Function));

      // Test the state update function
      const updateFn = setValueInsights.mock.calls[0][0];
      const prevState = { "value-1": {} as ValueInsight, "value-2": {} as ValueInsight };
      const newState = updateFn(prevState);
      expect(newState).toEqual({ "value-2": {} });
    });

    it("logs error but still removes from state on API failure", async () => {
      const setValueInsights = jest.fn();
      const error = new Error("API Error");
      mockedApi.acknowledgeValueInsight.mockRejectedValue(error);

      await handleKeepBoth("value-1", setValueInsights);

      expect(mockedLogError).toHaveBeenCalledWith(
        "Failed to acknowledge insight:",
        error,
      );
      expect(setValueInsights).toHaveBeenCalled();
    });
  });

  describe("handleReviewInsight", () => {
    it("scrolls to similar value and highlights it", () => {
      jest.useFakeTimers();

      const valueInsights: Record<string, ValueInsight> = {
        "value-1": {
          type: "similar_values",
          similar_value_id: "similar-1",
        } as ValueInsight,
      };
      const valuePositions = { current: { "similar-1": 100 } } as RefObject<
        Record<string, number>
      >;
      const scrollTo = jest.fn();
      const scrollViewRef = {
        current: { scrollTo } as unknown as ScrollView,
      } as RefObject<ScrollView | null>;
      const setHighlightValueId = jest.fn();

      handleReviewInsight(
        "value-1",
        valueInsights,
        valuePositions,
        scrollViewRef,
        setHighlightValueId,
      );

      expect(scrollTo).toHaveBeenCalledWith({
        y: 88, // 100 - 12
        animated: true,
      });
      expect(setHighlightValueId).toHaveBeenCalledWith("similar-1");

      // Fast-forward timer
      jest.advanceTimersByTime(1200);
      expect(setHighlightValueId).toHaveBeenCalledWith(null);

      jest.useRealTimers();
    });

    it("does nothing when no insight exists", () => {
      const valueInsights: Record<string, ValueInsight> = {};
      const valuePositions = { current: {} } as RefObject<
        Record<string, number>
      >;
      const scrollTo = jest.fn();
      const scrollViewRef = {
        current: { scrollTo } as unknown as ScrollView,
      } as RefObject<ScrollView | null>;
      const setHighlightValueId = jest.fn();

      handleReviewInsight(
        "value-1",
        valueInsights,
        valuePositions,
        scrollViewRef,
        setHighlightValueId,
      );

      expect(scrollTo).not.toHaveBeenCalled();
      expect(setHighlightValueId).not.toHaveBeenCalled();
    });

    it("does nothing when similar_value_id is missing", () => {
      const valueInsights: Record<string, ValueInsight> = {
        "value-1": {
          type: "similar_values",
        } as ValueInsight,
      };
      const valuePositions = { current: {} } as RefObject<
        Record<string, number>
      >;
      const scrollViewRef = {
        current: null,
      } as RefObject<ScrollView | null>;
      const setHighlightValueId = jest.fn();

      handleReviewInsight(
        "value-1",
        valueInsights,
        valuePositions,
        scrollViewRef,
        setHighlightValueId,
      );

      expect(setHighlightValueId).not.toHaveBeenCalled();
    });

    it("does not crash when scrollViewRef.current is null", () => {
      const valueInsights: Record<string, ValueInsight> = {
        "value-1": {
          type: "similar_values",
          similar_value_id: "similar-1",
        } as ValueInsight,
      };
      const valuePositions = { current: { "similar-1": 100 } } as RefObject<
        Record<string, number>
      >;
      const scrollViewRef = {
        current: null,
      } as RefObject<ScrollView | null>;
      const setHighlightValueId = jest.fn();

      // Should not throw
      expect(() =>
        handleReviewInsight(
          "value-1",
          valueInsights,
          valuePositions,
          scrollViewRef,
          setHighlightValueId,
        ),
      ).not.toThrow();
    });
  });
});
