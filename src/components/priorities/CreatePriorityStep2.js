import React from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";

/**
 * Step 2: Why This Matters
 * User explains the meaning behind the priority
 */
export default function CreatePriorityStep2({
  formData,
  onWhyChange,
  validating,
  validationFeedback,
  validationRules,
  ruleExamples,
  onShowExamples,
  onBack,
  onNext,
}) {
  const isNextDisabled =
    !formData.why_matters.trim() || validationFeedback.why.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 2 of 4</Text>
        <Text style={styles.title}>Why This Matters</Text>
        <Text style={styles.subtitle}>Explain the meaning, not obligation</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.label}>
            Why does this deserve to be protected?
          </Text>

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Your answer should be:</Text>
            <View
              style={[
                styles.ruleItem,
                validationRules.personal && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.personal ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Personal - about you, not abstract ideas
              </Text>
            </View>
            <View
              style={[
                styles.ruleItem,
                validationRules.meaning_based && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.meaning_based ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Meaning-based - not obligation or guilt
              </Text>
            </View>
            <View
              style={[
                styles.ruleItem,
                validationRules.implies_protection && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.implies_protection ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Implies protection - why it needs protecting
              </Text>
            </View>
            <View
              style={[
                styles.ruleItem,
                validationRules.concrete && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.concrete ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Concrete - guides your decisions
              </Text>
            </View>
          </View>

          <TextInput
            style={[styles.input, styles.largeInput]}
            placeholder="Because I..."
            value={formData.why_matters}
            onChangeText={onWhyChange}
            multiline
            placeholderTextColor="#999"
            accessibilityLabel="Why this matters input"
            accessibilityHint="Explain why this priority is meaningful to you"
          />

          {validating && (
            <ActivityIndicator
              size="large"
              color="#B3D9F2"
              accessibilityLabel="Validating input"
            />
          )}

          {validationFeedback.why.length > 0 && (
            <View style={styles.feedbackBox}>
              {validationFeedback.why.map((msg, idx) => (
                <Text key={idx} style={styles.feedbackText}>
                  • {msg}
                </Text>
              ))}
              {Object.keys(ruleExamples || {}).length > 0 && (
                <TouchableOpacity
                  style={styles.examplesButton}
                  onPress={onShowExamples}
                  accessibilityLabel="See examples"
                  accessibilityRole="button"
                >
                  <Text style={styles.examplesButtonText}>💡 See examples</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>Back</Text>
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

CreatePriorityStep2.propTypes = {
  formData: PropTypes.shape({
    why_matters: PropTypes.string.isRequired,
  }).isRequired,
  onWhyChange: PropTypes.func.isRequired,
  validating: PropTypes.bool,
  validationFeedback: PropTypes.shape({
    why: PropTypes.array.isRequired,
  }).isRequired,
  validationRules: PropTypes.object.isRequired,
  ruleExamples: PropTypes.object,
  onShowExamples: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};
