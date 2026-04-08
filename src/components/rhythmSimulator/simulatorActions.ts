import api from "../../services/api";
import type { BulkCompletionEntry } from "../../types";
import { showAlert, showConfirm } from "../../utils/alert";
import { OccurrenceStates } from "./rhythmSimulatorConstants";

/**
 * Build bulk completion entries from occurrence states
 */
function buildEntries(
  occurrenceStates: OccurrenceStates,
): BulkCompletionEntry[] {
  const dateMap = new Map<string, { completed: number; skipped: number }>();

  Object.entries(occurrenceStates).forEach(([key, state]) => {
    const [date] = key.split(":");
    if (!dateMap.has(date)) dateMap.set(date, { completed: 0, skipped: 0 });
    const data = dateMap.get(date)!;
    if (state === "completed") data.completed++;
    else if (state === "skipped") data.skipped++;
  });

  const entries: BulkCompletionEntry[] = [];
  dateMap.forEach((counts, date) => {
    if (counts.completed > 0)
      entries.push({
        date,
        status: "completed",
        occurrences: counts.completed,
      });
    if (counts.skipped > 0)
      entries.push({ date, status: "skipped", occurrences: counts.skipped });
  });

  return entries;
}

/**
 * Save bulk completions for a task
 */
export async function saveBulkCompletions(
  taskId: string,
  occurrenceStates: OccurrenceStates,
  startDate: string | null,
  loadCompletions: (taskId: string) => Promise<void>,
  onDataChanged?: () => void,
): Promise<boolean> {
  if (!taskId) {
    showAlert("Error", "Please select a task first");
    return false;
  }

  const entries = buildEntries(occurrenceStates);

  if (entries.length === 0) {
    showAlert("Error", "No dates selected. Toggle states to mark them.");
    return false;
  }

  try {
    const result = await api.createBulkCompletions(taskId, {
      entries,
      update_start_date: startDate || undefined,
    });

    showAlert(
      "Success",
      `Created ${result.created_count} completion records.${
        result.start_date_updated ? " Start date updated." : ""
      }`,
    );

    await loadCompletions(taskId);
    onDataChanged?.();
    return true;
  } catch (err) {
    showAlert(
      "Error",
      `Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
    return false;
  }
}

/**
 * Clear mock completions for a task
 */
export async function clearMockCompletions(
  taskId: string,
  loadCompletions: (taskId: string) => Promise<void>,
  onDataChanged?: () => void,
): Promise<boolean> {
  if (!taskId) {
    showAlert("Error", "Please select a task first");
    return false;
  }

  const confirmed = await showConfirm(
    "Clear Mock Data",
    "This will delete all simulated completions for this task. Real completions will be preserved.",
  );

  if (!confirmed) return false;

  try {
    const result = await api.deleteMockCompletions(taskId);
    showAlert("Success", `Deleted ${result.deleted_count} mock completions.`);
    await loadCompletions(taskId);
    onDataChanged?.();
    return true;
  } catch (err) {
    showAlert(
      "Error",
      `Failed to clear: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
    return false;
  }
}
