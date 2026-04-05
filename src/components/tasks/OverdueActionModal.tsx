import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import type { Task } from "../../types";

interface OverdueActionModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSkip: (task: Task) => void;
  onReschedule: (task: Task) => void;
}

/**
 * Modal for handling overdue tasks with actions: Skip, Reschedule.
 */
export function OverdueActionModal({
  visible,
  task,
  onClose,
  onSkip,
  onReschedule,
}: OverdueActionModalProps): React.ReactElement {
  if (!task) {
    return <></>;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Overdue Task</Text>
          <Text style={modalStyles.taskTitle}>"{task.title}"</Text>

          {task.scheduled_at && (
            <Text style={modalStyles.dueInfo}>
              Was due: {new Date(task.scheduled_at).toLocaleString()}
            </Text>
          )}

          <Text style={modalStyles.prompt}>What would you like to do?</Text>

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={modalStyles.skipButton}
              onPress={() => {
                onSkip(task);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Skip task"
            >
              <Text style={modalStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.rescheduleButton}
              onPress={() => {
                onReschedule(task);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Reschedule task"
            >
              <Text style={modalStyles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={modalStyles.cancelButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={modalStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  dueInfo: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  prompt: {
    fontSize: 14,
    color: "#D1D5DB",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  rescheduleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
});

export default OverdueActionModal;
