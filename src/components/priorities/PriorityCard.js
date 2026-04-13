import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";

/**
 * A single priority card item for display in lists.
 */
export default function PriorityCard({ priority, onPress, isStashed = false }) {
  const activeRev = priority.active_revision;
  if (!activeRev) return null;

  const isAnchored = Boolean(activeRev?.is_anchored);
  const scoreValue =
    typeof activeRev?.score === "number" || typeof activeRev?.score === "string"
      ? activeRev.score
      : 3;

  const cardStyle = [
    styles.priorityCard,
    isAnchored && !isStashed ? styles.priorityCardAnchored : null,
    isStashed ? { opacity: 0.6 } : null,
  ];

  return (
    <TouchableOpacity style={cardStyle} onPress={onPress}>
      <View style={styles.priorityCardContent}>
        <View style={styles.priorityHeader}>
          <Text style={styles.priorityTitle}>
            {activeRev.title || "Untitled"}
          </Text>
          {isStashed ? (
            <Text
              style={[
                styles.anchoredBadge,
                { backgroundColor: "#EEE", color: "#888" },
              ]}
            >
              Stashed
            </Text>
          ) : isAnchored ? (
            <Text style={styles.anchoredBadge}>🔒 Anchored</Text>
          ) : null}
        </View>
        <Text style={styles.priorityWhy}>
          {activeRev.why_matters?.trim()
            ? activeRev.why_matters.trim()
            : "No description provided"}
        </Text>
        {!isStashed && (
          <View style={styles.priorityMeta}>
            <Text style={styles.priorityScope}>
              {activeRev.scope || "ongoing"}
            </Text>
            <Text style={styles.priorityScore}>Importance: {scoreValue}/5</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

PriorityCard.propTypes = {
  priority: PropTypes.shape({
    id: PropTypes.string.isRequired,
    active_revision: PropTypes.shape({
      title: PropTypes.string,
      why_matters: PropTypes.string,
      scope: PropTypes.string,
      score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      is_anchored: PropTypes.bool,
      value_links: PropTypes.array,
    }),
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  isStashed: PropTypes.bool,
};
