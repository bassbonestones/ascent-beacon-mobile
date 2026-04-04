/**
 * Tests for valueMatching utility
 */

import {
  tokenize,
  stripTriggers,
  cleanSnippet,
  getActiveRevision,
  findValueBySnippet,
  findBestValueMatch,
  matchesPattern,
  containsTrigger,
  EDIT_TRIGGERS,
  DELETE_TRIGGERS,
  VAGUE_EDIT_PATTERNS,
  VAGUE_DELETE_PATTERNS,
} from "../valueMatching";

describe("valueMatching utilities", () => {
  describe("tokenize", () => {
    it("should lowercase and split text into words", () => {
      const result = tokenize("Hello World Test");
      expect(result).toEqual(["hello", "world", "test"]);
    });

    it("should remove stop words", () => {
      const result = tokenize("I want to value the things");
      expect(result).toEqual(["things"]);
    });

    it("should remove punctuation", () => {
      const result = tokenize("Hello, world! How's it going?");
      expect(result).toContain("hello");
      expect(result).toContain("world");
      // Apostrophe splits "how's" into "how" and "s"
      expect(result).toContain("how");
      expect(result).toContain("going");
    });

    it("should filter empty tokens", () => {
      const result = tokenize("   spaces   between   ");
      expect(result).toEqual(["spaces", "between"]);
    });
  });

  describe("stripTriggers", () => {
    it("should remove trigger words from text", () => {
      const result = stripTriggers("edit my value statement", ["edit"]);
      expect(result).toBe("  my value statement");
    });

    it("should remove multiple triggers", () => {
      const result = stripTriggers("delete and remove this", [
        "delete",
        "remove",
      ]);
      expect(result).toBe("  and   this");
    });

    it("should be case insensitive", () => {
      const result = stripTriggers("EDIT this NOW", ["edit"]);
      expect(result).toBe("  this NOW");
    });
  });

  describe("cleanSnippet", () => {
    it("should normalize text for comparison", () => {
      const result = cleanSnippet("  Hello,  World!  ");
      expect(result).toBe("hello world");
    });

    it("should remove special characters", () => {
      const result = cleanSnippet("test@#$%ing");
      expect(result).toBe("test ing");
    });

    it("should handle empty strings", () => {
      const result = cleanSnippet("   ");
      expect(result).toBe("");
    });
  });

  describe("getActiveRevision", () => {
    it("should return active revision when found", () => {
      const value = {
        active_revision_id: "rev1",
        revisions: [
          { id: "rev1", statement: "Active" },
          { id: "rev2", statement: "Old" },
        ],
      };
      const result = getActiveRevision(value);
      expect(result).toEqual({ id: "rev1", statement: "Active" });
    });

    it("should return null when no active_revision_id", () => {
      const value = { revisions: [{ id: "rev1" }] };
      const result = getActiveRevision(value);
      expect(result).toBeNull();
    });

    it("should return null when no revisions array", () => {
      const value = { active_revision_id: "rev1" };
      const result = getActiveRevision(value);
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      expect(getActiveRevision(null)).toBeNull();
    });
  });

  describe("findValueBySnippet", () => {
    const values = [
      {
        id: "1",
        active_revision_id: "r1",
        revisions: [
          { id: "r1", statement: "I value family and relationships" },
        ],
      },
      {
        id: "2",
        active_revision_id: "r2",
        revisions: [{ id: "r2", statement: "Career growth is important" }],
      },
    ];

    it("should find value by exact snippet match", () => {
      const result = findValueBySnippet(values, "family");
      expect(result?.id).toBe("1");
    });

    it("should match case insensitively", () => {
      const result = findValueBySnippet(values, "CAREER GROWTH");
      expect(result?.id).toBe("2");
    });

    it("should return undefined when no match found", () => {
      const result = findValueBySnippet(values, "xyz nonexistent");
      expect(result).toBeUndefined();
    });

    it("should return null for empty snippet", () => {
      const result = findValueBySnippet(values, "   ");
      expect(result).toBeNull();
    });
  });

  describe("findBestValueMatch", () => {
    const values = [
      {
        id: "1",
        active_revision_id: "r1",
        revisions: [
          {
            id: "r1",
            statement: "I believe in continuous learning and education",
          },
        ],
      },
      {
        id: "2",
        active_revision_id: "r2",
        revisions: [
          { id: "r2", statement: "Health and wellness matter to me" },
        ],
      },
    ];

    it("should find value with best keyword overlap", () => {
      const result = findBestValueMatch(values, "learning education growth");
      expect(result?.id).toBe("1");
    });

    it("should return null when no good match found", () => {
      const result = findBestValueMatch(values, "xyz abc def");
      expect(result).toBeNull();
    });

    it("should return null for empty text", () => {
      const result = findBestValueMatch(values, "");
      expect(result).toBeNull();
    });

    it("should return null when only stop words", () => {
      const result = findBestValueMatch(values, "the and or");
      expect(result).toBeNull();
    });
  });

  describe("matchesPattern", () => {
    it("should return true when text matches a pattern", () => {
      const result = matchesPattern("edit it", VAGUE_EDIT_PATTERNS);
      expect(result).toBe(true);
    });

    it("should return true for variations", () => {
      expect(matchesPattern("let's edit that", VAGUE_EDIT_PATTERNS)).toBe(true);
      expect(matchesPattern("delete that", VAGUE_DELETE_PATTERNS)).toBe(true);
    });

    it("should return false when no pattern matches", () => {
      const result = matchesPattern(
        "edit my family value",
        VAGUE_EDIT_PATTERNS,
      );
      expect(result).toBe(false);
    });
  });

  describe("containsTrigger", () => {
    it("should return true when text contains trigger", () => {
      expect(containsTrigger("please edit this value", EDIT_TRIGGERS)).toBe(
        true,
      );
      expect(containsTrigger("delete that one", DELETE_TRIGGERS)).toBe(true);
    });

    it("should return false when no trigger found", () => {
      expect(containsTrigger("create a new value", EDIT_TRIGGERS)).toBe(false);
    });

    it("should handle phrase triggers", () => {
      expect(containsTrigger("get rid of that value", DELETE_TRIGGERS)).toBe(
        true,
      );
      expect(containsTrigger("not crazy about that", EDIT_TRIGGERS)).toBe(true);
    });
  });

  describe("trigger constants", () => {
    it("should have edit triggers", () => {
      expect(EDIT_TRIGGERS).toContain("edit");
      expect(EDIT_TRIGGERS).toContain("update");
      expect(EDIT_TRIGGERS).toContain("change");
    });

    it("should have delete triggers", () => {
      expect(DELETE_TRIGGERS).toContain("delete");
      expect(DELETE_TRIGGERS).toContain("remove");
      expect(DELETE_TRIGGERS).toContain("get rid of");
    });
  });
});
