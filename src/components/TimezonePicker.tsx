import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  TIMEZONES,
  getDeviceTimezone,
  getTimezoneLabel,
  type TimezoneOption,
} from "../utils/timezoneData";

interface TimezonePickerProps {
  /** Current selected timezone (null = device default) */
  selectedTimezone: string | null;
  /** Called when user selects a timezone */
  onSelect: (timezone: string | null) => void;
  /** Optional test ID */
  testID?: string;
}

/**
 * Timezone picker component.
 * Shows a list of common timezones with UTC offsets.
 * First option is "Device Default" which uses null.
 */
export function TimezonePicker({
  selectedTimezone,
  onSelect,
  testID,
}: TimezonePickerProps): React.ReactElement {
  const deviceTz = getDeviceTimezone();
  const deviceLabel = getTimezoneLabel(null);

  // Sort timezones by offset for display
  const sortedTimezones = [...TIMEZONES].sort((a, b) => a.offset - b.offset);

  const isSelected = (tz: TimezoneOption | null): boolean => {
    if (tz === null) {
      return selectedTimezone === null;
    }
    return selectedTimezone === tz.id;
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Timezone</Text>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        testID={`${testID}-scroll`}
      >
        {/* Device Default option */}
        <TouchableOpacity
          style={[styles.option, isSelected(null) && styles.optionSelected]}
          onPress={() => onSelect(null)}
          accessibilityRole="radio"
          accessibilityState={{ checked: isSelected(null) }}
          testID={`${testID}-device-default`}
        >
          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionLabel,
                isSelected(null) && styles.optionLabelSelected,
              ]}
            >
              Device Default
            </Text>
            <Text style={styles.optionSubtext}>{deviceTz}</Text>
          </View>
          {isSelected(null) && (
            <Ionicons
              name="checkmark"
              size={20}
              color="#9C27B0"
              testID={`${testID}-device-default-check`}
            />
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Timezone options */}
        {sortedTimezones.map((tz) => (
          <TouchableOpacity
            key={tz.id}
            style={[styles.option, isSelected(tz) && styles.optionSelected]}
            onPress={() => onSelect(tz.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected(tz) }}
            testID={`${testID}-${tz.id}`}
          >
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected(tz) && styles.optionLabelSelected,
                ]}
              >
                {tz.label}
              </Text>
              <Text style={styles.optionSubtext}>{tz.id}</Text>
            </View>
            {isSelected(tz) && (
              <Ionicons
                name="checkmark"
                size={20}
                color="#9C27B0"
                testID={`${testID}-${tz.id}-check`}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 300,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: "#F3E5F5",
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  optionLabelSelected: {
    color: "#9C27B0",
    fontWeight: "600",
  },
  optionSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },
});
