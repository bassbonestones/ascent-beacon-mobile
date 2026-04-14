import { tasksMethods, DependencyBlockedError } from "../apiTasks";
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

    it("should include include_dependency_summary when true", async () => {
      await api.getTasks({
        client_today: "2026-04-07",
        include_dependency_summary: true,
      });
      expect(api.request).toHaveBeenCalledWith(
        "/tasks?client_today=2026-04-07&include_dependency_summary=true",
      );
    });

    it("should include client_timezone when provided", async () => {
      await api.getTasks({
        client_today: "2026-04-07",
        include_dependency_summary: true,
        client_timezone: "America/Chicago",
      });
      expect(api.request).toHaveBeenCalledWith(
        "/tasks?client_today=2026-04-07&include_dependency_summary=true&client_timezone=America%2FChicago",
      );
    });

    it("should include paused and archived flags when set", async () => {
      await api.getTasks({
        include_paused: true,
        include_archived: true,
      });
      expect(api.request).toHaveBeenCalledWith(
        "/tasks?include_paused=true&include_archived=true",
      );
    });
  });

  describe("getTask", () => {
    it("should call request with correct endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "t1" });
      await api.getTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1");
    });

    it("should append dependency summary query params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "t1" });
      await api.getTask("t1", {
        include_dependency_summary: true,
        client_today: "2026-04-08",
      });
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/t1?include_dependency_summary=true&client_today=2026-04-08",
      );
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

  describe("archiveTask", () => {
    it("should call request with POST to archive endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        record_state: "archived",
      });
      await api.archiveTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/archive", {
        method: "POST",
      });
    });
  });

  describe("unpauseTask", () => {
    it("should call request with POST to unpause endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "t1" });
      await api.unpauseTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/unpause", {
        method: "POST",
      });
    });
  });

  describe("pauseTask", () => {
    it("should call request with POST to pause endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "t1" });
      await api.pauseTask("t1");
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/pause", {
        method: "POST",
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

    it("should pass override fields", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        status: "completed",
      });
      await api.completeTask("t1", {
        override_confirm: true,
        override_reason: "Emergency",
      });
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/complete", {
        method: "POST",
        body: JSON.stringify({
          override_confirm: true,
          override_reason: "Emergency",
        }),
      });
    });
  });

  describe("completeTaskChain", () => {
    it("should POST complete-chain", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce([
        { id: "a", title: "A" },
        { id: "b", title: "B" },
      ]);
      const out = await api.completeTaskChain("t1", {
        local_date: "2026-04-01",
      });
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/complete-chain", {
        method: "POST",
        body: JSON.stringify({ local_date: "2026-04-01" }),
      });
      expect(out).toHaveLength(2);
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

    it("should pass confirm_proceed", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "t1",
        status: "skipped",
      });
      await api.skipTask("t1", { confirm_proceed: true });
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/skip", {
        method: "POST",
        body: JSON.stringify({ confirm_proceed: true }),
      });
    });

    it("should return skip preview shape", async () => {
      const preview = {
        status: "has_dependents" as const,
        affected_downstream: [],
      };
      (api.request as jest.Mock).mockResolvedValueOnce(preview);
      const out = await api.skipTask("t1");
      expect(out).toEqual(preview);
    });
  });

  describe("skipTaskChain", () => {
    it("should POST skip-chain with cascade_skip", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce([]);
      await api.skipTaskChain("t1", {
        reason: "x",
        cascade_skip: true,
      });
      expect(api.request).toHaveBeenCalledWith("/tasks/t1/skip-chain", {
        method: "POST",
        body: JSON.stringify({ reason: "x", cascade_skip: true }),
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

  describe("DependencyBlockedError", () => {
    it("builds message from blocker titles", () => {
      const err = new DependencyBlockedError({
        task_id: "t1",
        can_override: false,
        blockers: [
          { strength: "hard", is_met: false, upstream_task: { title: "A" } },
          { strength: "hard", is_met: false, upstream_task: { title: "B" } },
        ],
      } as never);
      expect(err.message).toContain("A");
      expect(err.message).toContain("B");
      expect(err.taskId).toBe("t1");
      expect(err.canOverride).toBe(false);
    });

    it("uses Unknown task when upstream title missing", () => {
      const err = new DependencyBlockedError({
        task_id: "t2",
        can_override: true,
        blockers: [{ strength: "hard", is_met: false, upstream_task: undefined }],
      } as never);
      expect(err.message).toContain("Unknown task");
      expect(err.canOverride).toBe(true);
    });
  });

  describe("occurrence order APIs", () => {
    it("reorderOccurrences posts body", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ updated: true });
      const body = { date: "2026-04-01", ordered_task_ids: ["a", "b"] };
      await api.reorderOccurrences(body as never);
      expect(api.request).toHaveBeenCalledWith("/tasks/reorder-occurrences", {
        method: "POST",
        body: JSON.stringify(body),
      });
    });

    it("getOccurrenceOrder requests day endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ order: [] });
      await api.getOccurrenceOrder("2026-04-02");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/occurrence-order?date=2026-04-02",
      );
    });

    it("getOccurrenceOrderRange requests range endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        permanent_order: [],
        days: {},
      });
      await api.getOccurrenceOrderRange("2026-04-01", "2026-04-07");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/occurrence-order/range?start_date=2026-04-01&end_date=2026-04-07",
      );
    });

    it("clearOccurrenceOrder sends DELETE", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);
      await api.clearOccurrenceOrder("2026-04-03");
      expect(api.request).toHaveBeenCalledWith("/tasks/occurrence-order/2026-04-03", {
        method: "DELETE",
      });
    });

    it("clearOccurrenceOrderFrom sends DELETE", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);
      await api.clearOccurrenceOrderFrom("2026-04-04");
      expect(api.request).toHaveBeenCalledWith(
        "/tasks/occurrence-order/from/2026-04-04",
        { method: "DELETE" },
      );
    });

    it("getPermanentOrder delegates to range with single day", async () => {
      jest.useFakeTimers({ now: new Date("2026-05-10T12:00:00Z") });
      try {
        (api.request as jest.Mock).mockResolvedValueOnce({ permanent_order: ["x"] });
        const po = await api.getPermanentOrder();
        expect(po).toEqual(["x"]);
        expect(api.request).toHaveBeenCalledWith(
          "/tasks/occurrence-order/range?start_date=2026-05-10&end_date=2026-05-10",
        );
      } finally {
        jest.useRealTimers();
      }
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
