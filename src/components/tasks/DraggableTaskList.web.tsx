/**
 * Anytime task list — web: HTML5 drag-and-drop.
 */
import React, { useState, useCallback, useRef } from "react";
import { RefreshControl, ScrollView } from "react-native";
import type { Task } from "../../types";
import { TaskCard } from "./TaskCard";
import { styles } from "../../screens/styles/tasksScreenStyles";
import type { DraggableTaskListProps } from "./draggableTaskListShared";

export function DraggableTaskList({
  tasks,
  currentDate,
  loading,
  loadingMore,
  onTaskPress,
  onComplete,
  onReorder,
  onRefresh,
  tasksWithPrerequisites,
}: DraggableTaskListProps): React.ReactElement {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number, task: Task) => {
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
          onReorder(draggedTask, targetTask.sort_order);
        }
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
      dragOverIndexRef.current = null;
    },
    [tasks, onReorder],
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={loading && !loadingMore}
          onRefresh={onRefresh}
        />
      }
    >
      {tasks.map((task, index) => {
        const isDraggable =
          task.status === "pending" && task.sort_order !== null;
        const isDragging = draggedIndex === index;
        const isDragOver =
          dragOverIndex === index &&
          draggedIndex !== null &&
          draggedIndex !== index;

        const isDraggingUp = draggedIndex !== null && draggedIndex > index;
        const showTopIndicator = isDragOver && isDraggingUp;
        const showBottomIndicator = isDragOver && !isDraggingUp;

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
              hasPrerequisites={
                tasksWithPrerequisites?.has(task.originalTaskId ?? task.id) ??
                false
              }
            />
          </div>
        );
      })}
    </ScrollView>
  );
}
