import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { STATE_COLORS } from "./rhythmSimulatorConstants";
import { styles } from "./rhythmSimulatorStyles";

export function SimulatorLegend(): React.ReactElement {
  return (
    <View style={styles.legend}>
      <Text style={styles.legendTitle}>State Legend (tap to cycle):</Text>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendBox, { backgroundColor: STATE_COLORS.none }]}
          />
          <Text style={styles.legendText}>None</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendBox,
              { backgroundColor: STATE_COLORS.completed },
            ]}
          >
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendBox,
              { backgroundColor: STATE_COLORS.skipped },
            ]}
          >
            <Ionicons name="remove" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Skipped</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendBox, { backgroundColor: STATE_COLORS.mixed }]}
          >
            <Ionicons name="ellipsis-horizontal" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Mixed</Text>
        </View>
      </View>
    </View>
  );
}
