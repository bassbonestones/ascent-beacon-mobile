import React from "react";
import { View, Text } from "react-native";
import { styles } from "./styles/timeMachineModalStyles";

interface TimeMachineStatusProps {
  isTimeTravelActive: boolean;
  travelDateText: string;
  pendingDateText: string | null;
  showRevertWarning: boolean;
}

export function TimeMachineStatus({
  isTimeTravelActive,
  travelDateText,
  pendingDateText,
  showRevertWarning,
}: TimeMachineStatusProps): React.ReactElement {
  return (
    <>
      {/* Current Status */}
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>
          {isTimeTravelActive ? "Currently viewing:" : "Current time:"}
        </Text>
        <Text style={styles.statusValue}>{travelDateText}</Text>
        {isTimeTravelActive && (
          <Text style={styles.statusWarning}>⚠️ Time travel active</Text>
        )}
      </View>

      {/* Pending Selection */}
      {pendingDateText && (
        <View style={[styles.statusBox, styles.pendingBox]}>
          <Text style={styles.statusLabel}>Selected:</Text>
          <Text style={styles.statusValue}>{pendingDateText}</Text>
          {showRevertWarning && (
            <Text style={styles.statusWarning}>
              ⚠️ Data after this date will be deleted
            </Text>
          )}
        </View>
      )}
    </>
  );
}
