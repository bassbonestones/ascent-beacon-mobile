import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";
import type { Priority, Value } from "../../types";

interface PriorityDetailViewProps {
  priority: Priority;
  values: Value[];
  linkedValueIds: string[];
  onStashToggle: () => void;
  onBack: () => void;
  onEdit: () => void;
}

/**
 * Priority Detail View: Shows full details of a single priority
 */
export default function PriorityDetailView({
  priority,
  values,
  linkedValueIds,
  onStashToggle,
  onBack,
  onEdit,
}: PriorityDetailViewProps): React.ReactElement | null {
  const activeRev = priority?.active_revision;
  if (!activeRev) return null;

  const isAnchored = Boolean(activeRev?.is_anchored);
  const isStashed = Boolean(priority?.is_stashed);
  const scoreValue =
    typeof activeRev?.score === "number" || typeof activeRev?.score === "string"
      ? activeRev.score
      : 3;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Priority Details</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Priority Name</Text>
          <Text style={styles.detailValue}>{activeRev.title}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Why This Matters</Text>
          <Text style={styles.detailValue}>
            {activeRev.why_matters?.trim()
              ? activeRev.why_matters.trim()
              : "No description provided"}
          </Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Scope</Text>
          <Text style={styles.detailValue}>{activeRev.scope}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Importance</Text>
          <Text style={styles.detailValue}>{scoreValue}/5</Text>
        </View>

        {activeRev.cadence && activeRev.cadence !== "null" ? (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Cadence</Text>
            <Text style={styles.detailValue}>{activeRev.cadence}</Text>
          </View>
        ) : null}

        {activeRev.constraints && activeRev.constraints !== "null" ? (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Constraints</Text>
            <Text style={styles.detailValue}>{activeRev.constraints}</Text>
          </View>
        ) : null}

        {linkedValueIds.length > 0 ? (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Linked Values</Text>
            <View style={styles.linkedValuesContainer}>
              {linkedValueIds.map((valueId) => {
                const value = values.find((v) => v.id === valueId);
                const activeValueRev = value?.revisions?.[0];
                return (
                  <View key={valueId} style={styles.linkedValueTag}>
                    <Text style={styles.linkedValueText}>
                      {activeValueRev?.statement || "Unknown Value"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {isAnchored ? (
          <View style={styles.detailSection}>
            <Text style={styles.anchoredBadge}>
              🔒 This priority is anchored
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            { backgroundColor: isStashed ? "#4CAF50" : "#F44336" },
          ]}
          onPress={onStashToggle}
          accessibilityLabel={isStashed ? "Unstash priority" : "Stash priority"}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>
            {isStashed ? "Unstash" : "Stash"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onEdit}
          accessibilityLabel="Edit priority"
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>Edit Priority</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
