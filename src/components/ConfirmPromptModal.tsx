import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { transparentModalProps } from "./tasks/transparentModalProps";

export interface ConfirmPromptModalProps {
  visible: boolean;
  /** Main message body (can be multiple sentences). */
  prompt: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  /** Optional short heading above the prompt. */
  title?: string;
  /** Use red styling for the confirm action (e.g. permanent delete). */
  confirmDestructive?: boolean;
}

const DEFAULT_CONFIRM = "Confirm";
const DEFAULT_CANCEL = "Cancel";

export function ConfirmPromptModal({
  visible,
  prompt,
  onConfirm,
  onCancel,
  confirmButtonText = DEFAULT_CONFIRM,
  cancelButtonText = DEFAULT_CANCEL,
  title,
  confirmDestructive = false,
}: ConfirmPromptModalProps): React.ReactElement {
  const handleBackdrop = (): void => {
    onCancel?.();
  };

  const handleConfirm = (): void => {
    void onConfirm();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleBackdrop}
      {...transparentModalProps()}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleBackdrop}
          accessibilityLabel="Dismiss dialog"
          accessibilityRole="button"
        />
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView
            style={styles.promptScroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.prompt}>{prompt}</Text>
          </ScrollView>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                confirmDestructive
                  ? styles.confirmDestructive
                  : styles.confirmDefault,
              ]}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmButtonText}
            >
              <Text style={styles.confirmBtnText}>{confirmButtonText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleBackdrop}
              accessibilityRole="button"
              accessibilityLabel={cancelButtonText}
            >
              <Text style={styles.cancelBtnText}>{cancelButtonText}</Text>
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    zIndex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    maxHeight: "88%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  promptScroll: {
    maxHeight: 360,
  },
  prompt: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },
  buttonRow: {
    marginTop: 18,
    gap: 10,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmDefault: {
    backgroundColor: "#2563EB",
  },
  confirmDestructive: {
    backgroundColor: "#DC2626",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 15,
  },
});
