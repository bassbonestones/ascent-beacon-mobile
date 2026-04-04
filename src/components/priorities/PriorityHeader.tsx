import React from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";

interface PriorityHeaderProps {
  title?: string;
  subtitle?: string;
  stepNumber?: string;
}

/**
 * Header component for Priorities screen with icon and title.
 */
export default function PriorityHeader({
  title = "Priorities",
  subtitle = "Anchor what's important",
  stepNumber = undefined,
}: PriorityHeaderProps): React.ReactElement {
  return (
    <View style={styles.header}>
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
