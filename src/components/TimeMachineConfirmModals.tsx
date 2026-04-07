import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { styles } from "./styles/timeMachineModalStyles";

interface TravelConfirmModalProps {
  visible: boolean;
  isRevert: boolean;
  dateText: string;
  completionsCount: number;
  onCancel: () => void;
  onConfirm: (deleteCompletions: boolean) => void;
}

export function TravelConfirmModal({
  visible,
  isRevert,
  dateText,
  completionsCount,
  onCancel,
  onConfirm,
}: TravelConfirmModalProps): React.ReactElement {
  // If not reverting, or no completions affected, simple confirm
  const showCompletionsChoice = isRevert && completionsCount > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>
            {isRevert ? "⚠️ Revert Time?" : "🕐 Confirm Travel"}
          </Text>
          <Text style={styles.confirmText}>
            {showCompletionsChoice
              ? `Travel to ${dateText}?\n\nYou have ${completionsCount} completion${completionsCount === 1 ? "" : "s"} after this date.`
              : isRevert
                ? `Travel to ${dateText}?`
                : `Travel to ${dateText}?`}
          </Text>

          {showCompletionsChoice ? (
            <>
              <Text style={styles.confirmWarning}>
                What would you like to do with these completions?
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmCancel}
                  onPress={onCancel}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmKeep}
                  onPress={() => onConfirm(false)}
                >
                  <Text style={styles.confirmKeepText}>Keep Completions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDelete}
                  onPress={() => onConfirm(true)}
                >
                  <Text style={styles.confirmDeleteText}>
                    Remove Completions
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={onCancel}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmTravel}
                onPress={() => onConfirm(false)}
              >
                <Text style={styles.confirmDeleteText}>Travel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface ReturnConfirmModalProps {
  visible: boolean;
  completionsCount: number;
  onCancel: () => void;
  onConfirm: (deleteCompletions: boolean) => void;
}

export function ReturnConfirmModal({
  visible,
  completionsCount,
  onCancel,
  onConfirm,
}: ReturnConfirmModalProps): React.ReactElement {
  const hasCompletions = completionsCount > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>
            {hasCompletions ? "⚠️ Return to Present?" : "🕐 Return to Present?"}
          </Text>
          <Text style={styles.confirmText}>
            {hasCompletions
              ? `You have ${completionsCount} completion${completionsCount === 1 ? "" : "s"} dated after today.\n\nWhat would you like to do with these completions?`
              : "Exit time travel mode and return to the present."}
          </Text>

          {hasCompletions ? (
            <>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmCancel}
                  onPress={onCancel}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmKeep}
                  onPress={() => onConfirm(false)}
                >
                  <Text style={styles.confirmKeepText}>Keep Completions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDelete}
                  onPress={() => onConfirm(true)}
                >
                  <Text style={styles.confirmDeleteText}>
                    Remove Completions
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={onCancel}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmTravel}
                onPress={() => onConfirm(false)}
              >
                <Text style={styles.confirmDeleteText}>Return</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
