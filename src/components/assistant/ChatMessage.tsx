import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import styles from "./assistantStyles";

interface Message {
  role?: "user" | "assistant";
  content?: string;
}

interface ChatMessageProps {
  message?: Message;
  isLoading?: boolean;
}

/**
 * Displays a single chat message bubble.
 */
export default function ChatMessage({
  message,
  isLoading = false,
}: ChatMessageProps): React.JSX.Element {
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
      accessibilityLabel={`${isUser ? "You" : "Assistant"}: ${message?.content || ""}`}
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
          {message?.content}
        </Text>
      </View>
    </View>
  );
}
