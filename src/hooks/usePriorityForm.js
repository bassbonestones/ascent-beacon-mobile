import { useState, useRef, useCallback } from "react";
import api from "../services/api";

const INITIAL_FORM_DATA = {
  title: "",
  why_matters: "",
  score: 3,
  scope: "ongoing",
  cadence: "",
  constraints: "",
  value_ids: [],
};

/**
 * Custom hook for priority form state and validation
 */
export default function usePriorityForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [validationFeedback, setValidationFeedback] = useState({
    name: [],
    why: [],
  });
  const [validationRules, setValidationRules] = useState({});
  const [ruleExamples, setRuleExamples] = useState({});
  const [validating, setValidating] = useState(false);
  const [selectedValues, setSelectedValues] = useState(new Set());

  const validationTimeoutRef = useRef(null);

  const clearValidationTimeout = useCallback(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
  }, []);

  const validateField = useCallback(
    async (field, value, title) => {
      if (field === "title" && value.trim().length >= 10) {
        try {
          setValidating(true);
          const response = await api.validatePriority({
            name: value,
            why_statement:
              formData.why_matters || "placeholder text for validation",
          });
          setValidationFeedback((prev) => ({
            ...prev,
            name: response.name_feedback || [],
          }));
          return response.name_valid;
        } catch (error) {
          return !error.message?.includes("name");
        } finally {
          setValidating(false);
        }
      }

      if (field === "why_matters" && title && value.length >= 20) {
        try {
          setValidating(true);
          const response = await api.validatePriority({
            name: title,
            why_statement: value,
          });
          setValidationFeedback({
            name: response.name_feedback || [],
            why: response.why_feedback || [],
          });
          setValidationRules(response.why_passed_rules || {});
          setRuleExamples(response.rule_examples || {});
          return response.overall_valid;
        } catch (error) {
          return false;
        } finally {
          setValidating(false);
        }
      }
      return true;
    },
    [formData.why_matters],
  );

  const handleNameChange = useCallback(
    (text) => {
      setFormData((prev) => ({ ...prev, title: text }));
      clearValidationTimeout();

      if (text.trim().length > 5) {
        validationTimeoutRef.current = setTimeout(
          () => validateField("title", text),
          500,
        );
      } else if (text.trim().length > 0) {
        setValidationFeedback((prev) => ({
          ...prev,
          name: [
            "Add a detail: instead of 'Health', say 'Fitness', 'Sleep', or 'Mental health'",
          ],
        }));
      } else {
        setValidationFeedback((prev) => ({ ...prev, name: [] }));
      }
    },
    [clearValidationTimeout, validateField],
  );

  const handleWhyChange = useCallback(
    (text) => {
      setFormData((prev) => ({ ...prev, why_matters: text }));
      clearValidationTimeout();

      if (text.length >= 20) {
        validationTimeoutRef.current = setTimeout(
          () => validateField("why_matters", text, formData.title),
          500,
        );
      } else {
        setValidationFeedback((prev) => ({
          ...prev,
          why: ["Please tell us why this matters"],
        }));
        setValidationRules({});
      }
    },
    [clearValidationTimeout, formData.title, validateField],
  );

  const toggleValue = useCallback(
    (valueId, isAnchored = false, onAnchorBlock) => {
      if (
        isAnchored &&
        selectedValues.size === 1 &&
        selectedValues.has(valueId)
      ) {
        onAnchorBlock?.();
        return;
      }

      setSelectedValues((prev) => {
        const newSet = new Set(prev);
        newSet.has(valueId) ? newSet.delete(valueId) : newSet.add(valueId);
        return newSet;
      });
    },
    [selectedValues],
  );

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedValues(new Set());
    setValidationFeedback({ name: [], why: [] });
    setValidationRules({});
    setRuleExamples({});
  }, []);

  const loadFromPriority = useCallback((priority) => {
    const activeRev = priority?.active_revision;
    if (!activeRev) return;

    setFormData({
      title: activeRev.title || "",
      why_matters: activeRev.why_matters || "",
      score: activeRev.score || 3,
      scope: activeRev.scope || "ongoing",
      cadence:
        activeRev.cadence && activeRev.cadence !== "null"
          ? activeRev.cadence
          : "",
      constraints:
        activeRev.constraints && activeRev.constraints !== "null"
          ? activeRev.constraints
          : "",
      value_ids: [],
    });

    if (activeRev?.value_links?.length > 0) {
      setSelectedValues(
        new Set(activeRev.value_links.map((link) => link.value_id)),
      );
    } else {
      setSelectedValues(new Set());
    }

    setValidationFeedback({ name: [], why: [] });
    setValidationRules({
      personal: true,
      meaning_based: true,
      implies_protection: true,
      concrete: true,
    });
  }, []);

  return {
    formData,
    setFormData,
    validationFeedback,
    validationRules,
    ruleExamples,
    validating,
    selectedValues,
    setSelectedValues,
    handleNameChange,
    handleWhyChange,
    toggleValue,
    resetForm,
    loadFromPriority,
    clearValidationTimeout,
  };
}
