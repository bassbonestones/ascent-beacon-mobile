/**
 * Tests for messageHandlers utility
 */

import {
  handlePendingAction,
  handleEditMode,
  handleVagueReference,
  handleSpecificReference,
  handleTriggerMatch,
} from "../messageHandlers";
import type { Value, ValueRevision } from "../../types";

// Define the context type locally since it's not exported
interface MessageHandlerContext {
  normalized: string;
  trimmed: string;
  values: Value[];
  pendingAction: { type: "edit" | "delete"; valueId: string } | null;
  setPendingAction: (
    action: { type: "edit" | "delete"; valueId: string } | null,
  ) => void;
  editValueId: string | null;
  setEditValueId: (id: string | null) => void;
  lastMentionedValueId: string | null;
  setLastMentionedValueId: (id: string | null) => void;
  setSending: (sending: boolean) => void;
  performDeleteValue: (value: Value) => Promise<void>;
  updateValue: (value: Value, statement: string) => Promise<boolean>;
  addAssistantMessage: (message: string, type?: string) => void;
}

// Mock the api module
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    matchValue: jest.fn(),
    sendAssistantMessage: jest.fn(),
  },
}));

interface PendingAction {
  type: "edit" | "delete";
  valueId: string;
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

describe("messageHandlers", () => {
  const mockSetPendingAction = jest.fn();
  const mockSetEditValueId = jest.fn();
  const mockPerformDeleteValue = jest.fn();
  const mockAddAssistantMessage = jest.fn();
  const mockUpdateValue = jest.fn();
  const mockSetLastMentionedValueId = jest.fn();
  const mockSetSending = jest.fn();

  const mockValues: Value[] = [
    createMockValue("v1", "I value family", 50),
    createMockValue("v2", "I value learning", 50),
  ];

  // Helper to create a complete message handler context with proper typing
  const createContext = (
    overrides: Partial<MessageHandlerContext> = {},
  ): MessageHandlerContext => ({
    normalized: "",
    trimmed: "",
    values: mockValues,
    pendingAction: null,
    setPendingAction: mockSetPendingAction,
    editValueId: null,
    setEditValueId: mockSetEditValueId,
    lastMentionedValueId: null,
    setLastMentionedValueId: mockSetLastMentionedValueId,
    setSending: mockSetSending,
    performDeleteValue: mockPerformDeleteValue,
    updateValue: mockUpdateValue,
    addAssistantMessage: mockAddAssistantMessage,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handlePendingAction", () => {
    it("should return false when no pending action", async () => {
      const result = await handlePendingAction(
        createContext({ normalized: "yes", pendingAction: null }),
      );

      expect(result).toBe(false);
    });

    it("should handle 'no' confirmation and cancel action", async () => {
      const result = await handlePendingAction(
        createContext({
          normalized: "no",
          pendingAction: { type: "delete", valueId: "v1" },
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
      expect(mockAddAssistantMessage).toHaveBeenCalled();
    });

    it("should handle 'yes' confirmation for delete action", async () => {
      mockPerformDeleteValue.mockResolvedValue(undefined);

      const result = await handlePendingAction(
        createContext({
          normalized: "yes",
          pendingAction: { type: "delete", valueId: "v1" },
        }),
      );

      expect(result).toBe(true);
      expect(mockPerformDeleteValue).toHaveBeenCalled();
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
    });

    it("should handle 'yes' confirmation for edit action", async () => {
      const result = await handlePendingAction(
        createContext({
          normalized: "yes",
          pendingAction: { type: "edit", valueId: "v1" },
        }),
      );

      expect(result).toBe(true);
      expect(mockSetEditValueId).toHaveBeenCalledWith("v1");
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
    });

    it("should accept 'y' as yes confirmation", async () => {
      mockPerformDeleteValue.mockResolvedValue(undefined);

      const result = await handlePendingAction(
        createContext({
          normalized: "y",
          pendingAction: { type: "delete", valueId: "v1" },
        }),
      );

      expect(result).toBe(true);
      expect(mockPerformDeleteValue).toHaveBeenCalled();
    });

    it("should accept 'n' as no confirmation", async () => {
      const result = await handlePendingAction(
        createContext({
          normalized: "n",
          pendingAction: { type: "delete", valueId: "v1" },
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
    });

    it("should return false for non-confirmation input", async () => {
      const result = await handlePendingAction(
        createContext({
          normalized: "maybe",
          pendingAction: { type: "delete", valueId: "v1" },
        }),
      );

      expect(result).toBe(false);
    });
  });

  describe("handleEditMode", () => {
    it("should return false when not in edit mode", async () => {
      const result = await handleEditMode(
        createContext({
          normalized: "new statement",
          trimmed: "New statement",
          editValueId: null,
        }),
      );

      expect(result).toBe(false);
    });

    it("should handle discuss request", async () => {
      const result = await handleEditMode(
        createContext({
          normalized: "let's discuss",
          trimmed: "let's discuss",
          editValueId: "v1",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetEditValueId).toHaveBeenCalledWith(null);
      expect(mockAddAssistantMessage).toHaveBeenCalled();
    });

    it("should update value with new statement", async () => {
      mockUpdateValue.mockResolvedValue(undefined);

      const result = await handleEditMode(
        createContext({
          normalized: "i value my family deeply",
          trimmed: "I value my family deeply",
          editValueId: "v1",
        }),
      );

      expect(result).toBe(true);
      expect(mockUpdateValue).toHaveBeenCalledWith(
        mockValues[0],
        "I value my family deeply",
      );
    });
  });

  describe("handleVagueReference", () => {
    it("should return false when not a vague reference", () => {
      const result = handleVagueReference(
        createContext({
          normalized: "create a value about happiness",
          lastMentionedValueId: "v1",
        }),
      );

      expect(result).toBe(false);
    });

    it("should return false when no last mentioned value", () => {
      const result = handleVagueReference(
        createContext({
          normalized: "edit it",
          lastMentionedValueId: null,
        }),
      );

      expect(result).toBe(false);
    });

    it("should handle vague edit reference", () => {
      const result = handleVagueReference(
        createContext({
          normalized: "edit it",
          lastMentionedValueId: "v1",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "edit",
        valueId: "v1",
      });
    });

    it("should handle vague delete reference", () => {
      const result = handleVagueReference(
        createContext({
          normalized: "delete that",
          lastMentionedValueId: "v2",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v2",
      });
    });

    it("should return false when target value not found", () => {
      const result = handleVagueReference(
        createContext({
          normalized: "edit it",
          lastMentionedValueId: "non-existent",
        }),
      );

      expect(result).toBe(false);
    });
  });

  describe("handleSpecificReference", () => {
    it("should return false when not a specific reference", async () => {
      const result = await handleSpecificReference(
        createContext({
          normalized: "create value about happiness",
          trimmed: "Create value about happiness",
        }),
      );

      expect(result).toBe(false);
    });

    it("should handle edit the one about pattern with direct match", async () => {
      // "family" is in the first value's statement
      const result = await handleSpecificReference(
        createContext({
          normalized: "edit the one about family",
          trimmed: "Edit the one about family",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v1");
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "edit",
        valueId: "v1",
      });
    });

    it("should handle delete the one about pattern", async () => {
      const result = await handleSpecificReference(
        createContext({
          normalized: "delete the one about learning",
          trimmed: "Delete the one about learning",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v2");
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v2",
      });
    });

    it("should handle remove the one about pattern", async () => {
      const result = await handleSpecificReference(
        createContext({
          normalized: "remove the one about family",
          trimmed: "Remove the one about family",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v1",
      });
    });

    it("should handle the one with pattern", async () => {
      const result = await handleSpecificReference(
        createContext({
          normalized: "edit the one with learning",
          trimmed: "Edit the one with learning",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v2");
    });

    it("should call api.matchValue when no direct match found", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue({ value_id: "v1" });

      const result = await handleSpecificReference(
        createContext({
          normalized: "edit the one about xyz",
          trimmed: "Edit the one about xyz",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetSending).toHaveBeenCalledWith(true);
      expect(api.matchValue).toHaveBeenCalled();
      expect(mockSetSending).toHaveBeenCalledWith(false);
    });

    it("should show not found message when no match", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue(null);

      const result = await handleSpecificReference(
        createContext({
          normalized: "edit the one about xyz",
          trimmed: "Edit the one about xyz",
        }),
      );

      expect(result).toBe(true);
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        "I couldn't find a value matching that. Try a few exact words from the statement?",
        "_not_found",
      );
    });

    it("should handle api error gracefully", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockRejectedValue(new Error("API error"));

      const result = await handleSpecificReference(
        createContext({
          normalized: "edit the one about xyz",
          trimmed: "Edit the one about xyz",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetSending).toHaveBeenCalledWith(false);
    });
  });

  describe("handleTriggerMatch", () => {
    it("should return false when no trigger detected", async () => {
      const result = await handleTriggerMatch(
        createContext({
          normalized: "add a value about happiness",
        }),
      );

      expect(result).toBe(false);
    });

    it("should handle edit trigger with value match", async () => {
      const result = await handleTriggerMatch(
        createContext({
          normalized: "edit my family value",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "edit",
        valueId: "v1",
      });
    });

    it("should handle delete trigger", async () => {
      const result = await handleTriggerMatch(
        createContext({
          normalized: "delete the learning value",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v2",
      });
    });

    it("should handle remove trigger", async () => {
      const result = await handleTriggerMatch(
        createContext({
          normalized: "remove family",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v1",
      });
    });

    it("should call api.matchValue when no direct match", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue({ value_id: "v2" });

      const result = await handleTriggerMatch(
        createContext({
          normalized: "edit xyz",
        }),
      );

      expect(result).toBe(true);
      expect(api.matchValue).toHaveBeenCalled();
    });

    it("should show not found when no match", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue(null);

      const result = await handleTriggerMatch(
        createContext({
          normalized: "edit xyz",
        }),
      );

      expect(result).toBe(true);
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        "I couldn't find a value matching that. Try a few exact words from the statement?",
        "_not_found",
      );
    });

    it("should handle api error gracefully", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockRejectedValue(new Error("API error"));

      const result = await handleTriggerMatch(
        createContext({
          normalized: "edit xyz",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetSending).toHaveBeenCalledWith(false);
    });

    it("should set lastMentionedValueId when target found", async () => {
      const result = await handleTriggerMatch(
        createContext({
          normalized: "edit family",
        }),
      );

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v1");
    });
  });
});
