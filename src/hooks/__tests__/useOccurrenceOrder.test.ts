import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useOccurrenceOrder } from "../useOccurrenceOrder";
import api from "../../services/api";
import type { Task, TaskStatus, DayOrderResponse } from "../../types";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getOccurrenceOrder: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

// Helper to create mock task
const createMockTask = (
  id: string,
  title: string,
  status: TaskStatus = "pending",
): Task => ({
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
});

describe("useOccurrenceOrder", () => {
  const mockOrderResponse: DayOrderResponse = {
    date: "2024-01-15",
    items: [
      { task_id: "t2", occurrence_index: 0, sort_value: 0, is_override: false },
      { task_id: "t1", occurrence_index: 0, sort_value: 1, is_override: false },
    ],
    has_overrides: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getOccurrenceOrder.mockResolvedValue(mockOrderResponse);
  });

  describe("initial fetch", () => {
    it("fetches order on mount when enabled", async () => {
      renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15", enabled: true }),
      );

      await waitFor(() => {
        expect(mockedApi.getOccurrenceOrder).toHaveBeenCalledWith("2024-01-15");
      });
    });

    it("does not fetch when disabled", async () => {
      renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15", enabled: false }),
      );

      // Wait a bit to ensure no call is made
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockedApi.getOccurrenceOrder).not.toHaveBeenCalled();
    });

    it("returns order items after fetch", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(result.current.order).toEqual(mockOrderResponse.items);
      });
    });

    it("sets loading false after fetch", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("error handling", () => {
    it("handles 404 (no order saved) gracefully", async () => {
      mockedApi.getOccurrenceOrder.mockRejectedValue(
        new Error("404 Not Found"),
      );

      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.order).toEqual([]);
        expect(result.current.error).toBeNull();
      });
    });

    it("sets error for other API errors", async () => {
      mockedApi.getOccurrenceOrder.mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Server error");
      });
    });
  });

  describe("applySortOrder", () => {
    it("returns tasks in saved order", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const task1 = createMockTask("t1", "Task 1");
      const task2 = createMockTask("t2", "Task 2");

      // Tasks originally in order [t1, t2], but saved order is [t2, t1]
      const sorted = result.current.applySortOrder([task1, task2]);

      expect(sorted[0].id).toBe("t2");
      expect(sorted[1].id).toBe("t1");
    });

    it("puts unordered tasks after ordered ones", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const task1 = createMockTask("t1", "Task 1");
      const task2 = createMockTask("t2", "Task 2");
      const task3 = createMockTask("t3", "Task 3"); // Not in saved order

      const sorted = result.current.applySortOrder([task1, task2, task3]);

      // t2, t1 (from saved order), then t3 (unordered)
      expect(sorted[0].id).toBe("t2");
      expect(sorted[1].id).toBe("t1");
      expect(sorted[2].id).toBe("t3");
    });

    it("returns original order when no saved order exists", async () => {
      mockedApi.getOccurrenceOrder.mockRejectedValue(
        new Error("404 Not Found"),
      );

      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(result.current.order).toEqual([]);
      });

      const task1 = createMockTask("t1", "Task 1");
      const task2 = createMockTask("t2", "Task 2");

      const sorted = result.current.applySortOrder([task1, task2]);

      // Original order preserved
      expect(sorted[0].id).toBe("t1");
      expect(sorted[1].id).toBe("t2");
    });
  });

  describe("refetch", () => {
    it("refetches order when called", async () => {
      const { result } = renderHook(() =>
        useOccurrenceOrder({ date: "2024-01-15" }),
      );

      await waitFor(() => {
        expect(mockedApi.getOccurrenceOrder).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockedApi.getOccurrenceOrder).toHaveBeenCalledTimes(2);
    });
  });
});
