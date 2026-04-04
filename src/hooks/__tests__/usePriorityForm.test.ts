/**
 * Tests for usePriorityForm hook
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import usePriorityForm from "../usePriorityForm";
import type { Priority, PriorityRevision } from "../../types";

// Mock the API service
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    validatePriority: jest.fn(),
  },
}));

import api from "../../services/api";

const mockedApi = api as jest.Mocked<typeof api>;

describe("usePriorityForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with default form data", () => {
      const { result } = renderHook(() => usePriorityForm());

      expect(result.current.formData).toEqual({
        title: "",
        why_matters: "",
        score: 3,
        scope: "ongoing",
        cadence: "",
        constraints: "",
        value_ids: [],
      });
    });

    it("should initialize with empty validation feedback", () => {
      const { result } = renderHook(() => usePriorityForm());

      expect(result.current.validationFeedback).toEqual({ name: [], why: [] });
    });

    it("should initialize with empty selected values", () => {
      const { result } = renderHook(() => usePriorityForm());

      expect(result.current.selectedValues.size).toBe(0);
    });
  });

  describe("handleNameChange", () => {
    it("should update title in formData", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.handleNameChange("New Title");
      });

      expect(result.current.formData.title).toBe("New Title");
    });

    it("should show feedback for short titles (1-5 chars)", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.handleNameChange("Test");
      });

      expect(result.current.validationFeedback.name).toContain(
        "Add a detail: instead of 'Health', say 'Fitness', 'Sleep', or 'Mental health'",
      );
    });

    it("should clear feedback for empty title", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.handleNameChange("Test");
      });

      act(() => {
        result.current.handleNameChange("");
      });

      expect(result.current.validationFeedback.name).toEqual([]);
    });

    it("should trigger validation after debounce for longer titles", async () => {
      mockedApi.validatePriority.mockResolvedValueOnce({
        name_valid: true,
        name_feedback: [],
        why_valid: true,
        why_feedback: [],
        why_passed_rules: {},
        overall_valid: true,
      });

      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.handleNameChange("Long enough title");
      });

      // Advance past debounce period
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockedApi.validatePriority).toHaveBeenCalled();
      });
    });
  });

  describe("handleWhyChange", () => {
    it("should update why_matters in formData", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.handleWhyChange("This is important because...");
      });

      expect(result.current.formData.why_matters).toBe(
        "This is important because...",
      );
    });

    it("should show placeholder feedback for short why statements", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.handleWhyChange("Short");
      });

      expect(result.current.validationFeedback.why).toContain(
        "Please tell us why this matters",
      );
    });
  });

  describe("toggleValue", () => {
    it("should add value to selected values", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.toggleValue("value-1");
      });

      expect(result.current.selectedValues.has("value-1")).toBe(true);
    });

    it("should remove value from selected values when toggled again", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.toggleValue("value-1");
      });

      act(() => {
        result.current.toggleValue("value-1");
      });

      expect(result.current.selectedValues.has("value-1")).toBe(false);
    });

    it("should handle multiple values", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.toggleValue("value-1");
        result.current.toggleValue("value-2");
      });

      expect(result.current.selectedValues.size).toBe(2);
      expect(result.current.selectedValues.has("value-1")).toBe(true);
      expect(result.current.selectedValues.has("value-2")).toBe(true);
    });

    it("should block removal of last anchored value", () => {
      const onAnchorBlock = jest.fn();
      const { result } = renderHook(() => usePriorityForm());

      // Add one value
      act(() => {
        result.current.toggleValue("value-1");
      });

      // Try to remove it as anchored
      act(() => {
        result.current.toggleValue("value-1", true, onAnchorBlock);
      });

      // Should still be there and callback should have been called
      expect(result.current.selectedValues.has("value-1")).toBe(true);
      expect(onAnchorBlock).toHaveBeenCalled();
    });
  });

  describe("resetForm", () => {
    it("should reset all form state to initial values", () => {
      const { result } = renderHook(() => usePriorityForm());

      // Modify form state
      act(() => {
        result.current.handleNameChange("Test Title");
        result.current.handleWhyChange("Test why statement");
        result.current.toggleValue("value-1");
        result.current.setFormData((prev) => ({ ...prev, score: 5 }));
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.title).toBe("");
      expect(result.current.formData.why_matters).toBe("");
      expect(result.current.formData.score).toBe(3);
      expect(result.current.selectedValues.size).toBe(0);
    });
  });

  describe("loadFromPriority", () => {
    it("should load form data from priority object", () => {
      const { result } = renderHook(() => usePriorityForm());

      const mockRevision: PriorityRevision = {
        id: "rev-1",
        priority_id: "p1",
        title: "Loaded Title",
        why_matters: "Loaded why matters",
        score: 4,
        scope: "habitual",
        cadence: "weekly",
        constraints: "time",
        is_anchored: false,
        is_active: true,
        notes: null,
        value_links: [
          { value_id: "v1", value_revision_id: "vr1", link_weight: 1 },
          { value_id: "v2", value_revision_id: "vr2", link_weight: 1 },
        ],
        created_at: new Date().toISOString(),
      };

      const priority: Priority = {
        id: "p1",
        user_id: "user-1",
        active_revision_id: "rev-1",
        active_revision: mockRevision,
        is_stashed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      act(() => {
        result.current.loadFromPriority(priority);
      });

      expect(result.current.formData.title).toBe("Loaded Title");
      expect(result.current.formData.why_matters).toBe("Loaded why matters");
      expect(result.current.formData.score).toBe(4);
      expect(result.current.formData.scope).toBe("habitual");
      expect(result.current.formData.cadence).toBe("weekly");
      expect(result.current.selectedValues.size).toBe(2);
      expect(result.current.selectedValues.has("v1")).toBe(true);
    });

    it("should handle priority without active_revision", () => {
      const { result } = renderHook(() => usePriorityForm());

      // Set some initial values
      act(() => {
        result.current.handleNameChange("Initial");
      });

      // Load null priority
      const priority = {
        id: "p1",
        user_id: "user-1",
        active_revision_id: null,
        active_revision: null,
        is_stashed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Priority;

      act(() => {
        result.current.loadFromPriority(priority);
      });

      // Should not change
      expect(result.current.formData.title).toBe("Initial");
    });

    it("should handle null cadence/constraints as empty string", () => {
      const { result } = renderHook(() => usePriorityForm());

      const mockRevision: PriorityRevision = {
        id: "rev-1",
        priority_id: "p1",
        title: "Test",
        why_matters: "Why",
        score: 3,
        scope: "ongoing",
        cadence: null,
        constraints: null,
        is_anchored: false,
        is_active: true,
        notes: null,
        value_links: [],
        created_at: new Date().toISOString(),
      };

      const priority: Priority = {
        id: "p1",
        user_id: "user-1",
        active_revision_id: "rev-1",
        active_revision: mockRevision,
        is_stashed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      act(() => {
        result.current.loadFromPriority(priority);
      });

      expect(result.current.formData.cadence).toBe("");
      expect(result.current.formData.constraints).toBe("");
    });
  });

  describe("setFormData", () => {
    it("should allow direct form data updates", () => {
      const { result } = renderHook(() => usePriorityForm());

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          score: 5,
          scope: "seasonal",
        }));
      });

      expect(result.current.formData.score).toBe(5);
      expect(result.current.formData.scope).toBe("seasonal");
    });
  });
});
