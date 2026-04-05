import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TimePickerProps {
  hour: number;
  minute: number;
  onTimeChange: (hour: number, minute: number) => void;
}

export function TimePicker({
  hour,
  minute,
  onTimeChange,
}: TimePickerProps): React.ReactElement {
  const handleHourChange = useCallback(
    (delta: number) => {
      let newHour = hour + delta;
      if (newHour >= 24) newHour -= 24;
      if (newHour < 0) newHour += 24;
      onTimeChange(newHour, minute);
    },
    [hour, minute, onTimeChange],
  );

  const handleMinuteChange = useCallback(
    (delta: number) => {
      let newMinute = minute + delta;
      let newHour = hour;

      if (newMinute >= 60) {
        newMinute -= 60;
        newHour = (newHour + 1) % 24;
      } else if (newMinute < 0) {
        newMinute += 60;
        newHour = newHour - 1 < 0 ? 23 : newHour - 1;
      }

      onTimeChange(newHour, newMinute);
    },
    [hour, minute, onTimeChange],
  );

  const handleAmPmToggle = useCallback(() => {
    const newHour = hour >= 12 ? hour - 12 : hour + 12;
    onTimeChange(newHour, minute);
  }, [hour, minute, onTimeChange]);

  const handleQuickTime = useCallback(
    (h: number, m: number) => {
      onTimeChange(h, m);
    },
    [onTimeChange],
  );

  const displayHour = hour % 12 || 12;
  const isPM = hour >= 12;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Set time</Text>

      <View style={styles.pickerRow}>
        {/* Hour */}
        <View style={styles.unit}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleHourChange(1)}
            accessibilityLabel="Increase hour"
          >
            <Ionicons name="chevron-up" size={24} color="#9C27B0" />
          </TouchableOpacity>
          <Text style={styles.value}>
            {displayHour.toString().padStart(2, "0")}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleHourChange(-1)}
            accessibilityLabel="Decrease hour"
          >
            <Ionicons name="chevron-down" size={24} color="#9C27B0" />
          </TouchableOpacity>
        </View>

        <Text style={styles.colon}>:</Text>

        {/* Minute */}
        <View style={styles.unit}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleMinuteChange(15)}
            accessibilityLabel="Increase minutes"
          >
            <Ionicons name="chevron-up" size={24} color="#9C27B0" />
          </TouchableOpacity>
          <Text style={styles.value}>{minute.toString().padStart(2, "0")}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleMinuteChange(-15)}
            accessibilityLabel="Decrease minutes"
          >
            <Ionicons name="chevron-down" size={24} color="#9C27B0" />
          </TouchableOpacity>
        </View>

        {/* AM/PM */}
        <TouchableOpacity
          style={styles.ampmButton}
          onPress={handleAmPmToggle}
          accessibilityLabel="Toggle AM/PM"
        >
          <Text style={styles.ampmText}>{isPM ? "PM" : "AM"}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Time Presets */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => handleQuickTime(6, 0)}
        >
          <Text style={styles.quickText}>6 AM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => handleQuickTime(12, 0)}
        >
          <Text style={styles.quickText}>12 PM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => handleQuickTime(18, 0)}
        >
          <Text style={styles.quickText}>6 PM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => handleQuickTime(21, 0)}
        >
          <Text style={styles.quickText}>9 PM</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  unit: {
    alignItems: "center",
  },
  button: {
    padding: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333",
    minWidth: 50,
    textAlign: "center",
  },
  colon: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333",
    paddingHorizontal: 4,
  },
  ampmButton: {
    backgroundColor: "#9C27B0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 16,
  },
  ampmText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#F3E5F5",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  quickText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9C27B0",
  },
});
