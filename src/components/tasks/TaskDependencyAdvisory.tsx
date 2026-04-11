import React from "react";
import { Text } from "react-native";
import type { Task } from "../../types";

export interface TaskDependencyAdvisoryProps {
  task: Task;
}

/**
 * Grey advisory from server-embedded dependency_summary (Phase 4i-5).
 */
export function TaskDependencyAdvisory({
  task,
}: TaskDependencyAdvisoryProps): React.ReactElement | null {
  const text = task.dependency_summary?.advisory_text;
  if (!text) return null;
  return (
    <Text
      style={{
        fontSize: 12,
        color: "#9CA3AF",
        marginTop: 4,
        fontStyle: "italic",
      }}
      numberOfLines={3}
    >
      {text}
    </Text>
  );
}
