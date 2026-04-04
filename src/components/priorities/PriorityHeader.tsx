import React from "react";
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";

interface PriorityHeaderProps {
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  onBackPress?: () => void;
}

/**
 * Header component for Priorities screen with icon and title.
 */
export default function PriorityHeader({
  title = "Priorities",
  subtitle = "Anchor what's important",
  stepNumber = undefined,
  onBackPress,
}: PriorityHeaderProps): React.ReactElement {
  return (
    <View style={styles.header}>
      {onBackPress && (
        <TouchableOpacity
          onPress={onBackPress}
          accessibilityLabel="Back to Dashboard"
          accessibilityRole="button"
          style={{ marginBottom: 8 }}
        >
          <Text style={{ fontSize: 16, color: "#2196F3" }}>← Dashboard</Text>
        </TouchableOpacity>
      )}
      {stepNumber ? (
        <>
          <Text style={styles.stepNumber}>{stepNumber}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </>
      ) : (
        <View style={styles.headerMainRow}>
          <View style={styles.headerIconContainer}>
            <Image
              source={
                require("../../../assets/AnchorIcon_Priorities.png") as ImageSourcePropType
              }
              style={styles.headerMainIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
