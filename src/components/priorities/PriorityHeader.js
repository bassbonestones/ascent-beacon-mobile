import React from "react";
import PropTypes from "prop-types";
import { View, Text, Image } from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";

/**
 * Header component for Priorities screen with icon and title.
 */
export default function PriorityHeader({
  title = "Priorities",
  subtitle = "Anchor what's important",
  stepNumber = null,
}) {
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
              source={require("../../../assets/AnchorIcon_Priorities.png")}
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

PriorityHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  stepNumber: PropTypes.string,
};
