import api from "../services/api";
import {
  getActiveRevision,
  findValueBySnippet,
  findBestValueMatch,
  cleanSnippet,
  stripTriggers,
  EDIT_TRIGGERS,
  DELETE_TRIGGERS,
  VAGUE_EDIT_PATTERNS,
  VAGUE_DELETE_PATTERNS,
  matchesPattern,
  containsTrigger,
} from "../utils/valueMatching";

/**
 * Check if input is a yes/no confirmation.
 */
const parseConfirmation = (normalized) => {
  const isYes =
    normalized === "yes" || normalized.startsWith("yes ") || normalized === "y";
  const isNo =
    normalized === "no" || normalized.startsWith("no ") || normalized === "n";
  return { isYes, isNo };
};

/**
 * Handle pending action (edit/delete) confirmation.
 */
export const handlePendingAction = async ({
  normalized,
  pendingAction,
  values,
  setPendingAction,
  setEditValueId,
  performDeleteValue,
  addAssistantMessage,
}) => {
  if (!pendingAction) return false;

  const { isYes, isNo } = parseConfirmation(normalized);

  if (isNo) {
    setPendingAction(null);
    addAssistantMessage(
      "Okay, I won't change it. Want to add another value or explore further?",
      "_cancel",
    );
    return true;
  }

  if (!isYes) return false;

  const value = values.find((item) => item.id === pendingAction.valueId);
  if (!value) {
    setPendingAction(null);
    return true;
  }

  if (pendingAction.type === "delete") {
    await performDeleteValue(value);
    setPendingAction(null);
    return true;
  }

  if (pendingAction.type === "edit") {
    setEditValueId(value.id);
    const activeRev = getActiveRevision(value);
    const existingStatement = activeRev?.statement || "that value";
    addAssistantMessage(
      `Send the new wording for "${existingStatement}", or say "discuss" to talk it through.`,
      "_edit",
    );
    setPendingAction(null);
    return true;
  }

  return false;
};

/**
 * Handle edit mode - user is submitting a new statement.
 */
export const handleEditMode = async ({
  normalized,
  trimmed,
  editValueId,
  values,
  setEditValueId,
  updateValue,
  addAssistantMessage,
}) => {
  if (!editValueId) return false;

  if (normalized.includes("discuss")) {
    setEditValueId(null);
    addAssistantMessage(
      "Okay, let's talk it through. What's the heart of this value for you?",
      "_discuss",
    );
    return true;
  }

  const value = values.find((item) => item.id === editValueId);
  if (value) {
    await updateValue(value, trimmed);
    return true;
  }

  return false;
};

/**
 * Handle vague references like "edit it" or "delete that".
 */
export const handleVagueReference = ({
  normalized,
  lastMentionedValueId,
  values,
  setPendingAction,
  addAssistantMessage,
}) => {
  const isVagueEdit = matchesPattern(normalized, VAGUE_EDIT_PATTERNS);
  const isVagueDelete = matchesPattern(normalized, VAGUE_DELETE_PATTERNS);

  if (!isVagueEdit && !isVagueDelete) return false;
  if (!lastMentionedValueId) return false;

  const target = values.find((v) => v.id === lastMentionedValueId);
  if (!target) return false;

  const actionType = isVagueDelete ? "delete" : "edit";
  const activeRev = getActiveRevision(target);
  const statement = activeRev?.statement || "that value";
  setPendingAction({ type: actionType, valueId: target.id });

  const verb = actionType === "delete" ? "remove" : "edit";
  addAssistantMessage(
    `You want to ${verb} "${statement}". Should I ${actionType === "delete" ? "delete" : "update"} that one? (yes/no)`,
    `_confirm_${actionType}`,
  );
  return true;
};

/**
 * Handle "edit/delete the one about..." patterns.
 */
export const handleSpecificReference = async ({
  normalized,
  trimmed,
  values,
  setLastMentionedValueId,
  setPendingAction,
  setSending,
  addAssistantMessage,
}) => {
  const editPatterns = ["edit the one about", "edit the one with"];
  const deletePatterns = [
    "remove the one about",
    "delete the one about",
    "remove the one with",
    "delete the one with",
  ];

  const isEdit = editPatterns.some((p) => normalized.includes(p));
  const isDelete = deletePatterns.some((p) => normalized.includes(p));

  if (!isEdit && !isDelete) return false;

  const snippet =
    normalized.split("about")[1] || normalized.split("with")[1] || "";
  let target = findValueBySnippet(values, snippet);

  if (!target) {
    const cleanedSnippet = cleanSnippet(snippet);
    try {
      setSending(true);
      const match = await api.matchValue(cleanedSnippet || trimmed);
      target = values.find((item) => item.id === match?.value_id) || null;
    } catch (error) {
      console.error("Failed to match value:", error);
    } finally {
      setSending(false);
    }
  }

  if (target) {
    const actionType = isDelete ? "delete" : "edit";
    const activeRev = getActiveRevision(target);
    const statement = activeRev?.statement || "that value";
    setLastMentionedValueId(target.id);
    setPendingAction({ type: actionType, valueId: target.id });

    const verb = isDelete ? "remove" : "edit";
    addAssistantMessage(
      `You want to ${verb} "${statement}". Should I ${isDelete ? "delete" : "update"} that one? (yes/no)`,
      `_confirm_${actionType}`,
    );
    return true;
  }

  addAssistantMessage(
    "I couldn't find a value matching that. Try a few exact words from the statement?",
    "_not_found",
  );
  return true;
};

/**
 * Handle trigger word detection in message.
 */
export const handleTriggerMatch = async ({
  normalized,
  values,
  setLastMentionedValueId,
  setPendingAction,
  setSending,
  addAssistantMessage,
}) => {
  const wantsDelete = containsTrigger(normalized, DELETE_TRIGGERS);
  const wantsEdit = containsTrigger(normalized, EDIT_TRIGGERS);

  if (!wantsDelete && !wantsEdit) return false;

  const triggers = wantsDelete ? DELETE_TRIGGERS : EDIT_TRIGGERS;
  const cleaned = stripTriggers(normalized, triggers);
  let target =
    findBestValueMatch(values, cleaned) ||
    findBestValueMatch(values, normalized);

  if (!target) {
    const queryForLLM = cleanSnippet(cleaned) || cleanSnippet(normalized);
    try {
      setSending(true);
      const match = await api.matchValue(queryForLLM);
      target = values.find((item) => item.id === match?.value_id) || null;
    } catch (error) {
      console.error("Failed to match value:", error);
    } finally {
      setSending(false);
    }
  }

  if (target) {
    const actionType = wantsDelete ? "delete" : "edit";
    const activeRev = getActiveRevision(target);
    const statement = activeRev?.statement || "that value";
    setLastMentionedValueId(target.id);
    setPendingAction({ type: actionType, valueId: target.id });

    const verb = wantsDelete ? "remove" : "edit";
    addAssistantMessage(
      `You want to ${verb} "${statement}". Should I ${wantsDelete ? "delete" : "update"} that one? (yes/no)`,
      `_confirm_${actionType}`,
    );
    return true;
  }

  addAssistantMessage(
    "I couldn't find a value matching that. Try a few exact words from the statement?",
    "_not_found",
  );
  return true;
};
