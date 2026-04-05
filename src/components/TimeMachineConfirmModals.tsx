import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { styles } from "./styles/timeMachineModalStyles";

interface TravelConfirmModalProps {
  visible: boolean;
  isRevert: boolean;
  dateText: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TravelConfirmModal({
  visible,
  isRevert,
  dateText,
  onCancel,
  onConfirm,
}: TravelConfirmModalProps): React.ReactElement {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>
            {isRevert ? "⚠️ Revert Time?" : "🕐 Confirm Travel"}
          </Text>
          <Text style={styles.confirmText}>
            {isRevert
              ? `Travel to ${dateText}?\n\nThis will DELETE all task completions dated after this time.`
              : `Travel to ${dateText}?`}
          </Text>
          {isRevert && (
            <Text style={styles.confirmWarning}>
              This action cannot be undone.
            </Text>
          )}
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.confirmCancel} onPress={onCancel}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={isRevert ? styles.confirmDelete : styles.confirmTravel}
              onPress={onConfirm}
            >
              <Text style={styles.confirmDeleteText}>
                {isRevert ? "Revert" : "Travel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ReturnConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ReturnConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: ReturnConfirmModalProps): React.ReactElement {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>⚠️ Return to Present?</Text>
          <Text style={styles.confirmText}>
            This will delete all task completions dated after today and exit
            time travel mode.
          </Text>
          <Text style={styles.confirmWarning}>
            This action cannot be undone.
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.confirmCancel} onPress={onCancel}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmDelete} onPress={onConfirm}>
              <Text style={styles.confirmDeleteText}>Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
