import { tasksMethods } from "../apiTasks";
import type { ApiRequestOptions } from "../../types";

describe("apiTasks", () => {
  // Create a mock base class with proper typing
  class MockBase {
    request: jest.Mock<Promise<unknown>, [string, ApiRequestOptions?]> =
      jest.fn();
  }

  // Create the mixed class
  // @ts-expect-error - MockBase is a test mock that doesn't extend ApiServiceBase
  const MixedClass = tasksMethods(MockBase);
  let api: InstanceType<typeof MixedClass>;

  beforeEach(() => {
    api = new MixedClass();
    jest.clearAllMocks();
  });

  describe("getTasks", () => {
    it("should call request with /tasks when no params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
        pending_count: 0,
        completed_count: 0,
      });
      await api.getTasks();
      expect(api.request).toHaveBeenCalledWith("/tasks");
    });

    it("should add goal_id param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
        pending_count: 0,
        completed_count: 0,
      });
      await api.getTasks({ goal_id: "g1" });
      expect(api.request).toHaveBeenCalledWith("/tasks?goal_id=g1");
    });

    it("should add status param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
        pending_count: 0,
        completed_count: 0,
      });
      await api.getTasks({ status: "pending" });
      expect(api.request).toHaveBeenCalledWith("/tasks?status=pending");
    });

    it("should combine multiple params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
        pending_count: 0,
        completed_count: 0,
      });
      await api.getTasks({ goal_id: "g1", status: "completed" });
      expect(api.request).toHaveBeenCalledWith(
        "/tasks?goal_id=g1&status=completed",
      );
    });

    it("should add days_ahead param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
        pending_count: 0,
        completed_count: 0,
      });
      await api.getTasks({ days_ahead: 28 });
      expect(api.request).toHaveBeenCalledWith("/tasks?days_ahead=28");
    });

    it("should add include_completed param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
        pending_count: 0,
        completed_count: 0,
      });
      await api.getTasks({ include_completed: true });
      expect(api.request).toHaveBeenCalledWith("/tasks?include_completed=true");
    });

    it("should add client_today param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
        pending_count: 0,
        completed_count: 0,
      });
      await api.getTasks({ client_today: "2026-04-07" });
      expect(api.request).toHaveBeenCalledWith(
        "/tasks?client_today=2026-04-07",
      );
    });
  });

  describe("getTask", () => {
    it("should call request with correct endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "t1" });
      await api.getTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1");
    });
  });

  describe("createTask", () => {
    it("should call request with POST and task data", async () => {
      const taskData = {
        goal_id: "g1",
        title: "Test Task",
        duration_minutes: 30,
      };
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "t1" });
      await api.createTask(taskData);
      expect(api.request).toHaveBeenCalledWith("/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
      });
    });
  });

  describe("updateTask", () => {
    it("should call request with PATCH and update data", async () => {
      const updateData = { title: "Updated Task" };
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "t1" });
      await api.updateTask("t1", updateData);
      expect(api.request).toHaveBeenCalledWith("/tasks/t1", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    });
  });

  describe("deleteTask", () => {
    it("should call request with DELETE", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);
      await api.deleteTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1", {
        method: "DELETE",
      });
    });
  });

  describe("completeTask", () => {
    it("should call request with POST to complete endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        status: "completed",
      });
      await api.completeTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/complete", {
        method: "POST",
        body: JSON.stringify({}),
      });
    });

    it("should pass completed_at if provided", async () => {
      const completedAt = "2024-01-01T12:00:00Z";
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        status: "completed",
      });
      await api.completeTask("t1", { completed_at: completedAt });
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/complete", {
        method: "POST",
        body: JSON.stringify({ completed_at: completedAt }),
      });
    });
  });

  describe("skipTask", () => {
    it("should call request with POST to skip endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        status: "skipped",
      });
      await api.skipTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/skip", {
        method: "POST",
        body: JSON.stringify({}),
      });
    });

    it("should pass reason if provided", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        status: "skipped",
      });
      await api.skipTask("t1", { reason: "Not needed" });
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/skip", {
        method: "POST",
        body: JSON.stringify({ reason: "Not needed" }),
      });
    });
  });

  describe("reopenTask", () => {
    it("should call request with POST to reopen endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        status: "pending",
      });
      await api.reopenTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/reopen", {
        method: "POST",
        body: "{}",
      });
    });
  });

  describe("getTodayTasks", () => {
    it("should call request with timezone param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ tasks: [] });
      await api.getTodayTasks("America/New_York");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/view/today?timezone=America%2FNew_York",
      );
    });

    it("should add include_completed param when true", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ tasks: [] });
      await api.getTodayTasks("UTC", true);
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/view/today?timezone=UTC&include_completed=true",
      );
    });
  });

  describe("getTasksInRange", () => {
    it("should call request with POST and range data", async () => {
      const rangeRequest = {
        start_date: "2026-04-01",
        end_date: "2026-04-30",
      };
      (api.request as jest.Mock).mockResolvedValueOnce({ tasks: [] });
      await api.getTasksInRange(rangeRequest);
      expect(api.request).toHaveBeenCalledWith("/tasks/view/range", {
        method: "POST",
        body: JSON.stringify(rangeRequest),
      });
    });
  });

  describe("getTaskCompletions", () => {
    it("should call request with limit and offset params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ completions: [] });
      await api.getTaskCompletions("t1", 25, 10);
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/t1/completions?limit=25&offset=10",
      );
    });

    it("should use default limit and offset", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ completions: [] });
      await api.getTaskCompletions("t1");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/t1/completions?limit=50&offset=0",
      );
    });
  });

  describe("getTaskStats", () => {
    it("should call request with date range params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ stats: {} });
      await api.getTaskStats("t1", "2026-04-01", "2026-04-30");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/t1/stats?start=2026-04-01&end=2026-04-30",
      );
    });
  });

  describe("getCompletionHistory", () => {
    it("should call request with date range params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ history: [] });
      await api.getCompletionHistory("t1", "2026-04-01", "2026-04-30");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/t1/history?start=2026-04-01&end=2026-04-30",
      );
    });
  });

  describe("deleteFutureCompletions", () => {
    it("should call request with DELETE to future completions endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ deleted_count: 5 });
      await api.deleteFutureCompletions();
      expect(api.request).toHaveBeenCalledWith("/tasks/completions/future", {
        method: "DELETE",
      });
    });

    it("should add after_date param when provided", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ deleted_count: 3 });
      await api.deleteFutureCompletions("2026-04-15");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/completions/future?after_date=2026-04-15",
        {
          method: "DELETE",
        },
      );
    });
  });

  describe("getAnytimeTasks", () => {
    it("should call request with /tasks/view/anytime", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
      });
      await api.getAnytimeTasks();
      expect(api.request).toHaveBeenCalledWith("/tasks/view/anytime");
    });

    it("should add include_completed param when true", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        tasks: [],
        total: 0,
      });
      await api.getAnytimeTasks(true);
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/view/anytime?include_completed=true",
      );
    });
  });

  describe("getFutureCompletionsCount", () => {
    it("should call request with /tasks/completions/future/count", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ count: 5 });
      await api.getFutureCompletionsCount();
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/completions/future/count",
      );
    });

    it("should add after_date param when provided", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ count: 3 });
      await api.getFutureCompletionsCount("2026-04-15");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/completions/future/count?after_date=2026-04-15",
      );
    });
  });

  describe("reorderTask", () => {
    it("should call request with PATCH to reorder endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        task: { id: "task-1", sort_order: 2 },
      });
      await api.reorderTask("task-1", { new_position: 2 });
      expect(api.request).toHaveBeenCalledWith("/tasks/task-1/reorder", {
        method: "PATCH",
        body: JSON.stringify({ new_position: 2 }),
      });
    });
  });

  describe("createBulkCompletions", () => {
    it("should call request with POST to bulk completions endpoint", async () => {
      const mockResponse = {
        task_id: "task-1",
        created_count: 5,
        start_date_updated: false,
      };
      (api.request as jest.Mock).mockResolvedValueOnce(mockResponse);

      const data = {
        entries: [
          { date: "2024-01-01", status: "completed" as const },
          { date: "2024-01-02", status: "skipped" as const },
        ],
      };

      const result = await api.createBulkCompletions("task-1", data);

      expect(api.request).toHaveBeenCalledWith(
        "/tasks/task-1/completions/bulk",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include update_start_date when provided", async () => {
      const mockResponse = {
        task_id: "task-1",
        created_count: 3,
        start_date_updated: true,
      };
      (api.request as jest.Mock).mockResolvedValueOnce(mockResponse);

      const data = {
        entries: [{ date: "2024-01-01", status: "completed" as const }],
        update_start_date: "2024-01-01",
      };

      const result = await api.createBulkCompletions("task-1", data);

      expect(api.request).toHaveBeenCalledWith(
        "/tasks/task-1/completions/bulk",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      expect(result.start_date_updated).toBe(true);
    });
  });

  describe("deleteMockCompletions", () => {
    it("should call request with DELETE to mock completions endpoint", async () => {
      const mockResponse = {
        task_id: "task-1",
        deleted_count: 10,
      };
      (api.request as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await api.deleteMockCompletions("task-1");

      expect(api.request).toHaveBeenCalledWith(
        "/tasks/task-1/completions/mock",
        {
          method: "DELETE",
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should return deleted_count of 0 when no mock completions exist", async () => {
      const mockResponse = {
        task_id: "task-1",
        deleted_count: 0,
      };
      (api.request as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await api.deleteMockCompletions("task-1");

      expect(result.deleted_count).toBe(0);
    });
  });
});
