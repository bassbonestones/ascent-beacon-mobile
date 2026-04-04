import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";
import type {
  PriorityFormData,
  ValidationFeedback,
} from "../../hooks/usePriorityForm";

interface CreatePriorityStep1Props {
  formData: PriorityFormData;
  onNameChange: (text: string) => void;
  validating?: boolean;
  validationFeedback: ValidationFeedback;
  onCancel: () => void;
  onNext: () => void;
}

/**
 * Step 1: Priority Name Input
 * User enters a specific (not generic) priority name
 */
export default function CreatePriorityStep1({
  formData,
  onNameChange,
  validating = false,
  validationFeedback,
  onCancel,
  onNext,
}: CreatePriorityStep1Props): React.ReactElement {
  const isNextDisabled =
    !formData.title.trim() || validationFeedback.name.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 1 of 4</Text>
        <Text style={styles.title}>Priority Name</Text>
        <Text style={styles.subtitle}>Be specific, not generic</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.label}>What is this priority?</Text>
          <Text style={styles.helperText}>
            Be specific about WHAT (not why it matters yet):
          </Text>
          <Text style={styles.example}>
            ✓ Restoring physical health after burnout
          </Text>
          <Text style={styles.example}>
            ✓ Being emotionally present for my child
          </Text>
          <Text style={styles.example}>
            ✓ Quality time with family and close friends
          </Text>
          <Text style={styles.badExample}>✗ Health</Text>
          <Text style={styles.badExample}>✗ Family</Text>
          <Text style={styles.badExample}>✗ Work</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter priority name..."
            value={formData.title}
            onChangeText={onNameChange}
            multiline
            placeholderTextColor="#999"
            accessibilityLabel="Priority name input"
            accessibilityHint="Enter a specific name for your priority"
          />

          {validating && (
            <ActivityIndicator
              size="large"
              color="#B3D9F2"
              accessibilityLabel="Validating input"
            />
          )}

          {validationFeedback.name.length > 0 && (
            <View style={styles.feedbackBox}>
              {validationFeedback.name.map((msg, idx) => (
                <Text key={idx} style={styles.feedbackText}>
                  • {msg}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isNextDisabled && styles.nextButtonDisabled,
          ]}
          onPress={onNext}
          disabled={isNextDisabled}
          accessibilityLabel="Next step"
          accessibilityRole="button"
          accessibilityState={{ disabled: isNextDisabled }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
