/**
 * ReorderTasksScreen - Screen for reordering untimed tasks for a specific day.
 *
 * Features:
 * - Drag-and-drop reordering of untimed tasks
 * - "(1 of 4)" labels for multi-per-day occurrences
 * - Cancel / Save for Today / Save Permanent buttons
 */
import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {
  Task,
  OccurrenceItem,
  SaveMode,
  ReorderItem,
  RootStackParamList,
} from "../types";
import api from "../services/api";

// Only require the draggable library on native platforms
let DraggableFlatList: any = null;
let ScaleDecorator: any = null;

if (Platform.OS !== "web") {
  try {
    const draggableModule = require("react-native-draggable-flatlist");
    DraggableFlatList = draggableModule.default;
    ScaleDecorator = draggableModule.ScaleDecorator;
  } catch (error) {
    console.warn("[ReorderTasksScreen] Failed to load draggable:", error);
  }
}

// ============================================================================
// Types
// ============================================================================

type Props = NativeStackScreenProps<RootStackParamList, "ReorderTasks">;

// ============================================================================
// Component
// ============================================================================

export default function ReorderTasksScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const { date, dateDisplay, items: initialItems } = route.params;

  const [items, setItems] = useState<ReorderItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there are at least 2 recurring tasks - only show "Save Permanent" if so
  // (need at least 2 to have a meaningful order on future days)
  const hasEnoughRecurringTasks = useMemo(() => {
    const recurringCount = items.filter(
      (item) => item.task.is_recurring,
    ).length;
    return recurringCount >= 2;
  }, [items]);

  // Handle drag end on native
  const handleDragEnd = useCallback(({ data }: { data: ReorderItem[] }) => {
    setItems(data);
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Handle save
  const handleSave = useCallback(
    async (saveMode: SaveMode) => {
      setSaving(true);
      setError(null);

      const occurrences: OccurrenceItem[] = items.map((item) => ({
        // Use originalTaskId for virtual occurrences, otherwise use id
        task_id: item.task.originalTaskId || item.task.id,
        occurrence_index: item.occurrenceIndex,
      }));

      try {
        await api.reorderOccurrences({
          date,
          occurrences,
          save_mode: saveMode,
        });
        navigation.goBack();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save order";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [date, items, navigation],
  );

  // Render a single item in the list
  const renderItem = useCallback(
    ({
      item,
      drag,
      isActive,
    }: {
      item: ReorderItem;
      drag?: () => void;
      isActive?: boolean;
    }) => {
      const content = (
        <View
          style={[styles.itemContainer, isActive && styles.itemContainerActive]}
        >
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.task.title}
            </Text>
            {item.occurrenceLabel && (
              <Text style={styles.occurrenceLabel}>{item.occurrenceLabel}</Text>
            )}
          </View>
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleText}>≡</Text>
          </View>
        </View>
      );

      // Native: wrap in TouchableOpacity with onLongPress for drag
      if (Platform.OS !== "web" && drag) {
        return (
          <ScaleDecorator>
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              delayLongPress={150}
              style={styles.itemTouchable}
            >
              {content}
            </TouchableOpacity>
          </ScaleDecorator>
        );
      }

      // Web: use draggable div
      return content;
    },
    [],
  );

  // Web drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  // Web drag handlers
  const handleWebDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    },
    [],
  );

  const handleWebDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragOverIndexRef.current = null;
  }, []);

  const handleWebDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverIndexRef.current !== index) {
        dragOverIndexRef.current = index;
        setDragOverIndex(index);
      }
    },
    [],
  );

  const handleWebDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(fromIndex) || fromIndex === dropIndex) {
        handleWebDragEnd();
        return;
      }

      setItems((prev) => {
        const newItems = [...prev];
        const [removed] = newItems.splice(fromIndex, 1);
        newItems.splice(dropIndex, 0, removed);
        return newItems;
      });
      handleWebDragEnd();
    },
    [handleWebDragEnd],
  );

  // Render list based on platform
  const listContent = useMemo(() => {
    if (Platform.OS === "web") {
      // Web: use FlatList with draggable divs
      return (
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={({ item, index }) => {
            const isDragging = draggedIndex === index;
            const isDragOver =
              dragOverIndex === index &&
              draggedIndex !== null &&
              draggedIndex !== index;

            // Determine indicator position based on drag direction
            const isDraggingUp = draggedIndex !== null && draggedIndex > index;
            const showTopIndicator = isDragOver && isDraggingUp;
            const showBottomIndicator = isDragOver && !isDraggingUp;

            return (
              <div
                draggable
                onDragStart={(e) => handleWebDragStart(e, index)}
                onDragEnd={handleWebDragEnd}
                onDragOver={(e) => handleWebDragOver(e, index)}
                onDrop={(e) => handleWebDrop(e, index)}
                style={{
                  opacity: isDragging ? 0.5 : 1,
                  cursor: "grab",
                  borderTop: showTopIndicator
                    ? "3px solid #6200ee"
                    : "3px solid transparent",
                  borderBottom: showBottomIndicator
                    ? "3px solid #6200ee"
                    : "3px solid transparent",
                  transition: "border 0.15s ease",
                }}
              >
                {renderItem({ item })}
              </div>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    // Native: use DraggableFlatList
    if (!DraggableFlatList) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Drag and drop not available on this device
          </Text>
        </View>
      );
    }

    return (
      <DraggableFlatList
        data={items}
        keyExtractor={(item: ReorderItem) => item.key}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.listContent}
        activationDistance={10}
      />
    );
  }, [
    items,
    renderItem,
    handleDragEnd,
    draggedIndex,
    dragOverIndex,
    handleWebDragStart,
    handleWebDragEnd,
    handleWebDragOver,
    handleWebDrop,
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reorder tasks for {dateDisplay}</Text>
        <Text style={styles.headerSubtitle}>
          Drag tasks to set your preferred order
        </Text>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* List */}
      <View style={styles.listWrapper}>{listContent}</View>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={() => handleSave("today")}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              testID="save-loading"
              size="small"
              color="#fff"
            />
          ) : (
            <Text style={styles.saveButtonText}>Save for Today</Text>
          )}
        </TouchableOpacity>

        {hasEnoughRecurringTasks && (
          <TouchableOpacity
            style={[styles.button, styles.permanentButton]}
            onPress={() => handleSave("permanent")}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                testID="save-loading-permanent"
                size="small"
                color="#fff"
              />
            ) : (
              <Text style={styles.saveButtonText}>Save Permanent</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: "#fee",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#fcc",
  },
  errorBannerText: {
    color: "#c00",
    textAlign: "center",
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemTouchable: {
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
  },
  itemContainerActive: {
    backgroundColor: "#e8f4fd",
    borderColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  occurrenceLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  dragHandle: {
    paddingLeft: 12,
  },
  dragHandleText: {
    fontSize: 24,
    color: "#999",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: "#666",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  permanentButton: {
    backgroundColor: "#5856D6",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
