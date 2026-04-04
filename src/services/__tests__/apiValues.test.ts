import { valuesMethods } from "../apiValues";
import type { ApiRequestOptions } from "../../types";

describe("apiValues", () => {
  // Create a mock base class with proper typing
  class MockBase {
    request: jest.Mock<Promise<unknown>, [string, ApiRequestOptions?]> =
      jest.fn();
  }

  // Create the mixed class
  // @ts-expect-error - MockBase is a test mock that doesn't extend ApiServiceBase
  const MixedClass = valuesMethods(MockBase);
  let api: InstanceType<typeof MixedClass>;

  beforeEach(() => {
    api = new MixedClass();
    jest.clearAllMocks();
  });

  describe("getValues", () => {
    it("should call request with correct endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ values: [] });
      await api.getValues();
      expect(api.request).toHaveBeenCalledWith("/values");
    });

    it("should return values from response", async () => {
      const mockValues = [{ id: "v1" }, { id: "v2" }];
      (api.request as jest.Mock).mockResolvedValueOnce({ values: mockValues });
      const result = await api.getValues();
      expect(result.values).toEqual(mockValues);
    });
  });

  describe("createValue", () => {
    it("should call request with POST method and value data", async () => {
      const valueData = { statement: "Test value", weight_raw: 1 };
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "new-v" });
      await api.createValue(valueData);
      expect(api.request).toHaveBeenCalledWith("/values", {
        method: "POST",
        body: JSON.stringify(valueData),
      });
    });

    it("should return created value", async () => {
      const createdValue = { id: "v1", statement: "Test" };
      (api.request as jest.Mock).mockResolvedValueOnce(createdValue);
      const result = await api.createValue({
        statement: "Test",
        weight_raw: 1,
      });
      expect(result).toEqual(createdValue);
    });
  });

  describe("updateValue", () => {
    it("should call request with PUT method and correct endpoint", async () => {
      const valueData = { statement: "Updated", weight_raw: 2 };
      (api.request as jest.Mock).mockResolvedValueOnce({ id: "v1" });
      await api.updateValue("v1", valueData);
      expect(api.request).toHaveBeenCalledWith("/values/v1", {
        method: "PUT",
        body: JSON.stringify(valueData),
      });
    });
  });

  describe("deleteValue", () => {
    it("should call request with DELETE method", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);
      await api.deleteValue("v1");
      expect(api.request).toHaveBeenCalledWith("/values/v1", {
        method: "DELETE",
      });
    });
  });

  describe("getValueHistory", () => {
    it("should call request with correct endpoint", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ revisions: [] });
      await api.getValueHistory("v1");
      expect(api.request).toHaveBeenCalledWith("/values/v1/history");
    });
  });

  describe("matchValue", () => {
    it("should call request with POST method and query", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce({ match: null });
      await api.matchValue("test query");
      expect(api.request).toHaveBeenCalledWith("/values/match", {
        method: "POST",
        body: JSON.stringify({ query: "test query" }),
      });
    });
  });

  describe("acknowledgeValueInsight", () => {
    it("should call request with correct endpoint and body", async () => {
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);
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
      (api.request as jest.Mock).mockResolvedValueOnce(undefined);
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
      (api.request as jest.Mock).mockResolvedValueOnce({ priorities: [] });
      await api.getLinkedPriorities("v1");
      expect(api.request).toHaveBeenCalledWith("/values/v1/linked-priorities");
    });
  });
});
