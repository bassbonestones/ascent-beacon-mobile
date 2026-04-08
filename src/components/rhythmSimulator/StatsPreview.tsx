import React from "react";
import { View, Text } from "react-native";

import { STATE_COLORS } from "./rhythmSimulatorConstants";
import { styles } from "./rhythmSimulatorStyles";

interface StatsPreviewProps {
  completed: number;
  skipped: number;
  total: number;
  rate: number;
}

export function StatsPreview({
  completed,
  skipped,
  rate,
}: StatsPreviewProps): React.ReactElement {
  return (
    <View style={styles.statsSection}>
      <Text style={styles.sectionLabel}>Preview</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATE_COLORS.completed }]}>
            {completed}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: STATE_COLORS.skipped }]}>
            {skipped}
          </Text>
          <Text style={styles.statLabel}>Skipped</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{rate}%</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>
      <Text style={styles.alignmentNote}>
        💡 Alignment interpretation coming in Phase 5
      </Text>
    </View>
  );
}
