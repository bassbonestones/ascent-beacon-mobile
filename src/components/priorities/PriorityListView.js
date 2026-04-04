import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";
import PriorityCard from "./PriorityCard";
import PriorityHeader from "./PriorityHeader";

/**
 * Priority List View: Shows all active and stashed priorities
 */
export default function PriorityListView({
  priorities,
  stashedPriorities,
  showStash,
  onToggleStash,
  onPriorityPress,
  onCreatePress,
  onBackPress,
}) {
  return (
    <View style={styles.container}>
      <PriorityHeader />

      <ScrollView style={styles.content}>
        {priorities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No priorities yet</Text>
            <Text style={styles.emptySubText}>
              Create your first priority to get started
            </Text>
          </View>
        ) : (
          <View style={styles.prioritiesList}>
            {priorities
              .filter((priority) => priority.active_revision)
              .map((priority) => (
                <PriorityCard
                  key={priority.id}
                  priority={priority}
                  onPress={() => onPriorityPress(priority)}
                />
              ))}
          </View>
        )}

        {/* Expandable Stash Section */}
        <TouchableOpacity
          style={{ marginTop: 24, alignItems: "center" }}
          onPress={onToggleStash}
          accessibilityLabel={
            showStash
              ? "Hide stashed priorities"
              : `Show ${stashedPriorities.length} stashed priorities`
          }
          accessibilityRole="button"
        >
          <Text style={{ color: "#2196F3", fontWeight: "600", fontSize: 16 }}>
            {showStash
              ? "▼ Hide Stash"
              : `▲ Show Stash (${stashedPriorities.length})`}
          </Text>
        </TouchableOpacity>

        {showStash && stashedPriorities.length > 0 && (
          <View
            style={[
              styles.prioritiesList,
              {
                marginTop: 12,
                borderTopWidth: 1,
                borderTopColor: "#E0E0E0",
                paddingTop: 12,
              },
            ]}
          >
            {stashedPriorities.map((priority) => (
              <PriorityCard
                key={priority.id}
                priority={priority}
                onPress={() => onPriorityPress(priority)}
                isStashed
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
          accessibilityLabel="Back to Dashboard"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onCreatePress}
          accessibilityLabel="Create new priority"
          accessibilityRole="button"
        >
          <Text style={styles.continueButtonText}>+ Create Priority</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

PriorityListView.propTypes = {
  priorities: PropTypes.array.isRequired,
  stashedPriorities: PropTypes.array.isRequired,
  showStash: PropTypes.bool,
  onToggleStash: PropTypes.func.isRequired,
  onPriorityPress: PropTypes.func.isRequired,
  onCreatePress: PropTypes.func.isRequired,
  onBackPress: PropTypes.func.isRequired,
};
