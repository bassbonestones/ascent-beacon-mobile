import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import useValuePriorityLinks from "../useValuePriorityLinks";

// Mock the api module
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getPriorities: jest.fn(),
    getLinkedPriorities: jest.fn(),
    createPriorityRevision: jest.fn(),
  },
}));

import api from "../../services/api";

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useValuePriorityLinks", () => {
  const mockNavigation = {
    goBack: jest.fn(),
  };

  const mockPriorities = [
    {
      id: "p1",
      active_revision: {
        id: "r1",
        title: "Priority 1",
        why_matters: "Important",
        score: 4,
        scope: "ongoing",
        is_anchored: false,
        value_links: [{ value_id: "v1" }],
      },
    },
    {
      id: "p2",
      active_revision: {
        id: "r2",
        title: "Priority 2",
        why_matters: "Also important",
        score: 3,
        scope: "ongoing",
        is_anchored: true,
        value_links: [{ value_id: "v2" }],
      },
    },
  ];

  const mockLinkedPriorities = [{ priority_id: "p1" }];

  beforeEach(() => {
    jest.clearAllMocks();
    api.getPriorities.mockResolvedValue({ priorities: mockPriorities });
    api.getLinkedPriorities.mockResolvedValue(mockLinkedPriorities);
    api.createPriorityRevision.mockResolvedValue({});
  });

  it("should load priorities and linked priorities on mount", async () => {
    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.getPriorities).toHaveBeenCalled();
    expect(api.getLinkedPriorities).toHaveBeenCalledWith("v1");
    expect(result.current.priorities).toEqual(mockPriorities);
    expect(result.current.linkedPriorityIds.has("p1")).toBe(true);
    expect(result.current.linkedPriorityIds.has("p2")).toBe(false);
  });

  it("should toggle priority link", async () => {
    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initially p1 is linked
    expect(result.current.linkedPriorityIds.has("p1")).toBe(true);
    expect(result.current.linkedPriorityIds.has("p2")).toBe(false);

    // Toggle p1 off
    act(() => {
      result.current.togglePriorityLink("p1");
    });

    expect(result.current.linkedPriorityIds.has("p1")).toBe(false);
    expect(result.current.changedPriorityIds.has("p1")).toBe(true);

    // Toggle p2 on
    act(() => {
      result.current.togglePriorityLink("p2");
    });

    expect(result.current.linkedPriorityIds.has("p2")).toBe(true);
    expect(result.current.changedPriorityIds.has("p2")).toBe(true);
  });

  it("should navigate back without saving if no changes", async () => {
    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(api.createPriorityRevision).not.toHaveBeenCalled();
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("should save changes and navigate back", async () => {
    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Toggle p2 to link it
    act(() => {
      result.current.togglePriorityLink("p2");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(api.createPriorityRevision).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Success",
      "Priority links updated",
    );
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("should show error alert when loading fails", async () => {
    api.getPriorities.mockRejectedValueOnce(new Error("Load failed"));

    renderHook(() => useValuePriorityLinks("v1", mockNavigation));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to load priorities",
      );
    });
  });

  it("should show error alert when saving fails", async () => {
    api.createPriorityRevision.mockRejectedValueOnce(new Error("Save failed"));

    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.togglePriorityLink("p2");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to update links");
  });

  it("should handle orphaned anchored priority error", async () => {
    api.createPriorityRevision.mockRejectedValueOnce(
      new Error("ORPHANED_ANCHORED_PRIORITY: Cannot unlink"),
    );

    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.togglePriorityLink("p1");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Cannot Save",
      "One or more anchored priorities would be left without values.",
      [{ text: "OK" }],
    );
  });

  it("should set saving state during save", async () => {
    let resolvePromise;
    api.createPriorityRevision.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.togglePriorityLink("p2");
    });

    let savePromise;
    act(() => {
      savePromise = result.current.handleSave();
    });

    expect(result.current.saving).toBe(true);

    await act(async () => {
      resolvePromise({});
      await savePromise;
    });

    expect(result.current.saving).toBe(false);
  });
});
