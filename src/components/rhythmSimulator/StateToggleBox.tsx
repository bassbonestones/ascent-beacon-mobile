import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  OccurrenceState,
  STATE_COLORS,
  STATE_LABELS,
} from "./rhythmSimulatorConstants";

interface StateToggleBoxProps {
  state: OccurrenceState;
  onToggle: () => void;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  testID?: string;
}

const SIZE_STYLES: Record<string, ViewStyle> = {
  small: { width: 20, height: 20, borderRadius: 4 },
  medium: { width: 28, height: 28, borderRadius: 6 },
  large: { width: 36, height: 36, borderRadius: 8 },
};

export function StateToggleBox({
  state,
  onToggle,
  size = "medium",
  disabled = false,
  testID,
}: StateToggleBoxProps): React.ReactElement {
  const iconSize = size === "small" ? 12 : 18;

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: state !== "none" }}
      accessibilityLabel={`Toggle state: ${STATE_LABELS[state]}`}
      style={[
        styles.toggleBox,
        SIZE_STYLES[size],
        { backgroundColor: STATE_COLORS[state] },
        disabled && styles.toggleBoxDisabled,
      ]}
    >
      {state === "completed" && (
        <Ionicons name="checkmark" size={iconSize} color="#fff" />
      )}
      {state === "skipped" && (
        <Ionicons name="remove" size={iconSize} color="#fff" />
      )}
      {state === "mixed" && (
        <Ionicons name="ellipsis-horizontal" size={iconSize} color="#fff" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBoxDisabled: {
    opacity: 0.5,
  },
});
