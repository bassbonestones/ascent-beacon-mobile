import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useValueActions from "../useValueActions";
import api from "../../services/api";
import type { Value, ValueRevision } from "../../types";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    deleteValue: jest.fn(),
    updateValue: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("useValueActions", () => {
  const mockAddAssistantMessage = jest.fn();
  const mockLoadValues = jest.fn().mockResolvedValue(undefined);

  const mockRevision: ValueRevision = {
    id: "rev-1",
    value_id: "value-123",
    statement: "Test Statement",
    weight_raw: 1,
    weight_normalized: 100,
    is_active: true,
    origin: "declared",
    created_at: new Date().toISOString(),
  };

  const mockValue: Value = {
    id: "value-123",
    user_id: "user-1",
    active_revision_id: "rev-1",
    revisions: [mockRevision],
    insights: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with null editValueId", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );
      expect(result.current.editValueId).toBeNull();
    });

    it("should initialize with null deleteConfirmId", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );
      expect(result.current.deleteConfirmId).toBeNull();
    });

    it("should initialize sending as false", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );
      expect(result.current.sending).toBe(false);
    });
  });

  describe("startEditValue", () => {
    it("should set editValueId and call addAssistantMessage", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.startEditValue(mockValue);
      });

      expect(result.current.editValueId).toBe("value-123");
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        `Got it. Send the new wording for "Test Statement", or say "discuss" to talk it through.`,
        "_edit",
      );
    });

    it("should use fallback text for value without statement", () => {
      const valueNoStatement: Value = {
        id: "val-2",
        user_id: "user-1",
        active_revision_id: "rev-x",
        revisions: [
          {
            id: "rev-x",
            value_id: "val-2",
            statement: "",
            weight_raw: 1,
            weight_normalized: 100,
            is_active: true,
            origin: "declared",
            created_at: new Date().toISOString(),
          },
        ],
        insights: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.startEditValue(valueNoStatement);
      });

      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        `Got it. Send the new wording for "that value", or say "discuss" to talk it through.`,
        "_edit",
      );
    });
  });

  describe("confirmDeleteValue", () => {
    it("should set deleteConfirmId", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.confirmDeleteValue(mockValue);
      });

      expect(result.current.deleteConfirmId).toBe("value-123");
    });
  });

  describe("cancelDeleteValue", () => {
    it("should clear deleteConfirmId", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.confirmDeleteValue(mockValue);
      });
      expect(result.current.deleteConfirmId).toBe("value-123");

      act(() => {
        result.current.cancelDeleteValue();
      });
      expect(result.current.deleteConfirmId).toBeNull();
    });
  });

  describe("performDeleteValue", () => {
    it("should call API, loadValues, and addAssistantMessage on success", async () => {
      mockedApi.deleteValue.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      await act(async () => {
        await result.current.performDeleteValue(mockValue);
      });

      expect(mockedApi.deleteValue).toHaveBeenCalledWith("value-123");
      expect(mockLoadValues).toHaveBeenCalled();
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        `Deleted "Test Statement". Want to add another, or refine one?`,
        "_deleted",
      );
      expect(result.current.deleteConfirmId).toBeNull();
    });

    it("should show alert on API error", async () => {
      mockedApi.deleteValue.mockRejectedValueOnce(new Error("Delete failed"));
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      await act(async () => {
        await result.current.performDeleteValue(mockValue);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to delete value",
      );
    });

    it("should set sending during delete operation", async () => {
      let resolveFn: () => void;
      mockedApi.deleteValue.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFn = resolve;
          }),
      );
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let deletePromise: Promise<void>;
      act(() => {
        deletePromise = result.current.performDeleteValue(mockValue);
      });
      expect(result.current.sending).toBe(true);

      await act(async () => {
        resolveFn!();
        await deletePromise;
      });
      expect(result.current.sending).toBe(false);
    });
  });

  describe("updateValue", () => {
    it("should call API with correct params and return true on success", async () => {
      mockedApi.updateValue.mockResolvedValueOnce({} as Value);
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let success: boolean;
      await act(async () => {
        success = await result.current.updateValue(mockValue, "New Statement");
      });

      expect(success!).toBe(true);
      expect(mockedApi.updateValue).toHaveBeenCalledWith("value-123", {
        statement: "New Statement",
        weight_raw: 1,
        origin: "declared",
      });
      expect(mockLoadValues).toHaveBeenCalled();
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        `Updated that value to: "New Statement". Want to add another, or refine this one?`,
        "_updated",
      );
    });

    it("should return false if no active revision", async () => {
      const valueNoRevision: Value = {
        id: "val-1",
        user_id: "user-1",
        active_revision_id: "rev-x",
        revisions: [],
        insights: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let success: boolean;
      await act(async () => {
        success = await result.current.updateValue(
          valueNoRevision,
          "New Statement",
        );
      });

      expect(success!).toBe(false);
      expect(mockedApi.updateValue).not.toHaveBeenCalled();
    });

    it("should return false and show alert on API error", async () => {
      mockedApi.updateValue.mockRejectedValueOnce(new Error("Update failed"));
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let success: boolean;
      await act(async () => {
        success = await result.current.updateValue(mockValue, "New Statement");
      });

      expect(success!).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to update value",
      );
    });

    it("should clear editValueId after update", async () => {
      mockedApi.updateValue.mockResolvedValueOnce({} as Value);
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.setEditValueId("value-123");
      });
      expect(result.current.editValueId).toBe("value-123");

      await act(async () => {
        await result.current.updateValue(mockValue, "New Statement");
      });

      expect(result.current.editValueId).toBeNull();
    });
  });

  describe("setters", () => {
    it("should update editValueId", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.setEditValueId("new-id");
      });

      expect(result.current.editValueId).toBe("new-id");
    });

    it("should update lastMentionedValueId", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.setLastMentionedValueId("mentioned-123");
      });

      expect(result.current.lastMentionedValueId).toBe("mentioned-123");
    });

    it("should update sending", () => {
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      act(() => {
        result.current.setSending(true);
      });

      expect(result.current.sending).toBe(true);
    });
  });
});
