import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";

interface SkipReasonModalProps {
  visible: boolean;
  taskTitle: string;
  onClose: () => void;
  onSkip: (reason?: string) => void;
}

export function SkipReasonModal({
  visible,
  taskTitle,
  onClose,
  onSkip,
}: SkipReasonModalProps): React.ReactElement {
  const [reason, setReason] = useState("");

  const handleSkip = () => {
    onSkip(reason.trim() || undefined);
    setReason("");
  };

  const handleSkipWithoutReason = () => {
    onSkip(undefined);
    setReason("");
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Skip "{taskTitle}"?</Text>

          <Text style={modalStyles.label}>Reason (optional)</Text>
          <TextInput
            style={modalStyles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Why are you skipping? (optional)"
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={3}
            accessibilityLabel="Skip reason"
          />

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={modalStyles.skipButton}
              onPress={handleSkipWithoutReason}
              accessibilityRole="button"
              accessibilityLabel="Skip without reason"
            >
              <Text style={modalStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.skipReasonButton}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip with reason"
            >
              <Text style={modalStyles.skipReasonButtonText}>
                Skip + Log Reason
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={modalStyles.cancelButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel skip"
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
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#374151",
    color: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  skipReasonButton: {
    flex: 1,
    backgroundColor: "#6B7280",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  skipReasonButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
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

export default SkipReasonModal;
