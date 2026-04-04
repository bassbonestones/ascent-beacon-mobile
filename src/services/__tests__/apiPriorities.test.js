import { prioritiesMethods } from "../apiPriorities";

describe("apiPriorities", () => {
  // Create a mock base class
  class MockBase {
    request = jest.fn();
  }

  // Create the mixed class
  const MixedClass = prioritiesMethods(MockBase);
  let api;

  beforeEach(() => {
    api = new MixedClass();
    jest.clearAllMocks();
  });

  describe("getPriorities", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ priorities: [] });
      await api.getPriorities();
      expect(api.request).toHaveBeenCalledWith("/priorities");
    });
  });

  describe("createPriority", () => {
    it("should call request with POST method and priority data", async () => {
      const priorityData = { title: "Test", why_matters: "Because" };
      api.request.mockResolvedValueOnce({ id: "p1" });
      await api.createPriority(priorityData);
      expect(api.request).toHaveBeenCalledWith("/priorities", {
        method: "POST",
        body: JSON.stringify(priorityData),
      });
    });
  });

  describe("validatePriority", () => {
    it("should call request with POST to validate endpoint", async () => {
      const data = { title: "Test" };
      api.request.mockResolvedValueOnce({ valid: true });
      await api.validatePriority(data);
      expect(api.request).toHaveBeenCalledWith("/priorities/validate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    });
  });

  describe("getPriorityHistory", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ revisions: [] });
      await api.getPriorityHistory("p1");
      expect(api.request).toHaveBeenCalledWith("/priorities/p1/history");
    });
  });

  describe("createPriorityRevision", () => {
    it("should call request with POST to revisions endpoint", async () => {
      const revisionData = { title: "Updated" };
      api.request.mockResolvedValueOnce({ id: "rev1" });
      await api.createPriorityRevision("p1", revisionData);
      expect(api.request).toHaveBeenCalledWith("/priorities/p1/revisions", {
        method: "POST",
        body: JSON.stringify(revisionData),
      });
    });
  });

  describe("anchorPriority", () => {
    it("should call request with POST to anchor endpoint", async () => {
      api.request.mockResolvedValueOnce();
      await api.anchorPriority("p1");
      expect(api.request).toHaveBeenCalledWith("/priorities/p1/anchor", {
        method: "POST",
        body: JSON.stringify({}),
      });
    });
  });

  describe("unanchorPriority", () => {
    it("should call request with POST to unanchor endpoint", async () => {
      api.request.mockResolvedValueOnce();
      await api.unanchorPriority("p1");
      expect(api.request).toHaveBeenCalledWith("/priorities/p1/unanchor", {
        method: "POST",
        body: JSON.stringify({}),
      });
    });
  });

  describe("checkPriorityStatus", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ linked_values: [] });
      await api.checkPriorityStatus("p1");
      expect(api.request).toHaveBeenCalledWith("/priorities/p1/check-status");
    });
  });

  describe("deletePriority", () => {
    it("should call request with DELETE method", async () => {
      api.request.mockResolvedValueOnce();
      await api.deletePriority("p1");
      expect(api.request).toHaveBeenCalledWith("/priorities/p1", {
        method: "DELETE",
      });
    });
  });

  describe("getPriorityValueLinks", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ links: [] });
      await api.getPriorityValueLinks("rev1");
      expect(api.request).toHaveBeenCalledWith(
        "/priority-revisions/rev1/links",
      );
    });
  });

  describe("stashPriority", () => {
    it("should call request with POST and is_stashed in body", async () => {
      api.request.mockResolvedValueOnce();
      await api.stashPriority("p1", true);
      expect(api.request).toHaveBeenCalledWith("/priorities/p1/stash", {
        method: "POST",
        body: JSON.stringify({ is_stashed: true }),
      });
    });

    it("should unstash priority when is_stashed is false", async () => {
      api.request.mockResolvedValueOnce();
      await api.stashPriority("p1", false);
      expect(api.request).toHaveBeenCalledWith("/priorities/p1/stash", {
        method: "POST",
        body: JSON.stringify({ is_stashed: false }),
      });
    });
  });

  describe("getStashedPriorities", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ priorities: [] });
      await api.getStashedPriorities();
      expect(api.request).toHaveBeenCalledWith("/priorities/stashed");
    });
  });
});
