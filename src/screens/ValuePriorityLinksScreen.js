import React from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from "react-native";
import useValuePriorityLinks from "../hooks/useValuePriorityLinks";
import { styles } from "./styles/valuePriorityLinksStyles";

export default function ValuePriorityLinksScreen({ route, navigation }) {
  const { valueId, valueStatement } = route.params;
  const vpl = useValuePriorityLinks(valueId, navigation);

  if (vpl.loading) {
    return (
      <View style={styles.loadingContainer} accessibilityLabel="Loading priorities">
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Review Links</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}
          accessibilityRole="button" accessibilityLabel="Cancel and go back">
          <Text style={styles.closeButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Value Info */}
      <View style={styles.valueInfo}>
        <Text style={styles.valueLabel}>Edited Value:</Text>
        <Text style={styles.valueStatement}>{valueStatement}</Text>
      </View>

      {/* Priorities List */}
      <ScrollView style={styles.content} accessibilityLabel="Priorities list">
        <Text style={styles.sectionTitle}>Select priorities linked to this value:</Text>
        {vpl.priorities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No priorities yet</Text>
            <Text style={styles.emptySubText}>Create priorities first to link them to values</Text>
          </View>
        ) : (
          vpl.priorities.filter((p) => p.active_revision).map((priority) => {
            const activeRev = priority.active_revision;
            const isLinked = vpl.linkedPriorityIds.has(priority.id);
            const isChanged = vpl.changedPriorityIds.has(priority.id);
            return (
              <View key={priority.id}
                style={[styles.priorityCard, isChanged && styles.priorityCardChanged]}
                accessibilityLabel={`Priority: ${activeRev.title}, ${isLinked ? "linked" : "not linked"}`}>
                <View style={styles.priorityInfo}>
                  <View style={styles.priorityHeader}>
                    <Text style={styles.priorityTitle}>{activeRev.title}</Text>
                    {activeRev.is_anchored && <Text style={styles.anchoredBadge}>🔒 Anchored</Text>}
                  </View>
                  <Text style={styles.priorityDescription} numberOfLines={2}>{activeRev.why_matters}</Text>
                </View>
                <Switch
                  value={isLinked}
                  onValueChange={() => vpl.togglePriorityLink(priority.id)}
                  trackColor={{ false: "#767577", true: "#81C784" }}
                  thumbColor={isLinked ? "#4CAF50" : "#f4f3f4"}
                  accessibilityLabel={`Toggle link for ${activeRev.title}`}
                />
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, vpl.saving && styles.saveButtonDisabled]}
          onPress={vpl.handleSave}
          disabled={vpl.saving}
          accessibilityRole="button"
          accessibilityLabel={vpl.changedPriorityIds.size > 0 ? "Save changes" : "Done"}>
          {vpl.saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.saveButtonText}>
              {vpl.changedPriorityIds.size > 0 ? "Save Changes" : "Done"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
