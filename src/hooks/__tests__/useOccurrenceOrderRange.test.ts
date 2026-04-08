import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useOccurrenceOrderRange } from "../useOccurrenceOrderRange";
import api from "../../services/api";
import type { Task, TaskStatus, DateRangeOrderResponse } from "../../types";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getOccurrenceOrderRange: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

// Helper to create mock task
const createMockTask = (
  id: string,
  title: string,
  occurrenceIndex: number = 0,
  status: TaskStatus = "pending",
): Task & { occurrenceIndex?: number; originalTaskId?: string } => ({
  id,
  user_id: "user-1",
  goal_id: "goal-1",
  title,
  description: null,
  duration_minutes: 30,
  status,
  scheduled_date: "2024-01-15",
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: { id: "goal-1", title: "Test Goal", status: "not_started" },
  scheduling_mode: "date_only",
  skip_reason: null,
  sort_order: null,
  occurrenceIndex,
});

describe("useOccurrenceOrderRange", () => {
  const mockRangeResponse: DateRangeOrderResponse = {
    start_date: "2024-01-15",
    end_date: "2024-01-20",
    permanent_order: [
      { task_id: "t2", occurrence_index: 0, sequence_number: 1 },
      { task_id: "t1", occurrence_index: 0, sequence_number: 2 },
    ],
    daily_overrides: {
      "2024-01-16": [
        { task_id: "t1", occurrence_index: 0, sort_position: 1 },
        { task_id: "t2", occurrence_index: 0, sort_position: 2 },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getOccurrenceOrderRange.mockResolvedValue(mockRangeResponse);
  });

  describe("initial fetch", () => {
    it("fetches order on mount when enabled", async () => {
      renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
          enabled: true,
        }),
      );

      await waitFor(() => {
        expect(mockedApi.getOccurrenceOrderRange).toHaveBeenCalledWith(
          "2024-01-15",
          "2024-01-20",
        );
      });
    });

    it("does not fetch when disabled", async () => {
      renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
          enabled: false,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockedApi.getOccurrenceOrderRange).not.toHaveBeenCalled();
    });

    it("returns data after fetch", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockRangeResponse);
      });
    });

    it("sets loading false after fetch", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("error handling", () => {
    it("handles 404 gracefully", async () => {
      mockedApi.getOccurrenceOrderRange.mockRejectedValue(
        new Error("404 Not Found"),
      );

      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.data?.permanent_order).toEqual([]);
      });
    });

    it("sets error on fetch failure", async () => {
      mockedApi.getOccurrenceOrderRange.mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });
    });
  });

  describe("hasOverridesForDate", () => {
    it("returns true when date has overrides", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.hasOverridesForDate("2024-01-16")).toBe(true);
      });
    });

    it("returns false when date has no overrides", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.hasOverridesForDate("2024-01-15")).toBe(false);
      });
    });
  });

  describe("applyOrderForDate", () => {
    it("uses daily overrides when available", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const tasks = [
        createMockTask("t2", "Task 2"),
        createMockTask("t1", "Task 1"),
      ];

      // Date 2024-01-16 has overrides: t1 first, t2 second
      const ordered = result.current.applyOrderForDate(tasks, "2024-01-16");

      expect(ordered[0].id).toBe("t1");
      expect(ordered[1].id).toBe("t2");
    });

    it("uses permanent order when no overrides", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const tasks = [
        createMockTask("t1", "Task 1"),
        createMockTask("t2", "Task 2"),
      ];

      // Date 2024-01-15 has no overrides, uses permanent: t2 first, t1 second
      const ordered = result.current.applyOrderForDate(tasks, "2024-01-15");

      expect(ordered[0].id).toBe("t2");
      expect(ordered[1].id).toBe("t1");
    });

    it("puts unordered tasks at the end", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const tasks = [
        createMockTask("t3", "Task 3"), // Not in order
        createMockTask("t1", "Task 1"),
        createMockTask("t2", "Task 2"),
      ];

      const ordered = result.current.applyOrderForDate(tasks, "2024-01-15");

      // t2 and t1 are ordered, t3 is unordered and goes last
      expect(ordered[0].id).toBe("t2");
      expect(ordered[1].id).toBe("t1");
      expect(ordered[2].id).toBe("t3");
    });
  });

  describe("refetch", () => {
    it("refetches data when called", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrderRange({
          startDate: "2024-01-15",
          endDate: "2024-01-20",
        }),
      );

      await waitFor(() => {
        expect(mockedApi.getOccurrenceOrderRange).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockedApi.getOccurrenceOrderRange).toHaveBeenCalledTimes(2);
    });
  });
});
