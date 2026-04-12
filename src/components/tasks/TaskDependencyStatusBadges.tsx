import React from "react";
import { View, Text } from "react-native";
import type { Task } from "../../types";

const toneColors = {
  error: { bg: "#FEE2E2", fg: "#991B1B", border: "#FECACA" },
  warning: { bg: "#FEF3C7", fg: "#92400E", border: "#FDE68A" },
  success: { bg: "#D1FAE5", fg: "#065F46", border: "#A7F3D0" },
  muted: { bg: "#F3F4F6", fg: "#4B5563", border: "#E5E7EB" },
};

export function dependencyStatusAccessibilityLabel(task: Task): string | null {
  const s = task.dependency_summary;
  if (!s) return null;
  const parts: string[] = [];
  if (s.has_unmet_hard) parts.push("Required prerequisites not met");
  if (s.has_unmet_soft) parts.push("Recommended prerequisites pending");
  if (!s.has_unmet_hard && !s.has_unmet_soft) {
    parts.push("Prerequisites met");
  }
  return parts.length ? parts.join(". ") : null;
}

/**
 * List-view prerequisite strength and readiness from embedded dependency_summary.
 */
export function TaskDependencyStatusBadges({
  task,
}: {
  task: Task;
}): React.ReactElement | null {
  const s = task.dependency_summary;
  if (!s) return null;

  const rows: { text: string; tone: keyof typeof toneColors }[] = [];

  if (s.has_unmet_hard) {
    rows.push({ text: "Required first", tone: "error" });
  }
  if (s.has_unmet_soft) {
    rows.push({
      text: s.has_unmet_hard
        ? "Soft prereqs pending"
        : "Recommended first",
      tone: "warning",
    });
  }
  if (!s.has_unmet_hard && !s.has_unmet_soft) {
    rows.push({ text: "Prereqs met", tone: "success" });
  }

  if (rows.length === 0) return null;

  return (
    <View style={{ marginTop: 6, gap: 4, flexDirection: "row", flexWrap: "wrap" }}>
      {rows.map((row) => {
        const c = toneColors[row.tone];
        return (
          <View
            key={row.text}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: c.bg,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: c.fg }}>
              {row.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
