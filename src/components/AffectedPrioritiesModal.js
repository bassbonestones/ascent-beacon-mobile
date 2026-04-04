import React from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";

export default function AffectedPrioritiesModal({
  visible,
  priorities,
  onReviewLinks,
  onContinue,
  onClose,
}) {
  if (!visible || !priorities || priorities.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Connected Priorities</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <Text style={styles.description}>
              This value is linked to {priorities.length} priority(ies). Would
              you like to verify these connections still make sense?
            </Text>

            {priorities.map((priority, index) => (
              <View
                key={priority.priority_id || index}
                style={styles.priorityCard}
              >
                <Text style={styles.priorityTitle}>{priority.title}</Text>
                {priority.is_anchored && (
                  <View style={styles.anchoredBadge}>
                    <Text style={styles.anchoredBadgeText}>🔗 ANCHORED</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onContinue}
            >
              <Text style={styles.buttonText}>They Still Fit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onReviewLinks}
            >
              <Text style={styles.buttonText}>Review Links</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    height: "80%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  priorityCard: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  priorityTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  anchoredBadge: {
    marginTop: 8,
  },
  anchoredBadgeText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});

AffectedPrioritiesModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  priorities: PropTypes.arrayOf(
    PropTypes.shape({
      priority_id: PropTypes.string,
      title: PropTypes.string.isRequired,
      is_anchored: PropTypes.bool,
    }),
  ),
  onReviewLinks: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

AffectedPrioritiesModal.defaultProps = {
  priorities: [],
};
