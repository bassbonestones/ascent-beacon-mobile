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
          style={{
            backgroundColor: "#E0E0E0",
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#333", fontSize: 16, fontWeight: "600" }}>
            Back to Dashboard
          </Text>
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
