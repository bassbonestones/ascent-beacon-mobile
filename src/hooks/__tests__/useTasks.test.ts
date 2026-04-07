import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useTasks } from "../useTasks";
import api from "../../services/api";
import type { Task, TaskStatus } from "../../types";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    completeTask: jest.fn(),
    skipTask: jest.fn(),
    reopenTask: jest.fn(),
    deleteTask: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

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
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: { id: "goal-1", title: "Test Goal", status: "not_started" },
  scheduling_mode: null,
  skip_reason: null,
});

describe("useTasks", () => {
  const mockTasks = [
    createMockTask("t1", "Task 1"),
    createMockTask("t2", "Task 2"),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getTasks.mockResolvedValue({
      tasks: mockTasks,
      total: 2,
      pending_count: 2,
      completed_count: 0,
    });
  });

  describe("initial fetch", () => {
    it("fetches tasks on mount", async () => {
      renderHook(() => useTasks());

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });
    });

    it("returns tasks after fetch", async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.tasks).toEqual(mockTasks);
      });
    });

    it("sets loading false after fetch", async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("returns pending and completed counts", async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(2);
        expect(result.current.completedCount).toBe(0);
      });
    });

    it("passes options to api.getTasks", async () => {
      renderHook(() => useTasks({ goalId: "g1", status: "pending" }));

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalledWith(
          expect.objectContaining({
            goal_id: "g1",
            status: "pending",
            client_today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          }),
        );
      });
    });

    it("passes daysAhead option to api.getTasks", async () => {
      renderHook(() => useTasks({ daysAhead: 28 }));

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalledWith(
          expect.objectContaining({
            days_ahead: 28,
          }),
        );
      });
    });

    it("sets error and shows alert on fetch failure", async () => {
      mockedApi.getTasks.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe("createTask", () => {
    it("creates a task and refetches list", async () => {
      const newTask = createMockTask("t3", "Task 3");
      mockedApi.createTask.mockResolvedValue(newTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Reset mock call count to track the refetch
      mockedApi.getTasks.mockClear();

      await act(async () => {
        await result.current.createTask({
          goal_id: "goal-1",
          title: "Task 3",
          duration_minutes: 30,
        });
      });

      // Verify api.createTask was called
      expect(mockedApi.createTask).toHaveBeenCalledWith({
        goal_id: "goal-1",
        title: "Task 3",
        duration_minutes: 30,
      });
      // Verify a refetch was triggered
      expect(mockedApi.getTasks).toHaveBeenCalled();
    });
  });

  describe("completeTask", () => {
    it("completes a task and updates counts", async () => {
      const completedTask = {
        ...createMockTask("t1", "Task 1", "completed"),
        completed_at: "2024-01-01T12:00:00Z",
      };
      mockedApi.completeTask.mockResolvedValue(completedTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.completeTask("t1");
      });

      expect(result.current.tasks[0].status).toBe("completed");
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.completedCount).toBe(1);
    });
  });

  describe("skipTask", () => {
    it("skips a task", async () => {
      const skippedTask = createMockTask("t1", "Task 1", "skipped");
      mockedApi.skipTask.mockResolvedValue(skippedTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.skipTask("t1");
      });

      expect(result.current.tasks[0].status).toBe("skipped");
      expect(result.current.pendingCount).toBe(1);
    });
  });

  describe("reopenTask", () => {
    it("reopens a completed task", async () => {
      mockedApi.getTasks.mockResolvedValue({
        tasks: [createMockTask("t1", "Task 1", "completed")],
        total: 1,
        pending_count: 0,
        completed_count: 1,
      });

      const reopenedTask = createMockTask("t1", "Task 1", "pending");
      mockedApi.reopenTask.mockResolvedValue(reopenedTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.reopenTask("t1");
      });

      expect(result.current.tasks[0].status).toBe("pending");
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.completedCount).toBe(0);
    });
  });

  describe("deleteTask", () => {
    it("deletes a task from list", async () => {
      mockedApi.deleteTask.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteTask("t1");
      });

      expect(result.current.tasks.length).toBe(1);
      expect(result.current.tasks[0].id).toBe("t2");
      expect(result.current.pendingCount).toBe(1);
    });
  });

  describe("refetch", () => {
    it("refetches tasks from API", async () => {
      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      mockedApi.getTasks.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockedApi.getTasks).toHaveBeenCalled();
    });
  });
});
