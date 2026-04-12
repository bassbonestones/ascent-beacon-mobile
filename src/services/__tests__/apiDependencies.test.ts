import { dependenciesMethods } from "../apiDependencies";
import type { ApiRequestOptions } from "../../types";

describe("dependenciesMethods mixin", () => {
  // Create a mock base class with proper typing
  class MockBase {
    request: jest.Mock<Promise<unknown>, [string, ApiRequestOptions?]> =
      jest.fn();
  }

  // @ts-expect-error - MockBase is a test mock that doesn't extend ApiServiceBase
  const MixedClass = dependenciesMethods(MockBase);
  let api: InstanceType<typeof MixedClass>;

  beforeEach(() => {
    api = new MixedClass();
    jest.clearAllMocks();
  });

  describe("getDependencyRules", () => {
    it("returns rules from API response", async () => {
      const mockRules = {
        rules: [
          { id: "rule-1", upstream_task_id: "t1", downstream_task_id: "t2" },
        ],
        total: 1,
      };
      (api.request as jest.Mock).mockResolvedValueOnce(mockRules);

      const result = await api.getDependencyRules();

      expect(api.request).toHaveBeenCalledWith("/dependencies");
      expect(result).toEqual(mockRules);
    });

    it("passes upstream_task_id parameter when provided", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ rules: [], total: 0 });

      await api.getDependencyRules({ upstream_task_id: "task-1" });

      expect(api.request).toHaveBeenCalledWith(
        "/dependencies?upstream_task_id=task-1",
      );
    });

    it("passes downstream_task_id parameter when provided", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ rules: [], total: 0 });

      await api.getDependencyRules({ downstream_task_id: "task-2" });

      expect(api.request).toHaveBeenCalledWith(
        "/dependencies?downstream_task_id=task-2",
      );
    });

    it("passes task_id parameter when provided", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ rules: [], total: 0 });

      await api.getDependencyRules({ task_id: "task-id" });

      expect(api.request).toHaveBeenCalledWith(
        "/dependencies?task_id=task-id",
      );
    });

    it("passes multiple parameters when provided", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ rules: [], total: 0 });

      await api.getDependencyRules({
        upstream_task_id: "up-1",
        downstream_task_id: "down-1",
      });

      expect(api.request).toHaveBeenCalledWith(
        "/dependencies?upstream_task_id=up-1&downstream_task_id=down-1",
      );
    });
  });

  describe("getDependencyRule", () => {
    it("fetches a specific dependency rule", async () => {
      const mockRule = { id: "rule-1", upstream_task_id: "t1" };
      (api.request as jest.Mock).mockResolvedValueOnce(mockRule);

      const result = await api.getDependencyRule("rule-1");

      expect(api.request).toHaveBeenCalledWith("/dependencies/rule-1");
      expect(result).toEqual(mockRule);
    });
  });

  describe("createDependencyRule", () => {
    it("creates a new dependency rule", async () => {
      const newRule = {
        upstream_task_id: "upstream-1",
        downstream_task_id: "downstream-1",
        strength: "hard" as const,
        scope: "all_occurrences" as const,
      };
      const createdRule = { id: "new-rule-1", ...newRule };
      (api.request as jest.Mock).mockResolvedValueOnce(createdRule);

      const result = await api.createDependencyRule(newRule);

      expect(api.request).toHaveBeenCalledWith("/dependencies", {
        method: "POST",
        body: JSON.stringify(newRule),
      });
      expect(result).toEqual(createdRule);
    });
  });

  describe("updateDependencyRule", () => {
    it("updates an existing dependency rule", async () => {
      const updates = { strength: "soft" as const };
      const updatedRule = { id: "rule-1", strength: "soft" };
      (api.request as jest.Mock).mockResolvedValueOnce(updatedRule);

      const result = await api.updateDependencyRule("rule-1", updates);

      expect(api.request).toHaveBeenCalledWith("/dependencies/rule-1", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      expect(result).toEqual(updatedRule);
    });
  });

  describe("deleteDependencyRule", () => {
    it("deletes a dependency rule", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);

      await api.deleteDependencyRule("rule-1");

      expect(api.request).toHaveBeenCalledWith("/dependencies/rule-1", {
        method: "DELETE",
      });
    });
  });

  describe("validateDependency", () => {
    it("validates a potential dependency", async () => {
      const validationResult = {
        valid: true,
        would_create_cycle: false,
        reason: null,
        cycle_path: [],
      };
      (api.request as jest.Mock).mockResolvedValueOnce(validationResult);

      const result = await api.validateDependency({
        upstream_task_id: "upstream-1",
        downstream_task_id: "downstream-1",
      });

      expect(api.request).toHaveBeenCalledWith("/dependencies/validate", {
        method: "POST",
        body: JSON.stringify({
          upstream_task_id: "upstream-1",
          downstream_task_id: "downstream-1",
        }),
      });
      expect(result).toEqual(validationResult);
    });
  });

  describe("getDependencyStatus", () => {
    it("fetches dependency status for a task", async () => {
      const status = {
        task_id: "task-1",
        scheduled_for: null,
        dependencies: [],
        has_unmet_hard: false,
        has_unmet_soft: false,
        upstream: [],
        downstream: [],
        readiness: "ready",
      };
      (api.request as jest.Mock).mockResolvedValueOnce(status);

      const result = await api.getDependencyStatus("task-1");

      expect(api.request).toHaveBeenCalledWith(
        "/tasks/task-1/dependency-status",
      );
      expect(result).toEqual(status);
    });

    it("includes scheduled_for parameter when provided", async () => {
      const status = { task_id: "task-1", readiness: "ready" };
      (api.request as jest.Mock).mockResolvedValueOnce(status);

      const result = await api.getDependencyStatus(
        "task-1",
        "2024-01-15T10:00:00Z",
      );

      expect(api.request).toHaveBeenCalledWith(
        "/tasks/task-1/dependency-status?scheduled_for=2024-01-15T10%3A00%3A00Z",
      );
      expect(result).toEqual(status);
    });

    it("includes local_date when provided with scheduled_for", async () => {
      const status = { task_id: "task-1", readiness: "ready" };
      (api.request as jest.Mock).mockResolvedValueOnce(status);

      const result = await api.getDependencyStatus(
        "task-1",
        "2024-01-15T10:00:00Z",
        "2024-01-15",
      );

      expect(api.request).toHaveBeenCalledWith(
        "/tasks/task-1/dependency-status?scheduled_for=2024-01-15T10%3A00%3A00Z&local_date=2024-01-15",
      );
      expect(result).toEqual(status);
    });
  });
});
