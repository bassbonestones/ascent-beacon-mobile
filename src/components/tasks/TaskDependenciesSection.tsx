import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import type { DependencyRule } from "../../types";
import api from "../../services/api";

interface TaskDependenciesSectionProps {
  taskId: string;
}

export function TaskDependenciesSection({
  taskId,
}: TaskDependenciesSectionProps): React.ReactElement | null {
  const [loading, setLoading] = useState(true);
  const [prerequisites, setPrerequisites] = useState<DependencyRule[]>([]);
  const [dependents, setDependents] = useState<DependencyRule[]>([]);

  // Normalize UUID format by removing hyphens for comparison
  const normalizeId = (id: string): string => id.replace(/-/g, "");

  useEffect(() => {
    loadDependencies();
  }, [taskId]);

  const loadDependencies = async () => {
    setLoading(true);
    try {
      const response = await api.getDependencyRules({ task_id: taskId });
      // Separate into prerequisites (this task is downstream) and dependents (this task is upstream)
      // Normalize IDs for comparison since DB may have different format
      const normalizedTaskId = normalizeId(taskId);
      const prereqs = response.rules.filter(
        (r) => normalizeId(r.downstream_task_id) === normalizedTaskId,
      );
      const deps = response.rules.filter(
        (r) => normalizeId(r.upstream_task_id) === normalizedTaskId,
      );
      setPrerequisites(prereqs);
      setDependents(deps);
    } catch (error) {
      setPrerequisites([]);
      setDependents([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if no dependencies
  if (!loading && prerequisites.length === 0 && dependents.length === 0) {
    return null;
  }

  const getStrengthLabel = (strength: string): string => {
    return strength === "hard" ? "Required" : "Recommended";
  };

  const getStrengthColor = (strength: string): string => {
    return strength === "hard" ? "#DC2626" : "#D97706";
  };

  return (
    <View style={depStyles.container}>
      {loading && (
        <ActivityIndicator
          size="small"
          color="#3B82F6"
          style={depStyles.loader}
        />
      )}

      {!loading && prerequisites.length > 0 && (
        <View style={depStyles.section}>
          <Text style={depStyles.sectionTitle}>Prerequisites</Text>
          {prerequisites.map((rule) => (
            <View key={rule.id} style={depStyles.ruleItem}>
              <View style={depStyles.ruleInfo}>
                <Text style={depStyles.taskTitle}>
                  {rule.upstream_task?.title || "Unknown task"}
                </Text>
                {rule.required_occurrence_count > 1 && (
                  <Text style={depStyles.countBadge}>
                    ×{rule.required_occurrence_count}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  depStyles.strengthBadge,
                  { backgroundColor: getStrengthColor(rule.strength) },
                ]}
              >
                {getStrengthLabel(rule.strength)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!loading && dependents.length > 0 && (
        <View style={depStyles.section}>
          <Text style={depStyles.sectionTitle}>Unlocks</Text>
          {dependents.map((rule) => (
            <View key={rule.id} style={depStyles.ruleItem}>
              <View style={depStyles.ruleInfo}>
                <Text style={depStyles.taskTitle}>
                  {rule.downstream_task?.title || "Unknown task"}
                </Text>
              </View>
              <Text
                style={[
                  depStyles.strengthBadge,
                  { backgroundColor: getStrengthColor(rule.strength) },
                ]}
              >
                {getStrengthLabel(rule.strength)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const depStyles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  loader: {
    marginVertical: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  ruleInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskTitle: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "500",
  },
  countBadge: {
    backgroundColor: "#4B5563",
    color: "#D1D5DB",
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  strengthBadge: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
});
