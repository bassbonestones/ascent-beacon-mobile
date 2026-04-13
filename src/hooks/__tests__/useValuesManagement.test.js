import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import useValuesManagement from "../useValuesManagement";
import api from "../../services/api";

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

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("useValuesManagement", () => {
  const mockNavigation = { navigate: jest.fn() };

  const mockValues = [
    {
      id: "v1",
      active_revision_id: "r1",
      revisions: [
        { id: "r1", statement: "Value 1", weight_raw: 1, origin: "declared" },
      ],
      insights: [],
    },
    {
      id: "v2",
      active_revision_id: "r2",
      revisions: [
        { id: "r2", statement: "Value 2", weight_raw: 1, origin: "declared" },
      ],
      insights: [],
    },
    {
      id: "v3",
      active_revision_id: "r3",
      revisions: [
        { id: "r3", statement: "Value 3", weight_raw: 1, origin: "declared" },
      ],
      insights: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.getValues.mockResolvedValue({ values: mockValues });
    api.getPriorities.mockResolvedValue({ priorities: [] });
  });

  describe("initialization", () => {
    it("should load values on mount", async () => {
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.getValues).toHaveBeenCalled();
      expect(result.current.values).toHaveLength(3);
    });

    it("should initialize with empty values array", () => {
      api.getValues.mockImplementation(() => new Promise(() => {})); // Never resolves
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
      api.getValues.mockRejectedValueOnce(new Error("Load failed"));
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
      const sixValues = Array.from({ length: 6 }, (_, i) => ({
        id: `v${i}`,
        active_revision_id: `r${i}`,
        revisions: [{ id: `r${i}`, statement: `Value ${i}` }],
        insights: [],
      }));
      api.getValues.mockResolvedValueOnce({ values: sixValues });

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
      api.createValue.mockResolvedValueOnce({ id: "new-v", insights: [] });
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

      expect(api.createValue).toHaveBeenCalledWith({
        statement: "New value statement",
        weight_raw: 1,
        origin: "declared",
      });
      expect(result.current.newStatement).toBe(""); // Should clear after create
    });

    it("should show alert on create error", async () => {
      api.createValue.mockRejectedValueOnce(new Error("Create failed"));
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
      const fourValues = [
        ...mockValues,
        {
          id: "v4",
          active_revision_id: "r4",
          revisions: [{ id: "r4", statement: "Value 4" }],
          insights: [],
        },
      ];
      api.getValues.mockResolvedValueOnce({ values: fourValues });

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
      const valueNoRevision = {
        id: "vx",
        active_revision_id: "rx",
        revisions: [],
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
      api.updateValue.mockResolvedValueOnce({ id: "v1", impact_info: {} });
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

      expect(api.updateValue).toHaveBeenCalledWith("v1", {
        statement: "Updated Value 1",
        weight_raw: 1,
        origin: "declared",
      });
    });

    it("should show alert on update error", async () => {
      api.updateValue.mockRejectedValueOnce(new Error("Update failed"));
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
      api.updateValue.mockResolvedValue({});
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const weights = [
        { valueId: "v1", weight: 2 },
        { valueId: "v2", weight: 1 },
        { valueId: "v3", weight: 0.5 },
      ];

      await act(async () => {
        await result.current.handleSaveWeights(weights);
      });

      expect(api.updateValue).toHaveBeenCalledTimes(3);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        "Weights updated successfully",
      );
    });

    it("should throw error on update failure", async () => {
      api.updateValue.mockRejectedValueOnce(new Error("Update failed"));
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const weights = [{ valueId: "v1", weight: 2 }];

      await expect(
        act(async () => {
          await result.current.handleSaveWeights(weights);
        }),
      ).rejects.toThrow();
    });
  });

  describe("handleKeepBoth", () => {
    it("should call API and remove insight from state", async () => {
      const valuesWithInsight = [
        { ...mockValues[0], insights: [{ similar_value_id: "v2" }] },
        ...mockValues.slice(1),
      ];
      api.getValues.mockResolvedValueOnce({ values: valuesWithInsight });
      api.acknowledgeValueInsight.mockResolvedValueOnce();

      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleKeepBoth("v1");
      });

      expect(api.acknowledgeValueInsight).toHaveBeenCalledWith("v1");
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

      expect(revision).toEqual({
        id: "r1",
        statement: "Value 1",
        weight_raw: 1,
        origin: "declared",
      });
    });

    it("should return null for value without matching revision", async () => {
      const valueNoMatch = {
        id: "vx",
        active_revision_id: "ry",
        revisions: [{ id: "rz" }],
      };
      const { result } = renderHook(() => useValuesManagement(mockNavigation));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const revision = result.current.getActiveRevision(valueNoMatch);

      expect(revision).toBeUndefined();
    });
  });
});
