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
      });
    });
  });
});
