import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useGoals } from "../useGoals";
import api from "../../services/api";
import type { Goal, GoalStatus } from "../../types";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getGoals: jest.fn(),
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    updateGoalStatus: jest.fn(),
    deleteGoal: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

// Helper to create mock goal
const createMockGoal = (id: string, title: string): Goal => ({
  id,
  user_id: "user-1",
  title,
  description: null,
  status: "not_started" as GoalStatus,
  target_date: null,
  progress_cached: 0,
  has_incomplete_breakdown: false,
  parent_goal_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  priorities: [],
  children: [],
});

describe("useGoals", () => {
  const mockGoals = [
    createMockGoal("g1", "Goal 1"),
    createMockGoal("g2", "Goal 2"),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getGoals.mockResolvedValue({ goals: mockGoals });
  });

  describe("initial fetch", () => {
    it("fetches goals on mount", async () => {
      renderHook(() => useGoals());

      await waitFor(() => {
        expect(mockedApi.getGoals).toHaveBeenCalled();
      });
    });

    it("returns goals after fetch", async () => {
      const { result } = renderHook(() => useGoals());

      await waitFor(() => {
        expect(result.current.goals).toEqual(mockGoals);
      });
    });

    it("sets loading false after fetch", async () => {
      const { result } = renderHook(() => useGoals());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("passes options to api.getGoals", async () => {
      renderHook(() =>
        useGoals({
          includeCompleted: true,
          parentOnly: true,
          priorityId: "p1",
        }),
      );

      await waitFor(() => {
        expect(mockedApi.getGoals).toHaveBeenCalledWith({
          include_completed: true,
          parent_only: true,
          priority_id: "p1",
        });
      });
    });

    it("sets error and shows alert on fetch failure", async () => {
      mockedApi.getGoals.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useGoals());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to load goals",
        );
      });
    });
  });

  describe("createGoal", () => {
    it("creates goal and adds to list", async () => {
      const newGoal = createMockGoal("g3", "New Goal");
      mockedApi.createGoal.mockResolvedValue(newGoal);

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createGoal({ title: "New Goal" });
      });

      expect(mockedApi.createGoal).toHaveBeenCalledWith({ title: "New Goal" });
      expect(result.current.goals[0]).toEqual(newGoal);
    });

    it("shows alert on create failure", async () => {
      mockedApi.createGoal.mockRejectedValue(new Error("Create failed"));

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.createGoal({ title: "New Goal" });
        }),
      ).rejects.toThrow();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to create goal",
      );
    });
  });

  describe("updateGoal", () => {
    it("updates goal in list", async () => {
      const updatedGoal = { ...mockGoals[0], title: "Updated Title" };
      mockedApi.updateGoal.mockResolvedValue(updatedGoal);

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateGoal("g1", { title: "Updated Title" });
      });

      expect(mockedApi.updateGoal).toHaveBeenCalledWith("g1", {
        title: "Updated Title",
      });
      expect(result.current.goals[0].title).toBe("Updated Title");
    });

    it("shows alert on update failure", async () => {
      mockedApi.updateGoal.mockRejectedValue(new Error("Update failed"));

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.updateGoal("g1", { title: "New" });
        }),
      ).rejects.toThrow();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to update goal",
      );
    });
  });

  describe("updateGoalStatus", () => {
    it("updates goal status in list", async () => {
      const updatedGoal = {
        ...mockGoals[0],
        status: "completed" as GoalStatus,
      };
      mockedApi.updateGoalStatus.mockResolvedValue(updatedGoal);

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateGoalStatus("g1", "completed");
      });

      expect(mockedApi.updateGoalStatus).toHaveBeenCalledWith(
        "g1",
        "completed",
      );
      expect(result.current.goals[0].status).toBe("completed");
    });

    it("shows alert on status update failure", async () => {
      mockedApi.updateGoalStatus.mockRejectedValue(new Error("Status failed"));

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.updateGoalStatus("g1", "completed");
        }),
      ).rejects.toThrow();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to update goal status",
      );
    });
  });

  describe("deleteGoal", () => {
    it("removes goal from list", async () => {
      mockedApi.deleteGoal.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteGoal("g1");
      });

      expect(mockedApi.deleteGoal).toHaveBeenCalledWith("g1");
      expect(result.current.goals.find((g) => g.id === "g1")).toBeUndefined();
    });

    it("shows alert on delete failure", async () => {
      mockedApi.deleteGoal.mockRejectedValue(new Error("Delete failed"));

      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.deleteGoal("g1");
        }),
      ).rejects.toThrow();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to delete goal",
      );
    });
  });

  describe("refetch", () => {
    it("refetches goals", async () => {
      const { result } = renderHook(() => useGoals());

      await waitFor(() => expect(result.current.loading).toBe(false));

      mockedApi.getGoals.mockClear();
      mockedApi.getGoals.mockResolvedValue({ goals: [] });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockedApi.getGoals).toHaveBeenCalled();
      expect(result.current.goals).toEqual([]);
    });
  });
});
