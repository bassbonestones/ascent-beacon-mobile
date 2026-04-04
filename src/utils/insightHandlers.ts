import type { RefObject } from "react";
import type { ScrollView } from "react-native";
import api from "../services/api";
import { logError } from "./logger";
import type { ValueInsight } from "../types";

/**
 * Handle "Keep Both" action for value insights.
 * Acknowledges the insight on the server and removes it from local state.
 */
export async function handleKeepBoth(
  valueId: string,
  setValueInsights: React.Dispatch<
    React.SetStateAction<Record<string, ValueInsight>>
  >,
): Promise<void> {
  try {
    await api.acknowledgeValueInsight(valueId);
  } catch (error) {
    logError("Failed to acknowledge insight:", error);
  }
  setValueInsights((prev) => {
    const next = { ...prev };
    delete next[valueId];
    return next;
  });
}

/**
 * Handle reviewing an insight by scrolling to the similar value.
 * Highlights the target value briefly.
 */
export function handleReviewInsight(
  valueId: string,
  valueInsights: Record<string, ValueInsight>,
  valuePositions: RefObject<Record<string, number>>,
  scrollViewRef: RefObject<ScrollView | null>,
  setHighlightValueId: (id: string | null) => void,
): void {
  const insight = valueInsights[valueId];
  if (!insight?.similar_value_id) return;

  const targetY = valuePositions.current[insight.similar_value_id];
  if (typeof targetY === "number") {
    scrollViewRef.current?.scrollTo({
      y: Math.max(targetY - 12, 0),
      animated: true,
    });
  }

  setHighlightValueId(insight.similar_value_id);
  setTimeout(() => setHighlightValueId(null), 1200);
}
