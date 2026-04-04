import React from "react";
import PropTypes from "prop-types";
import { View, Text, ActivityIndicator } from "react-native";
import styles from "./assistantStyles";

/**
 * Displays a single chat message bubble.
 */
export default function ChatMessage({ message, isLoading = false }) {
  const isUser = message?.role === "user";

  if (isLoading) {
    return (
      <View style={[styles.messageRow, styles.assistantRow]}>
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <ActivityIndicator size="small" color="#D4AF37" />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? "You" : "Assistant"}: ${message.content}`}
    >
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string,
    content: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
};
