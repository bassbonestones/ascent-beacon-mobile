/**
 * Utility functions for matching user text to values.
 */
import type { Value, ValueRevision } from "../types";

const STOP_WORDS = new Set([
  "a",
  "about",
  "the",
  "an",
  "and",
  "or",
  "to",
  "of",
  "with",
  "that",
  "this",
  "it",
  "value",
  "values",
  "one",
  "can",
  "we",
  "i",
  "im",
  "i'm",
  "want",
  "like",
  "not",
  "really",
  "just",
  "maybe",
  "please",
]);

/**
 * Tokenize text into meaningful words, removing stop words.
 */
export const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));

/**
 * Remove trigger words from text for cleaner matching.
 */
export const stripTriggers = (text: string, triggers: string[]): string => {
  let cleaned = text;
  triggers.forEach((trigger) => {
    cleaned = cleaned.replace(new RegExp(trigger, "gi"), " ");
  });
  return cleaned;
};

/**
 * Clean and normalize a text snippet for comparison.
 */
export const cleanSnippet = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Get the active revision for a value.
 */
export const getActiveRevision = (value: Value): ValueRevision | null => {
  if (!value?.active_revision_id || !value.revisions) return null;
  return (
    value.revisions.find((rev) => rev.id === value.active_revision_id) || null
  );
};

/**
 * Find a value by searching for a snippet in the statement.
 */
export const findValueBySnippet = (
  values: Value[],
  snippet: string,
): Value | null => {
  const normalized = cleanSnippet(snippet);
  if (!normalized) return null;

  return (
    values.find((value) => {
      const activeRev = getActiveRevision(value);
      const statement = activeRev?.statement?.toLowerCase() || "";
      return statement.includes(normalized);
    }) || null
  );
};

/**
 * Find the best matching value using keyword overlap scoring.
 */
export const findBestValueMatch = (
  values: Value[],
  text: string,
): Value | null => {
  const keywords = new Set(tokenize(text));
  if (keywords.size === 0) return null;

  let best: Value | null = null;
  let bestScore = 0;

  values.forEach((value) => {
    const activeRev = getActiveRevision(value);
    if (!activeRev?.statement) return;

    const statement = activeRev.statement.toLowerCase();
    const tokens = new Set(tokenize(statement));
    let matches = 0;

    keywords.forEach((token) => {
      if (tokens.has(token) || statement.includes(token)) {
        matches += 1;
      }
    });

    const score = matches / Math.max(tokens.size, 1);
    if (score > bestScore) {
      bestScore = score;
      best = value;
    }
  });

  return bestScore >= 0.25 ? best : null;
};

/**
 * Trigger word lists for detecting edit/delete intents.
 */
export const EDIT_TRIGGERS = [
  "edit",
  "update",
  "change",
  "revise",
  "reword",
  "refine",
  "not crazy about",
  "not happy with",
  "not a fan",
  "dont like",
  "don't like",
];

export const DELETE_TRIGGERS = [
  "delete",
  "remove",
  "drop",
  "get rid of",
  "ditch",
  "eliminate",
  "dont want",
  "don't want",
];

/**
 * Patterns for detecting vague edit references like "edit it" or "change that".
 */
export const VAGUE_EDIT_PATTERNS = [
  /^(let'?s\s+)?(refine|edit|update|change|revise|reword)\s+(it|that|this)(\s+now)?$/i,
  /^(refine|edit|update|change|revise|reword)\s+$/i,
  /^(let'?s\s+)?(refine|edit|update|change)\s+(the\s+)?(last|recent)\s+one$/i,
];

/**
 * Patterns for detecting vague delete references.
 */
export const VAGUE_DELETE_PATTERNS = [
  /^(let'?s\s+)?(delete|remove|drop|get\s+rid\s+of)\s+(it|that|this)(\s+now)?$/i,
  /^(delete|remove|drop)\s+$/i,
  /^(let'?s\s+)?(delete|remove)\s+(the\s+)?(last|recent)\s+one$/i,
];

/**
 * Check if text matches any pattern in a list.
 */
export const matchesPattern = (text: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

/**
 * Check if text contains any trigger word from a list.
 */
export const containsTrigger = (text: string, triggers: string[]): boolean =>
  triggers.some((trigger) => text.includes(trigger));
