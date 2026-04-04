import React from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { styles } from "./styles/assistantScreenStyles";
import useAssistantChat, { ContextMode } from "../hooks/useAssistantChat";
import SymbolHeader from "../components/assistant/SymbolHeader";
import ValueCard from "../components/assistant/ValueCard";
import ProposedValueCard from "../components/assistant/ProposedValueCard";
import ChatMessage from "../components/assistant/ChatMessage";
import InputBar from "../components/assistant/InputBar";
import { getActiveRevision } from "../utils/valueMatching";
import type { RootStackParamList } from "../types";

interface AssistantScreenProps {
  route: RouteProp<RootStackParamList, "Assistant">;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export default function AssistantScreen({
  route,
  navigation,
}: AssistantScreenProps): React.ReactElement {
  const contextMode: ContextMode =
    (route.params?.contextMode as ContextMode) || "values";

  const {
    loading,
    sending,
    recording,
    messages,
    inputText,
    values,
    recommendations,
    valueInsights,
    highlightValueId,
    deleteConfirmId,
    setInputText,
    scrollViewRef,
    modelScrollRef,
    valuePositions,
    handleSendMessage,
    handleVoiceRecord,
    handleAcceptRecommendation,
    handleRejectRecommendation,
    handleKeepBoth,
    handleReviewInsight,
    startEditValue,
    confirmDeleteValue,
    cancelDeleteValue,
    performDeleteValue,
  } = useAssistantChat(contextMode);

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityLabel="Loading assistant"
      >
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SymbolHeader label="Values" onBack={() => navigation.goBack()} />

      {/* Zone 2: Living Model Zone (Middle) */}
      <ScrollView
        ref={modelScrollRef}
        style={styles.modelZone}
        contentContainerStyle={styles.modelContent}
        accessibilityLabel="Values list"
      >
        {values.length === 0 && recommendations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Your values will appear here as we explore them together.
            </Text>
          </View>
        )}

        {values.map((value) => {
          const activeRev = value.active_revision || getActiveRevision(value);
          return (
            <ValueCard
              key={value.id}
              value={value}
              activeRevision={activeRev}
              isHighlighted={value.id === highlightValueId}
              isDeleting={deleteConfirmId === value.id}
              insight={valueInsights[value.id]}
              onEdit={startEditValue}
              onDelete={confirmDeleteValue}
              onConfirmDelete={performDeleteValue}
              onCancelDelete={cancelDeleteValue}
              onReviewInsight={handleReviewInsight}
              onKeepBoth={handleKeepBoth}
              onLayout={(event) => {
                valuePositions.current[value.id] = event.nativeEvent.layout.y;
              }}
            />
          );
        })}

        {recommendations.map((rec) => (
          <ProposedValueCard
            key={rec.id}
            recommendation={rec}
            onAccept={handleAcceptRecommendation}
            onReject={handleRejectRecommendation}
          />
        ))}
      </ScrollView>

      {/* Zone 3: Input Zone (Bottom) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatZone}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          accessibilityLabel="Chat messages"
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {sending && <ChatMessage isLoading />}
        </ScrollView>

        <InputBar
          inputText={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          onVoiceRecord={handleVoiceRecord}
          isSending={sending}
          isRecording={recording}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
