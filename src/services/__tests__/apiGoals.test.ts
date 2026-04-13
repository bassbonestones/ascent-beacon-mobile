import { goalsMethods } from "../apiGoals";
import type { ApiRequestOptions } from "../../types";

describe("apiGoals", () => {
  // Create a mock base class with proper typing
  class MockBase {
    request: jest.Mock<Promise<unknown>, [string, ApiRequestOptions?]> =
      jest.fn();
  }

  // Create the mixed class
  // @ts-expect-error - MockBase is a test mock that doesn't extend ApiServiceBase
  const MixedClass = goalsMethods(MockBase);
  let api: InstanceType<typeof MixedClass>;

  beforeEach(() => {
    api = new MixedClass();
    jest.clearAllMocks();
  });

  describe("getGoals", () => {
    it("should call request with /goals when no params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals();
      expect(api.request).toHaveBeenCalledWith("/goals");
    });

    it("should add priority_id param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals({ priority_id: "p1" });
      expect(api.request).toHaveBeenCalledWith("/goals?priority_id=p1");
    });

    it("should add status param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals({ status: "in_progress" });
      expect(api.request).toHaveBeenCalledWith("/goals?status=in_progress");
    });

    it("should add include_completed param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals({ include_completed: true });
      expect(api.request).toHaveBeenCalledWith("/goals?include_completed=true");
    });

    it("should add parent_only param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals({ parent_only: true });
      expect(api.request).toHaveBeenCalledWith("/goals?parent_only=true");
    });

    it("should add past_target_date param", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals({ past_target_date: true });
      expect(api.request).toHaveBeenCalledWith("/goals?past_target_date=true");
    });

    it("should combine multiple params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals({
        include_completed: true,
        parent_only: false,
        status: "completed",
      });
      expect(api.request).toHaveBeenCalledWith(
        "/goals?status=completed&include_completed=true&parent_only=false",
      );
    });

    it("should add paused and archived include params", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ goals: [] });
      await api.getGoals({ include_paused: true, include_archived: true });
      expect(api.request).toHaveBeenCalledWith(
        "/goals?include_paused=true&include_archived=true",
      );
    });
  });

  describe("getGoal", () => {
    it("should call request with correct endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.getGoal("g1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1");
    });
  });

  describe("getGoalTree", () => {
    it("should call request with tree endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        children: [],
      });
      await api.getGoalTree("g1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1/tree");
    });
  });

  describe("createGoal", () => {
    it("should call request with POST and goal data", async () => {
      const goalData = { title: "Test Goal" };
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.createGoal(goalData);
      expect(api.request).toHaveBeenCalledWith("/goals", {
        method: "POST",
        body: JSON.stringify(goalData),
      });
    });
  });

  describe("updateGoal", () => {
    it("should call request with PATCH and update data", async () => {
      const updateData = { title: "Updated Title" };
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.updateGoal("g1", updateData);
      expect(api.request).toHaveBeenCalledWith("/goals/g1", {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    });
  });

  describe("updateGoalStatus", () => {
    it("should call request with PATCH to status endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        status: "completed",
      });
      await api.updateGoalStatus("g1", "completed");
      expect(api.request).toHaveBeenCalledWith("/goals/g1/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
    });
  });

  describe("deleteGoal", () => {
    it("should call request with DELETE", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);
      await api.deleteGoal("g1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1", {
        method: "DELETE",
      });
    });
  });

  describe("setGoalPriorities", () => {
    it("should call request with POST and priority IDs", async () => {
      const priorityIds = ["p1", "p2"];
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.setGoalPriorities("g1", priorityIds);
      expect(api.request).toHaveBeenCalledWith("/goals/g1/priorities", {
        method: "POST",
        body: JSON.stringify({ priority_ids: priorityIds }),
      });
    });
  });

  describe("addGoalPriority", () => {
    it("should call request with POST to priority endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.addGoalPriority("g1", "p1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1/priorities/p1", {
        method: "POST",
      });
    });
  });

  describe("removeGoalPriority", () => {
    it("should call request with DELETE to priority endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.removeGoalPriority("g1", "p1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1/priorities/p1", {
        method: "DELETE",
      });
    });
  });

  describe("rescheduleGoals", () => {
    it("should call request with POST to reschedule endpoint", async () => {
      const request = {
        goal_updates: [{ goal_id: "g1", new_target_date: "2026-05-01" }],
      };
      (api.request as jest.Mock).mockResolvedValueOnce({
        goals: [],
        reschedule_count: 0,
      });
      await api.rescheduleGoals(request);
      expect(api.request).toHaveBeenCalledWith("/goals/reschedule", {
        method: "POST",
        body: JSON.stringify(request),
      });
    });
  });

  describe("archive endpoints", () => {
    it("should call archive-preview endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({
        goal_id: "g1",
        subtree_goal_ids: ["g1"],
        tasks_requiring_resolution: [],
      });
      await api.previewArchive("g1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1/archive-preview");
    });

    it("should call archive endpoint with payload", async () => {
      const payload = {
        tracking_mode: "failed" as const,
        task_resolutions: [{ task_id: "t1", action: "pause_task" as const }],
      };
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.archiveGoal("g1", payload);
      expect(api.request).toHaveBeenCalledWith("/goals/g1/archive", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    });

    it("should call unpause endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.unpauseGoal("g1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1/unpause", {
        method: "POST",
      });
    });

    it("should call pause endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "g1" });
      await api.pauseGoal("g1");
      expect(api.request).toHaveBeenCalledWith("/goals/g1/pause", {
        method: "POST",
      });
    });
  });
});
