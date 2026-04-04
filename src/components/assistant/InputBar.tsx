import React from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import styles from "./assistantStyles";

interface InputBarProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onVoiceRecord: () => void;
  isSending?: boolean;
  isRecording?: boolean;
}

/**
 * Input bar with voice recording and send buttons.
 */
export default function InputBar({
  inputText,
  onChangeText,
  onSend,
  onVoiceRecord,
  isSending = false,
  isRecording = false,
}: InputBarProps): React.JSX.Element {
  const canSend = inputText.trim() && !isSending;

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity
        style={styles.voiceButton}
        onPress={onVoiceRecord}
        disabled={isRecording || isSending}
        accessibilityRole="button"
        accessibilityLabel="Record voice message"
      >
        <Text style={styles.voiceButtonText}>🎤</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={onChangeText}
        placeholder="Type your response..."
        placeholderTextColor="#999"
        multiline
        maxLength={1000}
        editable={!isSending}
        accessibilityLabel="Message input"
        accessibilityHint="Type your response to the assistant"
      />

      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Text style={styles.sendButtonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
}
