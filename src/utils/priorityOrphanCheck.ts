import { Alert } from "react-native";
import api from "../services/api";
import type { Priority } from "../types";

/**
 * Check for and handle orphaned priorities (priorities with no linked values).
 * Shows Alert dialogs for user to decide: stash or delete each orphaned priority.
 *
 * @param onComplete - Callback to run after handling orphans
 */
export async function checkOrphanedPriorities(
  onComplete?: () => Promise<void>,
): Promise<void> {
  await new Promise((res) => setTimeout(res, 300));

  const allPriorities = await api.getPriorities();
  const orphaned: Priority[] = [];

  for (const priority of allPriorities.priorities || []) {
    if (priority.active_revision) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const status = await api.checkPriorityStatus(priority.id);
          if (status?.linked_values?.length === 0) {
            orphaned.push(priority);
            break;
          }
        } catch {
          /* ignore */
        }
        await new Promise((res) => setTimeout(res, 200));
      }
    }
  }

  if (orphaned.length > 0) {
    for (const orphan of orphaned) {
      await new Promise<void>((resolve) => {
        const title = orphan.active_revision?.title || "Untitled";
        Alert.alert(
          `No Values Linked: ${title}`,
          `The priority "${title}" has no linked values. Would you like to stash or delete it?`,
          [
            {
              text: "Stash",
              onPress: async () => {
                try {
                  await api.stashPriority(orphan.id, true);
                } catch {
                  Alert.alert("Error", "Failed to stash priority");
                }
                resolve();
              },
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  await api.deletePriority(orphan.id);
                } catch {
                  Alert.alert("Error", "Failed to delete priority");
                }
                resolve();
              },
            },
            { text: "Cancel", style: "cancel", onPress: () => resolve() },
          ],
        );
      });
    }

    if (onComplete) {
      await onComplete();
    }
    Alert.alert("Updated", "Orphaned priorities handled.");
    return;
  }
}
