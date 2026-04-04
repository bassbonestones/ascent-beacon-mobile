import { valuesMethods } from "../apiValues";

describe("apiValues", () => {
  // Create a mock base class
  class MockBase {
    request = jest.fn();
  }

  // Create the mixed class
  const MixedClass = valuesMethods(MockBase);
  let api;

  beforeEach(() => {
    api = new MixedClass();
    jest.clearAllMocks();
  });

  describe("getValues", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ values: [] });
      await api.getValues();
      expect(api.request).toHaveBeenCalledWith("/values");
    });

    it("should return values from response", async () => {
      const mockValues = [{ id: "v1" }, { id: "v2" }];
      api.request.mockResolvedValueOnce({ values: mockValues });
      const result = await api.getValues();
      expect(result.values).toEqual(mockValues);
    });
  });

  describe("createValue", () => {
    it("should call request with POST method and value data", async () => {
      const valueData = { statement: "Test value", weight_raw: 1 };
      api.request.mockResolvedValueOnce({ id: "new-v" });
      await api.createValue(valueData);
      expect(api.request).toHaveBeenCalledWith("/values", {
        method: "POST",
        body: JSON.stringify(valueData),
      });
    });

    it("should return created value", async () => {
      const createdValue = { id: "v1", statement: "Test" };
      api.request.mockResolvedValueOnce(createdValue);
      const result = await api.createValue({ statement: "Test" });
      expect(result).toEqual(createdValue);
    });
  });

  describe("updateValue", () => {
    it("should call request with PUT method and correct endpoint", async () => {
      const valueData = { statement: "Updated", weight_raw: 2 };
      api.request.mockResolvedValueOnce({ id: "v1" });
      await api.updateValue("v1", valueData);
      expect(api.request).toHaveBeenCalledWith("/values/v1", {
        method: "PUT",
        body: JSON.stringify(valueData),
      });
    });
  });

  describe("deleteValue", () => {
    it("should call request with DELETE method", async () => {
      api.request.mockResolvedValueOnce();
      await api.deleteValue("v1");
      expect(api.request).toHaveBeenCalledWith("/values/v1", {
        method: "DELETE",
      });
    });
  });

  describe("getValueHistory", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ revisions: [] });
      await api.getValueHistory("v1");
      expect(api.request).toHaveBeenCalledWith("/values/v1/history");
    });
  });

  describe("matchValue", () => {
    it("should call request with POST method and query", async () => {
      api.request.mockResolvedValueOnce({ match: null });
      await api.matchValue("test query");
      expect(api.request).toHaveBeenCalledWith("/values/match", {
        method: "POST",
        body: JSON.stringify({ query: "test query" }),
      });
    });
  });

  describe("acknowledgeValueInsight", () => {
    it("should call request with correct endpoint and body", async () => {
      api.request.mockResolvedValueOnce();
      await api.acknowledgeValueInsight("v1", "rev-1");
      expect(api.request).toHaveBeenCalledWith(
        "/values/v1/insights/acknowledge",
        {
          method: "POST",
          body: JSON.stringify({ revision_id: "rev-1" }),
        },
      );
    });

    it("should work without revision_id", async () => {
      api.request.mockResolvedValueOnce();
      await api.acknowledgeValueInsight("v1");
      expect(api.request).toHaveBeenCalledWith(
        "/values/v1/insights/acknowledge",
        {
          method: "POST",
          body: JSON.stringify({ revision_id: null }),
        },
      );
    });
  });

  describe("getLinkedPriorities", () => {
    it("should call request with correct endpoint", async () => {
      api.request.mockResolvedValueOnce({ priorities: [] });
      await api.getLinkedPriorities("v1");
      expect(api.request).toHaveBeenCalledWith("/values/v1/linked-priorities");
    });
  });
});
