/**
 * Anytime task list — native: react-native-draggable-flatlist (long-press to drag).
 * Requires GestureHandlerRootView above (see App.tsx).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import type { Task } from "../../types";
import { TaskCard } from "./TaskCard";
import { styles } from "../../screens/styles/tasksScreenStyles";
import type { DraggableTaskListProps } from "./draggableTaskListShared";

export function DraggableTaskList({
  tasks,
  allTasks,
  currentDate,
  loading,
  loadingMore,
  onTaskPress,
  onComplete,
  onReorder,
  onRefresh,
  tasksWithPrerequisites,
}: DraggableTaskListProps): React.ReactElement {
  const [localData, setLocalData] = useState<Task[]>(tasks);
  const localDataRef = useRef<Task[]>(tasks);

  useEffect(() => {
    setLocalData(tasks);
  }, [tasks]);

  localDataRef.current = localData;

  const onDragEnd = useCallback(
    ({
      from,
      to,
      data: newData,
    }: {
      from: number;
      to: number;
      data: Task[];
    }) => {
      const prev = localDataRef.current;
      const moved = prev[from];
      const targetSlot = prev[to];
      setLocalData(newData);

      if (from === to) return;
      if (
        !moved ||
        moved.status !== "pending" ||
        moved.sort_order === null ||
        !targetSlot ||
        targetSlot.sort_order === null
      ) {
        return;
      }
      onReorder(moved, targetSlot.sort_order);
    },
    [onReorder],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => {
      const canDrag = item.status === "pending" && item.sort_order !== null;
      return (
        <ScaleDecorator>
          <TaskCard
            task={item}
            currentDate={currentDate}
            onPress={onTaskPress}
            onComplete={onComplete}
            drag={canDrag ? drag : undefined}
            isActive={isActive}
            hasPrerequisites={
              tasksWithPrerequisites?.has(item.originalTaskId ?? item.id) ??
              false
            }
          />
        </ScaleDecorator>
      );
    },
    [currentDate, onComplete, onTaskPress, tasksWithPrerequisites],
  );

  return (
    <DraggableFlatList
      data={localData}
      extraData={allTasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onDragEnd={onDragEnd}
      activationDistance={10}
      contentContainerStyle={styles.listContent}
      refreshing={loading && !loadingMore}
      onRefresh={onRefresh}
    />
  );
}
