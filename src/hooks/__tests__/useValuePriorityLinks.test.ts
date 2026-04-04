import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import useValuePriorityLinks from "../useValuePriorityLinks";
import type { Priority, PriorityRevision } from "../../types";

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

const mockedApi = api as jest.Mocked<typeof api>;

jest.spyOn(Alert, "alert").mockImplementation(() => {});

interface MockNavigation {
  goBack: jest.Mock;
}

describe("useValuePriorityLinks", () => {
  const mockNavigation: MockNavigation = {
    goBack: jest.fn(),
  };

  const mockRevision1: PriorityRevision = {
    id: "r1",
    priority_id: "p1",
    title: "Priority 1",
    why_matters: "Important",
    score: 4,
    scope: "ongoing",
    cadence: null,
    constraints: null,
    is_anchored: false,
    is_active: true,
    notes: null,
    value_links: [{ value_id: "v1", value_revision_id: "vr1", link_weight: 1 }],
    created_at: new Date().toISOString(),
  };

  const mockRevision2: PriorityRevision = {
    id: "r2",
    priority_id: "p2",
    title: "Priority 2",
    why_matters: "Also important",
    score: 3,
    scope: "ongoing",
    cadence: null,
    constraints: null,
    is_anchored: true,
    is_active: true,
    notes: null,
    value_links: [{ value_id: "v2", value_revision_id: "vr2", link_weight: 1 }],
    created_at: new Date().toISOString(),
  };

  const mockPriorities: Priority[] = [
    {
      id: "p1",
      user_id: "user-1",
      active_revision_id: "r1",
      active_revision: mockRevision1,
      is_stashed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "p2",
      user_id: "user-1",
      active_revision_id: "r2",
      active_revision: mockRevision2,
      is_stashed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Mock linked priorities - these are the priorities linked to a value (in this case, p1 is linked to v1)
  const mockLinkedPriorities: Priority[] = [mockPriorities[0]];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getPriorities.mockResolvedValue({ priorities: mockPriorities });
    mockedApi.getLinkedPriorities.mockResolvedValue(mockLinkedPriorities);
    // @ts-expect-error - mock only returns partial data for testing
    mockedApi.createPriorityRevision.mockResolvedValue({});
  });

  it("should load priorities and linked priorities on mount", async () => {
    const { result } = renderHook(() =>
      useValuePriorityLinks("v1", mockNavigation),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedApi.getPriorities).toHaveBeenCalled();
    expect(mockedApi.getLinkedPriorities).toHaveBeenCalledWith("v1");
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

    expect(mockedApi.createPriorityRevision).not.toHaveBeenCalled();
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

    expect(mockedApi.createPriorityRevision).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Success",
      "Priority links updated",
    );
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("should show error alert when loading fails", async () => {
    mockedApi.getPriorities.mockRejectedValueOnce(new Error("Load failed"));

    renderHook(() => useValuePriorityLinks("v1", mockNavigation));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to load priorities",
      );
    });
  });

  it("should show error alert when saving fails", async () => {
    mockedApi.createPriorityRevision.mockRejectedValueOnce(
      new Error("Save failed"),
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

    await act(async () => {
      await result.current.handleSave();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to update links");
  });

  it("should handle orphaned anchored priority error", async () => {
    mockedApi.createPriorityRevision.mockRejectedValueOnce(
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
    let resolvePromise: (value: object) => void;
    mockedApi.createPriorityRevision.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve as (value: object) => void;
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

    let savePromise: Promise<void>;
    act(() => {
      savePromise = result.current.handleSave();
    });

    expect(result.current.saving).toBe(true);

    await act(async () => {
      resolvePromise!({});
      await savePromise;
    });

    expect(result.current.saving).toBe(false);
  });
});
