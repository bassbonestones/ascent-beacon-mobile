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
import * as valueMatching from "../valueMatching";

// Mock the api module
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    matchValue: jest.fn(),
    sendAssistantMessage: jest.fn(),
  },
}));

describe("messageHandlers", () => {
  const mockSetPendingAction = jest.fn();
  const mockSetEditValueId = jest.fn();
  const mockPerformDeleteValue = jest.fn();
  const mockAddAssistantMessage = jest.fn();
  const mockUpdateValue = jest.fn();
  const mockSetLastMentionedValueId = jest.fn();
  const mockSetSending = jest.fn();

  const mockValues = [
    {
      id: "v1",
      active_revision_id: "r1",
      revisions: [{ id: "r1", statement: "I value family" }],
    },
    {
      id: "v2",
      active_revision_id: "r2",
      revisions: [{ id: "r2", statement: "I value learning" }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handlePendingAction", () => {
    it("should return false when no pending action", async () => {
      const result = await handlePendingAction({
        normalized: "yes",
        pendingAction: null,
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        setEditValueId: mockSetEditValueId,
        performDeleteValue: mockPerformDeleteValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });

    it("should handle 'no' confirmation and cancel action", async () => {
      const result = await handlePendingAction({
        normalized: "no",
        pendingAction: { type: "delete", valueId: "v1" },
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        setEditValueId: mockSetEditValueId,
        performDeleteValue: mockPerformDeleteValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
      expect(mockAddAssistantMessage).toHaveBeenCalled();
    });

    it("should handle 'yes' confirmation for delete action", async () => {
      mockPerformDeleteValue.mockResolvedValue(undefined);

      const result = await handlePendingAction({
        normalized: "yes",
        pendingAction: { type: "delete", valueId: "v1" },
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        setEditValueId: mockSetEditValueId,
        performDeleteValue: mockPerformDeleteValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockPerformDeleteValue).toHaveBeenCalled();
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
    });

    it("should handle 'yes' confirmation for edit action", async () => {
      const result = await handlePendingAction({
        normalized: "yes",
        pendingAction: { type: "edit", valueId: "v1" },
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        setEditValueId: mockSetEditValueId,
        performDeleteValue: mockPerformDeleteValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetEditValueId).toHaveBeenCalledWith("v1");
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
    });

    it("should accept 'y' as yes confirmation", async () => {
      mockPerformDeleteValue.mockResolvedValue(undefined);

      const result = await handlePendingAction({
        normalized: "y",
        pendingAction: { type: "delete", valueId: "v1" },
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        setEditValueId: mockSetEditValueId,
        performDeleteValue: mockPerformDeleteValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockPerformDeleteValue).toHaveBeenCalled();
    });

    it("should accept 'n' as no confirmation", async () => {
      const result = await handlePendingAction({
        normalized: "n",
        pendingAction: { type: "delete", valueId: "v1" },
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        setEditValueId: mockSetEditValueId,
        performDeleteValue: mockPerformDeleteValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith(null);
    });

    it("should return false for non-confirmation input", async () => {
      const result = await handlePendingAction({
        normalized: "maybe",
        pendingAction: { type: "delete", valueId: "v1" },
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        setEditValueId: mockSetEditValueId,
        performDeleteValue: mockPerformDeleteValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });
  });

  describe("handleEditMode", () => {
    it("should return false when not in edit mode", async () => {
      const result = await handleEditMode({
        normalized: "new statement",
        trimmed: "New statement",
        editValueId: null,
        values: mockValues,
        setEditValueId: mockSetEditValueId,
        updateValue: mockUpdateValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });

    it("should handle discuss request", async () => {
      const result = await handleEditMode({
        normalized: "let's discuss",
        trimmed: "let's discuss",
        editValueId: "v1",
        values: mockValues,
        setEditValueId: mockSetEditValueId,
        updateValue: mockUpdateValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetEditValueId).toHaveBeenCalledWith(null);
      expect(mockAddAssistantMessage).toHaveBeenCalled();
    });

    it("should update value with new statement", async () => {
      mockUpdateValue.mockResolvedValue(undefined);

      const result = await handleEditMode({
        normalized: "i value my family deeply",
        trimmed: "I value my family deeply",
        editValueId: "v1",
        values: mockValues,
        setEditValueId: mockSetEditValueId,
        updateValue: mockUpdateValue,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockUpdateValue).toHaveBeenCalledWith(
        mockValues[0],
        "I value my family deeply",
      );
    });
  });

  describe("handleVagueReference", () => {
    it("should return false when not a vague reference", () => {
      const result = handleVagueReference({
        normalized: "create a value about happiness",
        lastMentionedValueId: "v1",
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });

    it("should return false when no last mentioned value", () => {
      const result = handleVagueReference({
        normalized: "edit it",
        lastMentionedValueId: null,
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });

    it("should handle vague edit reference", () => {
      const result = handleVagueReference({
        normalized: "edit it",
        lastMentionedValueId: "v1",
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "edit",
        valueId: "v1",
      });
    });

    it("should handle vague delete reference", () => {
      const result = handleVagueReference({
        normalized: "delete that",
        lastMentionedValueId: "v2",
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v2",
      });
    });

    it("should return false when target value not found", () => {
      const result = handleVagueReference({
        normalized: "edit it",
        lastMentionedValueId: "non-existent",
        values: mockValues,
        setPendingAction: mockSetPendingAction,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });
  });

  describe("handleSpecificReference", () => {
    it("should return false when not a specific reference", async () => {
      const result = await handleSpecificReference({
        normalized: "create value about happiness",
        trimmed: "Create value about happiness",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });

    it("should handle edit the one about pattern with direct match", async () => {
      // "family" is in the first value's statement
      const result = await handleSpecificReference({
        normalized: "edit the one about family",
        trimmed: "Edit the one about family",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v1");
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "edit",
        valueId: "v1",
      });
    });

    it("should handle delete the one about pattern", async () => {
      const result = await handleSpecificReference({
        normalized: "delete the one about learning",
        trimmed: "Delete the one about learning",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v2");
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v2",
      });
    });

    it("should handle remove the one about pattern", async () => {
      const result = await handleSpecificReference({
        normalized: "remove the one about family",
        trimmed: "Remove the one about family",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v1",
      });
    });

    it("should handle the one with pattern", async () => {
      const result = await handleSpecificReference({
        normalized: "edit the one with learning",
        trimmed: "Edit the one with learning",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v2");
    });

    it("should call api.matchValue when no direct match found", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue({ value_id: "v1" });

      const result = await handleSpecificReference({
        normalized: "edit the one about xyz",
        trimmed: "Edit the one about xyz",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetSending).toHaveBeenCalledWith(true);
      expect(api.matchValue).toHaveBeenCalled();
      expect(mockSetSending).toHaveBeenCalledWith(false);
    });

    it("should show not found message when no match", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue(null);

      const result = await handleSpecificReference({
        normalized: "edit the one about xyz",
        trimmed: "Edit the one about xyz",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        "I couldn't find a value matching that. Try a few exact words from the statement?",
        "_not_found",
      );
    });

    it("should handle api error gracefully", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockRejectedValue(new Error("API error"));

      const result = await handleSpecificReference({
        normalized: "edit the one about xyz",
        trimmed: "Edit the one about xyz",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetSending).toHaveBeenCalledWith(false);
    });
  });

  describe("handleTriggerMatch", () => {
    it("should return false when no trigger detected", async () => {
      const result = await handleTriggerMatch({
        normalized: "add a value about happiness",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(false);
    });

    it("should handle edit trigger with value match", async () => {
      const result = await handleTriggerMatch({
        normalized: "edit my family value",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "edit",
        valueId: "v1",
      });
    });

    it("should handle delete trigger", async () => {
      const result = await handleTriggerMatch({
        normalized: "delete the learning value",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v2",
      });
    });

    it("should handle remove trigger", async () => {
      const result = await handleTriggerMatch({
        normalized: "remove family",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetPendingAction).toHaveBeenCalledWith({
        type: "delete",
        valueId: "v1",
      });
    });

    it("should call api.matchValue when no direct match", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue({ value_id: "v2" });

      const result = await handleTriggerMatch({
        normalized: "edit xyz",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(api.matchValue).toHaveBeenCalled();
    });

    it("should show not found when no match", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockResolvedValue(null);

      const result = await handleTriggerMatch({
        normalized: "edit xyz",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockAddAssistantMessage).toHaveBeenCalledWith(
        "I couldn't find a value matching that. Try a few exact words from the statement?",
        "_not_found",
      );
    });

    it("should handle api error gracefully", async () => {
      const api = require("../../services/api").default;
      api.matchValue.mockRejectedValue(new Error("API error"));

      const result = await handleTriggerMatch({
        normalized: "edit xyz",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetSending).toHaveBeenCalledWith(false);
    });

    it("should set lastMentionedValueId when target found", async () => {
      const result = await handleTriggerMatch({
        normalized: "edit family",
        values: mockValues,
        setLastMentionedValueId: mockSetLastMentionedValueId,
        setPendingAction: mockSetPendingAction,
        setSending: mockSetSending,
        addAssistantMessage: mockAddAssistantMessage,
      });

      expect(result).toBe(true);
      expect(mockSetLastMentionedValueId).toHaveBeenCalledWith("v1");
    });
  });
});
