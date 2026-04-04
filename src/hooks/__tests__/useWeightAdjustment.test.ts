import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useWeightAdjustment from "../useWeightAdjustment";
import type { Value, ValueRevision } from "../../types";

jest.spyOn(Alert, "alert").mockImplementation(() => {});

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
const createTestValue = (
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

describe("useWeightAdjustment", () => {
  const mockValues: Value[] = [
    createTestValue("v1", "Value 1", 50),
    createTestValue("v2", "Value 2", 30),
    createTestValue("v3", "Value 3", 20),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize weights from values", () => {
    const onSave = jest.fn();
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    expect(result.current.weights).toHaveLength(3);
    expect(result.current.weights[0].valueId).toBe("v1");
    expect(result.current.weights[0].weight).toBe(50);
    expect(result.current.weights[1].weight).toBe(30);
    expect(result.current.weights[2].weight).toBe(20);
  });

  it("should calculate total weight correctly", () => {
    const onSave = jest.fn();
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    expect(result.current.totalWeight).toBe(100);
  });

  it("should detect zero weights", () => {
    const valuesWithZero: Value[] = [
      createTestValue("v1", "Value 1", 0),
      createTestValue("v2", "Value 2", 100),
    ];
    const onSave = jest.fn();
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: valuesWithZero } },
    );

    expect(result.current.hasZeroWeight).toBe(true);
  });

  it("should handle weight changes and redistribute others proportionally", () => {
    const onSave = jest.fn();
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    act(() => {
      result.current.handleWeightChange(0, 70); // Change first value from 50 to 70
    });

    expect(result.current.weights[0].weight).toBe(70);
    // Remaining 30 should be distributed proportionally among others (30/50=0.6, 20/50=0.4)
    expect(result.current.weights[1].weight).toBeCloseTo(18, 1); // 30 * 0.6
    expect(result.current.weights[2].weight).toBeCloseTo(12, 1); // 30 * 0.4
    expect(result.current.totalWeight).toBeCloseTo(100, 1);
  });

  it("should reset weights to equal distribution", () => {
    const onSave = jest.fn();
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    act(() => {
      result.current.handleResetToEqual();
    });

    const expectedWeight = 100 / 3;
    expect(result.current.weights[0].weight).toBeCloseTo(expectedWeight, 5);
    expect(result.current.weights[1].weight).toBeCloseTo(expectedWeight, 5);
    expect(result.current.weights[2].weight).toBeCloseTo(expectedWeight, 5);
  });

  it("should call onSave with weights when handleSave is called", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(onSave).toHaveBeenCalledWith(result.current.weights);
  });

  it("should set saving state during save", async () => {
    let resolvePromise: () => void;
    const onSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    let savePromise: Promise<void>;
    act(() => {
      savePromise = result.current.handleSave();
    });

    expect(result.current.saving).toBe(true);

    await act(async () => {
      resolvePromise!();
      await savePromise;
    });

    expect(result.current.saving).toBe(false);
  });

  it("should show alert on save error", async () => {
    const onSave = jest.fn(() => Promise.reject(new Error("Save failed")));
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to save weights");
  });

  it("should update weights when values prop changes", () => {
    const onSave = jest.fn();
    const { result, rerender } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    const newValues: Value[] = [createTestValue("v4", "New Value", 100)];

    rerender({ values: newValues });

    expect(result.current.weights).toHaveLength(1);
    expect(result.current.weights[0].valueId).toBe("v4");
    expect(result.current.weights[0].weight).toBe(100);
  });

  it("should handle empty values array", () => {
    const emptyValues: Value[] = [];
    const onSave = jest.fn();
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: emptyValues } },
    );

    expect(result.current.weights).toHaveLength(0);
    expect(result.current.totalWeight).toBe(0);
    expect(result.current.hasZeroWeight).toBe(false);
  });
});
