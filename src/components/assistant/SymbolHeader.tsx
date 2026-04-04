import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import styles from "./assistantStyles";

interface SymbolHeaderProps {
  label: string;
  onBack: () => void;
}

/**
 * Header zone with back button, symbol icon, and label.
 */
export default function SymbolHeader({
  label,
  onBack,
}: SymbolHeaderProps): React.JSX.Element {
  return (
    <View style={styles.symbolZone}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Image
        source={require("../../../assets/NorthStarIcon_values.png")}
        style={styles.symbolImage}
        resizeMode="contain"
        accessibilityLabel={`${label} icon`}
      />
      <Text style={styles.symbolLabel}>{label}</Text>
    </View>
  );
}
