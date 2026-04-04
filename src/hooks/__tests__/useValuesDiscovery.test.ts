import { renderHook, act, waitFor } from "@testing-library/react-native";
import useValuesDiscovery, {
  LENSES,
  SENTENCE_STARTERS,
  PROMPTS_PER_PAGE,
  MIN_CORE_VALUES,
  MAX_CORE_VALUES,
} from "../useValuesDiscovery";
import api from "../../services/api";

// Mock the API
jest.mock("../../services/api");
const mockApi = api as jest.Mocked<typeof api>;

// Mock logger
jest.mock("../../utils/logger", () => ({
  logError: jest.fn(),
}));

// Sample test data
const mockPrompts = [
  {
    id: "p1",
    prompt_text: "Being emotionally present",
    primary_lens: "How I show up for others",
    display_order: 1,
    active: true,
  },
  {
    id: "p2",
    prompt_text: "Listening fully",
    primary_lens: "How I show up for others",
    display_order: 2,
    active: true,
  },
  {
    id: "p3",
    prompt_text: "Giving myself rest",
    primary_lens: "How I treat myself",
    display_order: 1,
    active: true,
  },
  {
    id: "p4",
    prompt_text: "Taking care of my health",
    primary_lens: "How I treat myself",
    display_order: 2,
    active: true,
  },
];

const mockSelections = [
  {
    id: "s1",
    user_id: "u1",
    prompt_id: "p1",
    bucket: "core" as const,
    display_order: 0,
    custom_text: null,
    prompt: mockPrompts[0],
  },
];

describe("useValuesDiscovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getDiscoveryPrompts.mockResolvedValue(mockPrompts);
    mockApi.getUserSelections.mockResolvedValue([]);
    mockApi.getValues.mockResolvedValue({ values: [] });
    mockApi.bulkUpdateSelections.mockResolvedValue([]);
    mockApi.createValue.mockResolvedValue({
      id: "v1",
      user_id: "u1",
      active_revision_id: "r1",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      revisions: [],
      insights: [],
    });
  });

  describe("initialization", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() => useValuesDiscovery());
      expect(result.current.loading).toBe(true);
      expect(result.current.step).toBe("loading");
    });

    it("loads prompts and transitions to select step", async () => {
      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("select");
      });

      expect(result.current.prompts).toEqual(mockPrompts);
      expect(result.current.loading).toBe(false);
    });

    it("shows existing values if user has them", async () => {
      mockApi.getValues.mockResolvedValue({
        values: [
          {
            id: "v1",
            user_id: "u1",
            active_revision_id: "r1",
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
            revisions: [],
            insights: [],
            active_revision: {
              id: "r1",
              value_id: "v1",
              statement: "Test value",
              weight_raw: 100,
              weight_normalized: 1,
              is_active: true,
              origin: "declared" as const,
              created_at: "2026-01-01",
            },
          },
        ],
      });

      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("view_values");
      });

      expect(result.current.existingValues).toHaveLength(1);
    });

    it("restores existing selections", async () => {
      mockApi.getUserSelections.mockResolvedValue(mockSelections);

      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("review");
      });

      expect(result.current.selections.has("p1")).toBe(true);
      expect(result.current.buckets.core).toHaveLength(1);
    });
  });

  describe("selection step", () => {
    it("toggles selection on and off", async () => {
      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("select");
      });

      // Select a prompt
      act(() => {
        result.current.toggleSelection("p1");
      });
      expect(result.current.selections.has("p1")).toBe(true);

      // Deselect it
      act(() => {
        result.current.toggleSelection("p1");
      });
      expect(result.current.selections.has("p1")).toBe(false);
    });

    it("navigates between lenses", async () => {
      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("select");
      });

      expect(result.current.currentLensIndex).toBe(0);
      expect(result.current.currentLens).toBe(LENSES[0]);

      // Go to next lens
      act(() => {
        result.current.goToNextLens();
      });
      expect(result.current.currentLensIndex).toBe(1);

      // Go back
      act(() => {
        result.current.goToPreviousLens();
      });
      expect(result.current.currentLensIndex).toBe(0);
    });

    it("transitions to bucket step when selections made and at end", async () => {
      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("select");
      });

      // Select some prompts
      act(() => {
        result.current.toggleSelection("p1");
        result.current.toggleSelection("p2");
      });

      // Manually set step to bucket to simulate completing selection flow
      act(() => {
        result.current.setStep("bucket");
      });

      expect(result.current.step).toBe("bucket");
      // Verify selections were preserved
      expect(result.current.selections.has("p1")).toBe(true);
      expect(result.current.selections.has("p2")).toBe(true);
    });
  });

  describe("bucket step", () => {
    it("moves items between buckets", async () => {
      mockApi.getUserSelections.mockResolvedValue(mockSelections);
      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("review");
      });

      // Go back to bucket
      act(() => {
        result.current.setStep("bucket");
      });

      const item = result.current.buckets.core[0];

      // Move to important
      act(() => {
        result.current.moveToBucket(item, "important");
      });

      expect(result.current.buckets.core).toHaveLength(0);
      expect(result.current.buckets.important).toHaveLength(1);
    });

    it("blocks continue with fewer than 3 core values", async () => {
      mockApi.getUserSelections.mockResolvedValue(mockSelections);
      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("review");
      });

      act(() => {
        result.current.setStep("bucket");
      });

      expect(result.current.coreCount).toBe(1);
      expect(result.current.canContinueFromBucket).toBe(false);

      // Should return false (not enough core)
      let continued = false;
      act(() => {
        continued = result.current.continueFromBucketing();
      });

      expect(continued).toBe(false);
    });
  });

  describe("save operations", () => {
    it("saves selections via API", async () => {
      mockApi.getUserSelections.mockResolvedValue(mockSelections);
      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("review");
      });

      let success = false;
      await act(async () => {
        success = await result.current.saveSelections();
      });

      expect(success).toBe(true);
      expect(mockApi.bulkUpdateSelections).toHaveBeenCalled();
    });

    it("creates value statements", async () => {
      mockApi.getUserSelections.mockResolvedValue([
        ...mockSelections,
        {
          ...mockSelections[0],
          id: "s2",
          prompt_id: "p2",
          prompt: mockPrompts[1],
        },
        {
          ...mockSelections[0],
          id: "s3",
          prompt_id: "p3",
          prompt: mockPrompts[2],
        },
      ]);

      const { result } = renderHook(() => useValuesDiscovery());

      await waitFor(() => {
        expect(result.current.step).toBe("review");
      });

      // Save and continue to statement creation
      await act(async () => {
        await result.current.saveSelections();
      });

      act(() => {
        result.current.setStep("create_statement");
      });

      // Set statement text
      act(() => {
        result.current.setStatementText("be present with my family");
      });

      // Save statement
      await act(async () => {
        await result.current.saveStatement();
      });

      expect(mockApi.createValue).toHaveBeenCalledWith({
        statement: `${SENTENCE_STARTERS[0]} be present with my family`,
        weight_raw: 1,
        origin: "declared",
      });
    });
  });

  describe("constants", () => {
    it("exports expected constants", () => {
      expect(LENSES).toHaveLength(6);
      expect(SENTENCE_STARTERS).toHaveLength(3);
      expect(PROMPTS_PER_PAGE).toBe(6);
      expect(MIN_CORE_VALUES).toBe(3);
      expect(MAX_CORE_VALUES).toBe(6);
    });
  });
});
