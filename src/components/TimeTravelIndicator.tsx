import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTime } from "../context/TimeContext";

interface TimeTravelIndicatorProps {
  onPress?: () => void;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function TimeTravelIndicator({
  onPress,
}: TimeTravelIndicatorProps): React.ReactElement | null {
  const { isTimeTravelActive, travelDate } = useTime();

  if (!isTimeTravelActive || !travelDate) {
    return null;
  }

  const formatDate = (date: Date): string => {
    const m = date.getMonth();
    const d = date.getDate();
    const y = date.getFullYear();
    const h = date.getHours();
    const min = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${MONTHS[m]} ${d}, ${y} at ${h12}:${min.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityLabel={`Time travel active: ${formatDate(travelDate)}. Tap to change.`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⏰</Text>
        <Text style={styles.text}>Viewing: {formatDate(travelDate)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#9C27B0",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
