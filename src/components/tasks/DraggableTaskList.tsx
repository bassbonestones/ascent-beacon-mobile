/**
 * DraggableTaskList - Cross-platform draggable task list for anytime tasks.
 *
 * On web: Uses HTML5 Drag and Drop API via div elements
 * On native: Falls back to FlatList with up/down arrow buttons
 *
 * This component handles the platform differences internally to avoid
 * bundler issues with react-native-reanimated on web.
 */
import React, { useState, useCallback, useRef } from "react";
import { FlatList, Platform, View, ScrollView, Text } from "react-native";
import type { Task } from "../../types";
import { TaskCard } from "./TaskCard";
import { styles } from "../../screens/styles/tasksScreenStyles";

interface DraggableTaskListProps {
  tasks: Task[];
  allTasks: Task[]; // For extraData (detecting changes)
  currentDate: Date;
  loading: boolean;
  loadingMore: boolean;
  onTaskPress: (task: Task) => void;
  onComplete: (task: Task) => void;
  onReorder: (task: Task, newSortOrder: number) => void;
  onRefresh: () => void;
}

/**
 * Web implementation using HTML5 Drag and Drop API.
 * Rendered only on web platform.
 */
function WebDraggableList({
  tasks,
  currentDate,
  onTaskPress,
  onComplete,
  onReorder,
}: Omit<
  DraggableTaskListProps,
  "allTasks" | "loading" | "loadingMore" | "onRefresh"
>): React.ReactElement {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number, task: Task) => {
      // Only allow dragging pending tasks with sort_order
      if (task.status !== "pending" || task.sort_order === null) {
        e.preventDefault();
        return;
      }
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragOverIndexRef.current = null;
  }, []);

  const handleDragOver = useCallback(
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

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, toIndex: number, targetTask: Task) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);

      if (fromIndex !== toIndex && !isNaN(fromIndex)) {
        const draggedTask = tasks[fromIndex];
        if (draggedTask && targetTask.sort_order !== null) {
          // Call the reorder handler with the target position
          onReorder(draggedTask, targetTask.sort_order);
        }
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
      dragOverIndexRef.current = null;
    },
    [tasks, onReorder],
  );

  // Filter to only pending tasks for reorder indicators
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
      {tasks.map((task, index) => {
        const isDraggable =
          task.status === "pending" && task.sort_order !== null;
        const isDragging = draggedIndex === index;
        const isDragOver =
          dragOverIndex === index &&
          draggedIndex !== null &&
          draggedIndex !== index;

        // Determine indicator position based on drag direction
        const isDraggingUp = draggedIndex !== null && draggedIndex > index;
        const showTopIndicator = isDragOver && isDraggingUp;
        const showBottomIndicator = isDragOver && !isDraggingUp;

        // Use a wrapper div for web drag functionality
        return (
          <div
            key={task.id}
            draggable={isDraggable}
            onDragStart={(e) => handleDragStart(e, index, task)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index, task)}
            style={{
              cursor: isDraggable ? "grab" : "default",
              borderTop: showTopIndicator
                ? "3px solid #6200ee"
                : "3px solid transparent",
              borderBottom: showBottomIndicator
                ? "3px solid #6200ee"
                : "3px solid transparent",
              opacity: isDragging ? 0.5 : 1,
              transition: "border 0.15s ease",
            }}
          >
            <TaskCard
              task={task}
              currentDate={currentDate}
              onPress={onTaskPress}
              onComplete={onComplete}
            />
          </div>
        );
      })}
    </ScrollView>
  );
}

/**
 * Native implementation using FlatList with up/down arrow buttons.
 * Rendered on iOS and Android.
 */
function NativeDraggableList({
  tasks,
  allTasks,
  currentDate,
  loading,
  loadingMore,
  onTaskPress,
  onComplete,
  onReorder,
  onRefresh,
}: DraggableTaskListProps): React.ReactElement {
  // Filter pending tasks to know bounds for up/down
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  return (
    <FlatList
      data={tasks}
      extraData={allTasks}
      renderItem={({ item, index }) => {
        const pendingIndex = pendingTasks.findIndex((t) => t.id === item.id);
        const canMoveUp = pendingIndex > 0;
        const canMoveDown =
          pendingIndex >= 0 && pendingIndex < pendingTasks.length - 1;

        return (
          <TaskCard
            task={item}
            currentDate={currentDate}
            onPress={onTaskPress}
            onComplete={onComplete}
            showReorderButtons={
              item.status === "pending" && item.sort_order !== null
            }
            onMoveUp={
              canMoveUp
                ? () => onReorder(item, item.sort_order! - 1)
                : undefined
            }
            onMoveDown={
              canMoveDown
                ? () => onReorder(item, item.sort_order! + 1)
                : undefined
            }
          />
        );
      }}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshing={loading && !loadingMore}
      onRefresh={onRefresh}
    />
  );
}

/**
 * Main component that selects the appropriate implementation based on platform.
 */
export function DraggableTaskList(
  props: DraggableTaskListProps,
): React.ReactElement {
  if (Platform.OS === "web") {
    return <WebDraggableList {...props} />;
  }
  return <NativeDraggableList {...props} />;
}
