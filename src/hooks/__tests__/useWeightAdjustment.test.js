import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useWeightAdjustment from "../useWeightAdjustment";
import { createMockValue } from "../../testHelpers";

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useWeightAdjustment", () => {
  const mockValues = [
    createMockValue({
      id: "v1",
      active_revision_id: "r1",
      revisions: [{ id: "r1", statement: "Value 1", weight_normalized: 50 }],
    }),
    createMockValue({
      id: "v2",
      active_revision_id: "r2",
      revisions: [{ id: "r2", statement: "Value 2", weight_normalized: 30 }],
    }),
    createMockValue({
      id: "v3",
      active_revision_id: "r3",
      revisions: [{ id: "r3", statement: "Value 3", weight_normalized: 20 }],
    }),
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
    const valuesWithZero = [
      createMockValue({
        id: "v1",
        active_revision_id: "r1",
        revisions: [{ id: "r1", statement: "Value 1", weight_normalized: 0 }],
      }),
      createMockValue({
        id: "v2",
        active_revision_id: "r2",
        revisions: [{ id: "r2", statement: "Value 2", weight_normalized: 100 }],
      }),
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
    let resolvePromise;
    const onSave = jest.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );
    const { result } = renderHook(
      ({ values }) => useWeightAdjustment(values, onSave),
      { initialProps: { values: mockValues } },
    );

    let savePromise;
    act(() => {
      savePromise = result.current.handleSave();
    });

    expect(result.current.saving).toBe(true);

    await act(async () => {
      resolvePromise();
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

    const newValues = [
      createMockValue({
        id: "v4",
        active_revision_id: "r4",
        revisions: [
          { id: "r4", statement: "New Value", weight_normalized: 100 },
        ],
      }),
    ];

    rerender({ values: newValues });

    expect(result.current.weights).toHaveLength(1);
    expect(result.current.weights[0].valueId).toBe("v4");
    expect(result.current.weights[0].weight).toBe(100);
  });

  it("should handle empty values array", () => {
    const emptyValues = [];
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
