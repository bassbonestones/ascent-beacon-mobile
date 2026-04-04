import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { logError } from "../utils/logger";
import type {
  DiscoveryPrompt,
  ValueSelection,
  SelectionBucket,
  Value,
  BulkSelectionUpdate,
} from "../types";

// ============================================================================
// Constants
// ============================================================================

export const LENSES = [
  "How I show up for others",
  "How I treat myself",
  "What I protect",
  "What I'm moving toward",
  "How I make decisions",
  "How I relate to the world",
] as const;

export const SENTENCE_STARTERS = [
  "I choose to",
  "I commit to",
  "I value being someone who",
] as const;

export const PROMPTS_PER_PAGE = 6;
export const MIN_CORE_VALUES = 3;
export const MAX_CORE_VALUES = 6;

// ============================================================================
// Types
// ============================================================================

export type DiscoveryStep =
  | "loading"
  | "select"
  | "bucket"
  | "narrow"
  | "review"
  | "create_statement"
  | "view_values"
  | "done";

export interface BucketItem {
  prompt_id: string;
  prompt: DiscoveryPrompt;
  bucket: SelectionBucket;
  display_order: number;
  custom_text?: string | null;
}

export interface Buckets {
  core: BucketItem[];
  important: BucketItem[];
  not_now: BucketItem[];
}

export interface CreatedStatement {
  prompt_id: string;
  prompt_text: string;
  statement: string;
  starter: string;
}

export interface UseValuesDiscoveryReturn {
  // State
  step: DiscoveryStep;
  prompts: DiscoveryPrompt[];
  selections: Set<string>;
  buckets: Buckets;
  narrowedCore: Set<string>;
  existingValues: Value[];
  loading: boolean;
  saving: boolean;

  // Selection pagination
  currentLensIndex: number;
  currentPage: number;
  currentLens: string;
  lensPrompts: DiscoveryPrompt[];
  visiblePrompts: DiscoveryPrompt[];
  totalPages: number;

  // Statement creation
  currentCoreIndex: number;
  currentCoreItem: BucketItem | null;
  statementStarter: string;
  statementText: string;
  createdStatements: CreatedStatement[];

  // Navigation
  setStep: (step: DiscoveryStep) => void;
  goToNextLens: () => void;
  goToPreviousLens: () => void;
  continueFromSelection: () => void;
  continueFromBucketing: () => boolean;
  continueFromNarrowing: () => boolean;

  // Selection actions
  toggleSelection: (promptId: string) => void;
  toggleNarrowedCore: (promptId: string) => void;

  // Bucket actions
  moveToBucket: (item: BucketItem, targetBucket: SelectionBucket) => void;

  // Statement actions
  setStatementStarter: (starter: string) => void;
  setStatementText: (text: string) => void;
  saveStatement: () => Promise<boolean>;
  goToPreviousStatement: () => void;

  // Data actions
  saveSelections: () => Promise<boolean>;
  loadData: () => Promise<void>;
  startExploreMore: () => Promise<void>;

  // Computed
  coreCount: number;
  canContinueFromBucket: boolean;
  needsNarrowing: boolean;
  maxSelectableCore: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export default function useValuesDiscovery(): UseValuesDiscoveryReturn {
  // Core state
  const [step, setStep] = useState<DiscoveryStep>("loading");
  const [prompts, setPrompts] = useState<DiscoveryPrompt[]>([]);
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [buckets, setBuckets] = useState<Buckets>({
    core: [],
    important: [],
    not_now: [],
  });
  const [narrowedCore, setNarrowedCore] = useState<Set<string>>(new Set());
  const [existingValues, setExistingValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selection pagination
  const [currentLensIndex, setCurrentLensIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Statement creation
  const [currentCoreIndex, setCurrentCoreIndex] = useState(0);
  const [statementStarter, setStatementStarter] = useState<string>(
    SENTENCE_STARTERS[0],
  );
  const [statementText, setStatementText] = useState("");
  const [createdStatements, setCreatedStatements] = useState<
    CreatedStatement[]
  >([]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const groupByLens = useCallback((): Record<string, DiscoveryPrompt[]> => {
    const grouped: Record<string, DiscoveryPrompt[]> = {};
    prompts.forEach((p) => {
      if (!grouped[p.primary_lens]) {
        grouped[p.primary_lens] = [];
      }
      grouped[p.primary_lens].push(p);
    });
    return grouped;
  }, [prompts]);

  const currentLens = LENSES[currentLensIndex];
  const grouped = groupByLens();
  const lensPrompts = grouped[currentLens] || [];
  const totalPages = Math.ceil(lensPrompts.length / PROMPTS_PER_PAGE);
  const startIdx = currentPage * PROMPTS_PER_PAGE;
  const endIdx = Math.min(startIdx + PROMPTS_PER_PAGE, lensPrompts.length);
  const visiblePrompts = lensPrompts.slice(startIdx, endIdx);

  const coreCount = buckets.core.length;
  // For "Explore More", include existing saved values in the total count
  const totalCoreCount = existingValues.length + coreCount;
  const needsNarrowing = coreCount >= 4; // 4+ NEW selections requires narrowing
  // Can continue if total core values (existing + new) meets minimum
  const canContinueFromBucket =
    existingValues.length > 0
      ? coreCount >= 1 // Explore More: need at least 1 new selection
      : coreCount >= MIN_CORE_VALUES; // Initial: need 3+ core values
  const maxSelectableCore = Math.min(coreCount, MAX_CORE_VALUES);
  const currentCoreItem = buckets.core[currentCoreIndex] || null;

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [promptsData, selectionsData, valuesData] = await Promise.all([
        api.getDiscoveryPrompts(),
        api.getUserSelections(),
        api.getValues(),
      ]);

      setPrompts(promptsData);

      // If user already has values, show them
      if (valuesData.values && valuesData.values.length > 0) {
        setExistingValues(valuesData.values);
        setStep("view_values");
        return;
      }

      // Restore existing selections if any
      if (selectionsData && selectionsData.length > 0) {
        const selected = new Set(selectionsData.map((s) => s.prompt_id));
        setSelections(selected);

        // Group by bucket
        const groupedBuckets: Buckets = {
          core: [],
          important: [],
          not_now: [],
        };

        selectionsData.forEach((s) => {
          const bucketItem: BucketItem = {
            prompt_id: s.prompt_id,
            prompt: s.prompt,
            bucket: s.bucket,
            display_order: s.display_order,
            custom_text: s.custom_text,
          };
          groupedBuckets[s.bucket].push(bucketItem);
        });

        setBuckets(groupedBuckets);

        // If they have buckets with core items, start at review
        if (groupedBuckets.core.length > 0) {
          setStep("review");
          return;
        }
      }

      setStep("select");
    } catch (error) {
      logError("Failed to load discovery data", error);
      setStep("select");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================================
  // Selection Actions
  // ============================================================================

  const toggleSelection = useCallback((promptId: string) => {
    setSelections((prev) => {
      const next = new Set(prev);
      if (next.has(promptId)) {
        next.delete(promptId);
      } else {
        next.add(promptId);
      }
      return next;
    });
  }, []);

  const toggleNarrowedCore = useCallback((promptId: string) => {
    setNarrowedCore((prev) => {
      const next = new Set(prev);
      if (next.has(promptId)) {
        next.delete(promptId);
      } else {
        next.add(promptId);
      }
      return next;
    });
  }, []);

  // ============================================================================
  // Navigation
  // ============================================================================

  const goToNextLens = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else if (currentLensIndex < LENSES.length - 1) {
      setCurrentLensIndex(currentLensIndex + 1);
      setCurrentPage(0);
    }
  }, [currentPage, totalPages, currentLensIndex]);

  const goToPreviousLens = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (currentLensIndex > 0) {
      const prevLensIndex = currentLensIndex - 1;
      const prevLens = LENSES[prevLensIndex];
      const prevLensPrompts = grouped[prevLens] || [];
      const prevTotalPages = Math.ceil(
        prevLensPrompts.length / PROMPTS_PER_PAGE,
      );
      setCurrentLensIndex(prevLensIndex);
      setCurrentPage(Math.max(0, prevTotalPages - 1));
    }
  }, [currentPage, currentLensIndex, grouped]);

  const continueFromSelection = useCallback(() => {
    // Check if we're at the end of all lenses
    const isLastPage =
      currentLensIndex === LENSES.length - 1 && currentPage >= totalPages - 1;

    if (!isLastPage) {
      goToNextLens();
      return;
    }

    // All lenses done - initialize buckets
    if (selections.size === 0) {
      return; // Let UI show no-selection modal
    }

    // Create bucket items from selections
    const existingBucketMap = new Map<string, SelectionBucket>();
    [...buckets.core, ...buckets.important, ...buckets.not_now].forEach(
      (item) => {
        existingBucketMap.set(item.prompt_id, item.bucket);
      },
    );

    const allPrompts = prompts;
    const initialItems: BucketItem[] = Array.from(selections).map(
      (promptId, idx) => {
        const prompt = allPrompts.find((p) => p.id === promptId);
        const existingBucket = existingBucketMap.get(promptId) || "important";
        return {
          prompt_id: promptId,
          prompt: prompt!,
          bucket: existingBucket,
          display_order: idx,
        };
      },
    );

    // Group by bucket
    const newBuckets: Buckets = {
      core: initialItems.filter((b) => b.bucket === "core"),
      important: initialItems.filter((b) => b.bucket === "important"),
      not_now: initialItems.filter((b) => b.bucket === "not_now"),
    };

    setBuckets(newBuckets);
    setStep("bucket");
  }, [
    currentLensIndex,
    currentPage,
    totalPages,
    selections,
    buckets,
    prompts,
    goToNextLens,
  ]);

  const continueFromBucketing = useCallback((): boolean => {
    // In "Explore More" mode, user already has existing values so we don't require 3+ new
    if (!canContinueFromBucket) {
      return false; // Let UI show warning
    }

    if (coreCount >= 4) {
      // 4+ NEW core values: narrow down to final 3-6
      setNarrowedCore(new Set());
      setStep("narrow");
      return true;
    }

    // Core is ready, go to review
    setStep("review");
    return true;
  }, [coreCount, canContinueFromBucket]);

  const continueFromNarrowing = useCallback((): boolean => {
    const selectedCount = narrowedCore.size;

    if (selectedCount < MIN_CORE_VALUES || selectedCount > maxSelectableCore) {
      return false; // Let UI show error
    }

    // Update buckets - move non-selected core items to important
    const newCore = buckets.core.filter((item) =>
      narrowedCore.has(item.prompt_id),
    );
    const movedToImportant = buckets.core.filter(
      (item) => !narrowedCore.has(item.prompt_id),
    );

    setBuckets({
      ...buckets,
      core: newCore,
      important: [...buckets.important, ...movedToImportant],
    });

    setStep("review");
    return true;
  }, [narrowedCore, maxSelectableCore, buckets]);

  // ============================================================================
  // Bucket Actions
  // ============================================================================

  const moveToBucket = useCallback(
    (item: BucketItem, targetBucket: SelectionBucket) => {
      setBuckets((prev) => {
        const newBuckets = { ...prev };

        // Remove from all buckets
        (Object.keys(newBuckets) as SelectionBucket[]).forEach((key) => {
          newBuckets[key] = newBuckets[key].filter(
            (i) => i.prompt_id !== item.prompt_id,
          );
        });

        // Add to target bucket
        const updatedItem = { ...item, bucket: targetBucket };
        newBuckets[targetBucket].push(updatedItem);

        return newBuckets;
      });
    },
    [],
  );

  // ============================================================================
  // Save Actions
  // ============================================================================

  const saveSelections = useCallback(async (): Promise<boolean> => {
    try {
      setSaving(true);

      const allSelections: BulkSelectionUpdate[] = [
        ...buckets.core.map((s, idx) => ({
          prompt_id: s.prompt_id,
          bucket: "core" as const,
          display_order: idx,
          custom_text: s.custom_text || null,
        })),
        ...buckets.important.map((s, idx) => ({
          prompt_id: s.prompt_id,
          bucket: "important" as const,
          display_order: idx,
          custom_text: s.custom_text || null,
        })),
        ...buckets.not_now.map((s, idx) => ({
          prompt_id: s.prompt_id,
          bucket: "not_now" as const,
          display_order: idx,
          custom_text: s.custom_text || null,
        })),
      ];

      await api.bulkUpdateSelections(allSelections);
      return true;
    } catch (error) {
      logError("Failed to save selections", error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [buckets]);

  // ============================================================================
  // Statement Actions
  // ============================================================================

  const saveStatement = useCallback(async (): Promise<boolean> => {
    if (!currentCoreItem || !statementText.trim()) return false;

    try {
      setSaving(true);
      const fullStatement = `${statementStarter} ${statementText}`.trim();

      console.warn("=== saveStatement called ===");
      console.warn(
        "currentCoreItem:",
        JSON.stringify(currentCoreItem, null, 2),
      );
      console.warn("source_prompt_id being sent:", currentCoreItem.prompt_id);
      console.warn("prompt.id:", currentCoreItem.prompt?.id);

      // Create the value with source prompt tracking
      await api.createValue({
        statement: fullStatement,
        weight_raw: 1, // Backend will normalize
        origin: "declared",
        source_prompt_id: currentCoreItem.prompt_id,
      });

      // Store created statement locally
      const newStatement: CreatedStatement = {
        prompt_id: currentCoreItem.prompt_id,
        prompt_text: currentCoreItem.prompt.prompt_text,
        statement: fullStatement,
        starter: statementStarter,
      };

      setCreatedStatements((prev) => [...prev, newStatement]);

      // Move to next or finish
      if (currentCoreIndex < buckets.core.length - 1) {
        setCurrentCoreIndex(currentCoreIndex + 1);
        setStatementText("");
        setStatementStarter(SENTENCE_STARTERS[0]);
      } else {
        // All done - reload values and show them
        const valuesData = await api.getValues();
        setExistingValues(valuesData.values || []);
        setStep("view_values");
      }

      return true;
    } catch (error) {
      logError("Failed to save value statement", error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    currentCoreItem,
    statementText,
    statementStarter,
    currentCoreIndex,
    buckets.core.length,
  ]);

  const goToPreviousStatement = useCallback(() => {
    if (currentCoreIndex > 0 && createdStatements[currentCoreIndex - 1]) {
      const prevStatement = createdStatements[currentCoreIndex - 1];
      setStatementStarter(prevStatement.starter);
      setStatementText(
        prevStatement.statement.replace(prevStatement.starter + " ", ""),
      );
      setCreatedStatements((prev) => prev.slice(0, -1));
      setCurrentCoreIndex(currentCoreIndex - 1);
    }
  }, [currentCoreIndex, createdStatements]);

  // ============================================================================
  // Explore More Values
  // ============================================================================

  const startExploreMore = useCallback(async () => {
    console.warn("=== startExploreMore CALLED ===");
    // Reset state to start discovery fresh (but keeps existing values)
    setSelections(new Set());
    setBuckets({ core: [], important: [], not_now: [] });
    setNarrowedCore(new Set());
    setCurrentLensIndex(0);
    setCurrentPage(0);
    setCurrentCoreIndex(0);
    setStatementStarter(SENTENCE_STARTERS[0]);
    setStatementText("");
    setCreatedStatements([]);
    setStep("loading");

    // Re-fetch prompts from API (will exclude already-used prompts)
    try {
      console.warn("=== Calling api.getDiscoveryPrompts() ===");
      const freshPrompts = await api.getDiscoveryPrompts();
      console.warn("=== Got prompts:", freshPrompts.length, "===");
      setPrompts(freshPrompts);
      setStep("select");
    } catch (error) {
      console.warn("=== ERROR in startExploreMore:", error, "===");
      logError("Failed to load prompts for explore more", error);
      setStep("select");
    }
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    step,
    prompts,
    selections,
    buckets,
    narrowedCore,
    existingValues,
    loading,
    saving,

    // Selection pagination
    currentLensIndex,
    currentPage,
    currentLens,
    lensPrompts,
    visiblePrompts,
    totalPages,

    // Statement creation
    currentCoreIndex,
    currentCoreItem,
    statementStarter,
    statementText,
    createdStatements,

    // Navigation
    setStep,
    goToNextLens,
    goToPreviousLens,
    continueFromSelection,
    continueFromBucketing,
    continueFromNarrowing,

    // Selection actions
    toggleSelection,
    toggleNarrowedCore,

    // Bucket actions
    moveToBucket,

    // Statement actions
    setStatementStarter,
    setStatementText,
    saveStatement,
    goToPreviousStatement,

    // Data actions
    saveSelections,
    loadData,
    startExploreMore,

    // Computed
    coreCount,
    canContinueFromBucket,
    needsNarrowing,
    maxSelectableCore,
  };
}
