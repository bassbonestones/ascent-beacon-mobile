/**
 * OptionModal - A reusable modal for presenting multiple options to the user.
 *
 * Works on both web and native platforms using React Native's Modal component.
 * Provides a consistent UX for confirmation dialogs with custom buttons.
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";

export interface OptionModalButton {
  /** Button label */
  label: string;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Button style variant */
  style?: "default" | "cancel" | "destructive" | "primary";
}

export interface OptionModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Modal title */
  title: string;
  /** Modal message/description */
  message?: string;
  /** Array of buttons to display */
  buttons: OptionModalButton[];
  /** Callback when modal is dismissed (backdrop press) */
  onDismiss?: () => void;
}

/**
 * A cross-platform modal component for presenting options to users.
 *
 * @example
 * <OptionModal
 *   visible={showModal}
 *   title="Save Permanent Preferences"
 *   message="How would you like to save?"
 *   buttons={[
 *     { label: "Cancel", onPress: () => setShowModal(false), style: "cancel" },
 *     { label: "Save Only", onPress: handleSaveOnly, style: "primary" },
 *     { label: "Override All", onPress: handleOverrideAll, style: "destructive" },
 *   ]}
 *   onDismiss={() => setShowModal(false)}
 * />
 */
export function OptionModal({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}: OptionModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.overlay}
        onPress={onDismiss}
        testID="option-modal-overlay"
      >
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, getButtonStyle(button.style)]}
                onPress={button.onPress}
                testID={`option-modal-button-${index}`}
              >
                <Text
                  style={[styles.buttonText, getButtonTextStyle(button.style)]}
                >
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function getButtonStyle(
  style?: "default" | "cancel" | "destructive" | "primary",
) {
  switch (style) {
    case "cancel":
      return styles.cancelButton;
    case "destructive":
      return styles.destructiveButton;
    case "primary":
      return styles.primaryButton;
    default:
      return styles.defaultButton;
  }
}

function getButtonTextStyle(
  style?: "default" | "cancel" | "destructive" | "primary",
) {
  switch (style) {
    case "cancel":
      return styles.cancelButtonText;
    case "destructive":
      return styles.destructiveButtonText;
    case "primary":
      return styles.primaryButtonText;
    default:
      return styles.defaultButtonText;
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  defaultButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  destructiveButton: {
    backgroundColor: "#ff3b30",
  },
  primaryButton: {
    backgroundColor: "#5856D6",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  defaultButtonText: {
    color: "#333",
  },
  cancelButtonText: {
    color: "#666",
  },
  destructiveButtonText: {
    color: "#fff",
  },
  primaryButtonText: {
    color: "#fff",
  },
});

export default OptionModal;
