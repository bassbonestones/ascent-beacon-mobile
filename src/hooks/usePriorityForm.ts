import { useState, useRef, useCallback } from "react";
import api from "../services/api";
import type { Priority, PriorityScope, RuleExample } from "../types";

/**
 * Priority form data.
 */
export interface PriorityFormData {
  title: string;
  why_matters: string;
  score: number;
  scope: PriorityScope;
  cadence: string;
  constraints: string;
  value_ids: string[];
}

/**
 * Validation feedback for form fields.
 */
export interface ValidationFeedback {
  name: string[];
  why: string[];
}

/**
 * Validation rules status.
 */
export interface ValidationRules {
  personal: boolean;
  meaning_based: boolean;
  implies_protection: boolean;
  concrete: boolean;
}

const INITIAL_FORM_DATA: PriorityFormData = {
  title: "",
  why_matters: "",
  score: 3,
  scope: "ongoing",
  cadence: "",
  constraints: "",
  value_ids: [],
};

/**
 * Return type for usePriorityForm hook.
 */
export interface UsePriorityFormReturn {
  formData: PriorityFormData;
  setFormData: React.Dispatch<React.SetStateAction<PriorityFormData>>;
  validationFeedback: ValidationFeedback;
  validationRules: ValidationRules;
  ruleExamples: Record<string, RuleExample>;
  validating: boolean;
  selectedValues: Set<string>;
  setSelectedValues: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleNameChange: (text: string) => void;
  handleWhyChange: (text: string) => void;
  toggleValue: (
    valueId: string,
    isAnchored?: boolean,
    onAnchorBlock?: () => void,
  ) => void;
  resetForm: () => void;
  loadFromPriority: (priority: Priority) => void;
  clearValidationTimeout: () => void;
}

const INITIAL_VALIDATION_RULES: ValidationRules = {
  personal: false,
  meaning_based: false,
  implies_protection: false,
  concrete: false,
};

/**
 * Custom hook for priority form state and validation.
 */
export default function usePriorityForm(): UsePriorityFormReturn {
  const [formData, setFormData] = useState<PriorityFormData>(INITIAL_FORM_DATA);
  const [validationFeedback, setValidationFeedback] =
    useState<ValidationFeedback>({
      name: [],
      why: [],
    });
  const [validationRules, setValidationRules] = useState<ValidationRules>(
    INITIAL_VALIDATION_RULES,
  );
  const [ruleExamples, setRuleExamples] = useState<Record<string, RuleExample>>(
    {},
  );
  const [validating, setValidating] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());

  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearValidationTimeout = useCallback((): void => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
  }, []);

  const validateField = useCallback(
    async (field: string, value: string, title?: string): Promise<boolean> => {
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
          const errorObj = error as Error;
          return !errorObj.message?.includes("name");
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
          const rules = response.why_passed_rules || {};
          setValidationRules({
            personal: Boolean(rules.personal),
            meaning_based: Boolean(rules.meaning_based),
            implies_protection: Boolean(rules.implies_protection),
            concrete: Boolean(rules.concrete),
          });
          setRuleExamples(response.rule_examples || {});
          return response.overall_valid;
        } catch {
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
    (text: string): void => {
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
    (text: string): void => {
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
        setValidationRules(INITIAL_VALIDATION_RULES);
      }
    },
    [clearValidationTimeout, formData.title, validateField],
  );

  const toggleValue = useCallback(
    (
      valueId: string,
      isAnchored: boolean = false,
      onAnchorBlock?: () => void,
    ): void => {
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

  const resetForm = useCallback((): void => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedValues(new Set());
    setValidationFeedback({ name: [], why: [] });
    setValidationRules(INITIAL_VALIDATION_RULES);
    setRuleExamples({});
  }, []);

  const loadFromPriority = useCallback((priority: Priority): void => {
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
