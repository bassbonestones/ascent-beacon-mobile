import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useValueActions from "../useValueActions";
import api from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    deleteValue: jest.fn(),
    updateValue: jest.fn(),
  },
}));

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("useValueActions", () => {
  const mockAddAssistantMessage = jest.fn();
  const mockLoadValues = jest.fn().mockResolvedValue();

  const mockValue = {
    id: "value-123",
    active_revision_id: "rev-1",
    revisions: [
      {
        id: "rev-1",
        statement: "Test Statement",
        weight_raw: 1,
        origin: "declared",
      },
    ],
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
      const valueNoStatement = {
        id: "val-2",
        active_revision_id: "rev-x",
        revisions: [{ id: "rev-x" }],
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
      api.deleteValue.mockResolvedValueOnce();
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      await act(async () => {
        await result.current.performDeleteValue(mockValue);
      });

      expect(api.deleteValue).toHaveBeenCalledWith("value-123");
      expect(mockLoadValues).toHaveBeenCalled();
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        `Deleted "Test Statement". Want to add another, or refine one?`,
        "_deleted",
      );
      expect(result.current.deleteConfirmId).toBeNull();
    });

    it("should show alert on API error", async () => {
      api.deleteValue.mockRejectedValueOnce(new Error("Delete failed"));
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
      let resolveFn;
      api.deleteValue.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFn = resolve;
          }),
      );
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let deletePromise;
      act(() => {
        deletePromise = result.current.performDeleteValue(mockValue);
      });
      expect(result.current.sending).toBe(true);

      await act(async () => {
        resolveFn();
        await deletePromise;
      });
      expect(result.current.sending).toBe(false);
    });
  });

  describe("updateValue", () => {
    it("should call API with correct params and return true on success", async () => {
      api.updateValue.mockResolvedValueOnce();
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let success;
      await act(async () => {
        success = await result.current.updateValue(mockValue, "New Statement");
      });

      expect(success).toBe(true);
      expect(api.updateValue).toHaveBeenCalledWith("value-123", {
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
      const valueNoRevision = {
        id: "val-1",
        active_revision_id: "rev-x",
        revisions: [],
      };
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let success;
      await act(async () => {
        success = await result.current.updateValue(
          valueNoRevision,
          "New Statement",
        );
      });

      expect(success).toBe(false);
      expect(api.updateValue).not.toHaveBeenCalled();
    });

    it("should return false and show alert on API error", async () => {
      api.updateValue.mockRejectedValueOnce(new Error("Update failed"));
      const { result } = renderHook(() =>
        useValueActions(mockAddAssistantMessage, mockLoadValues),
      );

      let success;
      await act(async () => {
        success = await result.current.updateValue(mockValue, "New Statement");
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to update value",
      );
    });

    it("should clear editValueId after update", async () => {
      api.updateValue.mockResolvedValueOnce();
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
