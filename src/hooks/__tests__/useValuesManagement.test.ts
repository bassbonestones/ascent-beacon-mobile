import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import useValuesManagement from "../useValuesManagement";
import api from "../../services/api";
import type { Value, ValueRevision } from "../../types";
import type { WeightItem } from "../useWeightAdjustment";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getValues: jest.fn(),
    createValue: jest.fn(),
    deleteValue: jest.fn(),
    updateValue: jest.fn(),
    getPriorities: jest.fn(),
    checkPriorityStatus: jest.fn(),
    stashPriority: jest.fn(),
    deletePriority: jest.fn(),
    acknowledgeValueInsight: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

interface MockNavigation {
  navigate: jest.Mock;
}

// Helper to create a proper mock revision
const createMockRevision = (
  id: string,
  valueId: string,
  statement: string,
  weightNormalized: number,
): ValueRevision => ({
  id,
  value_id: valueId,
  statement,
  weight_raw: 1,
  weight_normalized: weightNormalized,
  is_active: true,
  origin: "declared",
  created_at: new Date().toISOString(),
});

// Helper to create a proper mock value
const createMockValue = (
  id: string,
  statement: string,
  weightNormalized: number,
): Value => {
  const revisionId = `r-${id}`;
  return {
    id,
    user_id: "user-1",
    active_revision_id: revisionId,
    revisions: [
      createMockRevision(revisionId, id, statement, weightNormalized),
    ],
    insights: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

describe("useValuesManagement", () => {
  const mockNavigation: MockNavigation = { navigate: jest.fn() };

  const mockValues: Value[] = [
    createMockValue("v1", "Value 1", 33),
    createMockValue("v2", "Value 2", 33),
    createMockValue("v3", "Value 3", 34),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getValues.mockResolvedValue({ values: mockValues });
    mockedApi.getPriorities.mockResolvedValue({ priorities: [] });
  });

  describe("initialization", () => {
    it("should load values on mount", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedApi.getValues).toHaveBeenCalled();
      expect(result.current.values).toHaveLength(3);
    });

    it("should initialize with empty values array", () => {
      mockedApi.getValues.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      expect(result.current.values).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it("should initialize editing state as null", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.editingValueId).toBeNull();
      expect(result.current.editingStatement).toBe("");
    });

    it("should show alert on load error", async () => {
      mockedApi.getValues.mockRejectedValueOnce(new Error("Load failed"));
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to load values",
      );
    });
  });

  describe("handleCreateValue", () => {
    it("should show alert for empty statement", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleCreateValue();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Required",
        "Please enter a value statement",
      );
    });

    it("should show alert when at 6 values limit", async () => {
      const sixValues: Value[] = Array.from({ length: 6 }, (_, i) =>
        createMockValue(`v${i}`, `Value ${i}`, 16.67),
      );
      mockedApi.getValues.mockResolvedValueOnce({ values: sixValues });

      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.values).toHaveLength(6);
      });

      act(() => {
        result.current.setNewStatement("New value");
      });

      await act(async () => {
        await result.current.handleCreateValue();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Limit Reached",
        "You can have a maximum of 6 values",
      );
    });

    it("should create value and reload", async () => {
      mockedApi.createValue.mockResolvedValueOnce(
        createMockValue("new-v", "New value statement", 100),
      );
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setNewStatement("New value statement");
      });

      await act(async () => {
        await result.current.handleCreateValue();
      });

      expect(mockedApi.createValue).toHaveBeenCalledWith({
        statement: "New value statement",
        weight_raw: 1,
        origin: "declared",
      });
      expect(result.current.newStatement).toBe(""); // Should clear after create
    });

    it("should show alert on create error", async () => {
      mockedApi.createValue.mockRejectedValueOnce(new Error("Create failed"));
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setNewStatement("New value");
      });

      await act(async () => {
        await result.current.handleCreateValue();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to create value",
      );
    });
  });

  describe("handleDeleteValue", () => {
    it("should show alert when at minimum (3) values", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.values).toHaveLength(3);
      });

      await act(async () => {
        await result.current.handleDeleteValue("v1");
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Minimum Required",
        "You must have at least 3 values",
      );
    });

    it("should show confirmation dialog when more than 3 values", async () => {
      const fourValues: Value[] = [
        ...mockValues,
        createMockValue("v4", "Value 4", 25),
      ];
      mockedApi.getValues.mockResolvedValueOnce({ values: fourValues });

      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.values).toHaveLength(4);
      });

      await act(async () => {
        await result.current.handleDeleteValue("v1");
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Value",
        "Are you sure? This will remove this value and rebalance your weights.",
        expect.any(Array),
      );
    });
  });

  describe("handleStartEdit", () => {
    it("should set editing state for value", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleStartEdit(mockValues[0]);
      });

      expect(result.current.editingValueId).toBe("v1");
      expect(result.current.editingStatement).toBe("Value 1");
    });

    it("should not set editing state if no active revision", async () => {
      const valueNoRevision: Value = {
        id: "vx",
        user_id: "user-1",
        active_revision_id: "rx",
        revisions: [],
        insights: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleStartEdit(valueNoRevision);
      });

      expect(result.current.editingValueId).toBeNull();
    });
  });

  describe("handleCancelEdit", () => {
    it("should clear editing state", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleStartEdit(mockValues[0]);
      });
      expect(result.current.editingValueId).toBe("v1");

      act(() => {
        result.current.handleCancelEdit();
      });

      expect(result.current.editingValueId).toBeNull();
      expect(result.current.editingStatement).toBe("");
    });
  });

  describe("handleSaveEdit", () => {
    it("should show alert for empty statement", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleStartEdit(mockValues[0]);
      });
      act(() => {
        result.current.setEditingStatement("");
      });

      await act(async () => {
        await result.current.handleSaveEdit();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Required",
        "Please enter a value statement",
      );
    });

    it("should call API and show success on update", async () => {
      mockedApi.updateValue.mockResolvedValueOnce(
        createMockValue("v1", "Updated Value 1", 33),
      );
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleStartEdit(mockValues[0]);
      });
      act(() => {
        result.current.setEditingStatement("Updated Value 1");
      });

      await act(async () => {
        await result.current.handleSaveEdit();
      });

      expect(mockedApi.updateValue).toHaveBeenCalledWith("v1", {
        statement: "Updated Value 1",
        weight_raw: 1,
        origin: "declared",
      });
    });

    it("should show alert on update error", async () => {
      mockedApi.updateValue.mockRejectedValueOnce(new Error("Update failed"));
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleStartEdit(mockValues[0]);
      });
      act(() => {
        result.current.setEditingStatement("Updated");
      });

      await act(async () => {
        await result.current.handleSaveEdit();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to update value",
      );
    });
  });

  describe("handleSelectExample", () => {
    it("should set new statement and hide examples", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setShowExamples(true);
      });
      expect(result.current.showExamples).toBe(true);

      act(() => {
        result.current.handleSelectExample("Example value");
      });

      expect(result.current.newStatement).toBe("Example value");
      expect(result.current.showExamples).toBe(false);
    });
  });

  describe("handleSaveWeights", () => {
    it("should update weights for all values", async () => {
      mockedApi.updateValue.mockResolvedValue({} as Value);
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const weights: WeightItem[] = [
        { valueId: "v1", statement: "Value 1", weight: 2 },
        { valueId: "v2", statement: "Value 2", weight: 1 },
        { valueId: "v3", statement: "Value 3", weight: 0.5 },
      ];

      await act(async () => {
        await result.current.handleSaveWeights(weights);
      });

      expect(mockedApi.updateValue).toHaveBeenCalledTimes(3);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        "Weights updated successfully",
      );
    });

    it("should throw error on update failure", async () => {
      mockedApi.updateValue.mockRejectedValueOnce(new Error("Update failed"));
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const weights: WeightItem[] = [
        { valueId: "v1", statement: "Value 1", weight: 2 },
      ];

      await expect(
        act(async () => {
          await result.current.handleSaveWeights(weights);
        }),
      ).rejects.toThrow();
    });
  });

  describe("handleKeepBoth", () => {
    it("should call API and remove insight from state", async () => {
      const valuesWithInsight: Value[] = [
        {
          ...mockValues[0],
          insights: [
            {
              type: "similarity",
              message: "Similar to another value",
              similar_value_id: "v2",
            },
          ],
        },
        ...mockValues.slice(1),
      ];
      mockedApi.getValues.mockResolvedValueOnce({ values: valuesWithInsight });
      mockedApi.acknowledgeValueInsight.mockResolvedValueOnce(
        undefined as unknown as Value,
      );

      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleKeepBoth("v1");
      });

      expect(mockedApi.acknowledgeValueInsight).toHaveBeenCalledWith("v1");
    });
  });

  describe("setters", () => {
    it("should update showExamples", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setShowExamples(true);
      });

      expect(result.current.showExamples).toBe(true);
    });

    it("should update newStatement", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setNewStatement("New statement");
      });

      expect(result.current.newStatement).toBe("New statement");
    });

    it("should update showWeightsModal", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setShowWeightsModal(true);
      });

      expect(result.current.showWeightsModal).toBe(true);
    });

    it("should update editingStatement", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setEditingStatement("Editing text");
      });

      expect(result.current.editingStatement).toBe("Editing text");
    });
  });

  describe("getActiveRevision", () => {
    it("should return active revision for value", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const revision = result.current.getActiveRevision(mockValues[0]);

      expect(revision?.id).toBe("r-v1");
      expect(revision?.statement).toBe("Value 1");
    });

    it("should return null for value without matching revision", async () => {
      const valueNoMatch: Value = {
        id: "vx",
        user_id: "user-1",
        active_revision_id: "ry",
        revisions: [createMockRevision("rz", "vx", "No Match Value", 100)],
        insights: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const revision = result.current.getActiveRevision(valueNoMatch);

      expect(revision).toBeNull();
    });
  });
});
