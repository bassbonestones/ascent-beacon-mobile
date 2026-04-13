import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import {
  styles,
  SCOPES,
  SCORE_OPTIONS,
} from "../../screens/styles/prioritiesScreenStyles";

/**
 * Step 4: Scope & Details
 * User sets scope, importance, cadence, and constraints
 */
export default function CreatePriorityStep4({
  formData,
  onFormDataChange,
  onBack,
  onNext,
}) {
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);

  const blurActiveElement = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 4 of 4</Text>
        <Text style={styles.title}>Scope & Details</Text>
        <Text style={styles.subtitle}>
          Optional: Add context about this priority
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.label}>What kind of priority is this?</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowScopeModal(true)}
            accessibilityLabel={`Scope: ${SCOPES.find((s) => s.value === formData.scope)?.label}`}
            accessibilityRole="button"
          >
            <Text style={styles.pickerButtonText}>
              {SCOPES.find((s) => s.value === formData.scope)?.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Importance Score</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowScoreModal(true)}
            accessibilityLabel={`Importance: ${SCORE_OPTIONS.find((s) => s.value === formData.score)?.label}`}
            accessibilityRole="button"
          >
            <Text style={styles.pickerButtonText}>
              {SCORE_OPTIONS.find((s) => s.value === formData.score)?.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Cadence (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Weekly, 2-3 times per week"
            value={formData.cadence || ""}
            onChangeText={(text) =>
              onFormDataChange((prev) => ({ ...prev, cadence: text }))
            }
            placeholderTextColor="#999"
            accessibilityLabel="Cadence input"
            accessibilityHint="Enter how often you want to work on this priority"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Constraints (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2-3 hours per week, dependent on availability"
            value={formData.constraints || ""}
            onChangeText={(text) =>
              onFormDataChange((prev) => ({ ...prev, constraints: text }))
            }
            placeholderTextColor="#999"
            multiline
            accessibilityLabel="Constraints input"
            accessibilityHint="Enter any constraints or limitations"
          />
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
          style={styles.nextButton}
          onPress={onNext}
          accessibilityLabel="Review priority"
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>Review</Text>
        </TouchableOpacity>
      </View>

      {/* Scope Modal */}
      <Modal visible={showScopeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Scope</Text>
            {SCOPES.map((scope) => (
              <TouchableOpacity
                key={scope.value}
                style={styles.modalOption}
                onPress={() => {
                  onFormDataChange((prev) => ({ ...prev, scope: scope.value }));
                  blurActiveElement();
                  setShowScopeModal(false);
                }}
                accessibilityLabel={scope.label}
                accessibilityRole="button"
              >
                <Text style={styles.modalOptionText}>{scope.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                blurActiveElement();
                setShowScopeModal(false);
              }}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Score Modal */}
      <Modal visible={showScoreModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Importance</Text>
            {SCORE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  onFormDataChange((prev) => ({
                    ...prev,
                    score: option.value,
                  }));
                  blurActiveElement();
                  setShowScoreModal(false);
                }}
                accessibilityLabel={option.label}
                accessibilityRole="button"
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                blurActiveElement();
                setShowScoreModal(false);
              }}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

CreatePriorityStep4.propTypes = {
  formData: PropTypes.shape({
    scope: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    cadence: PropTypes.string,
    constraints: PropTypes.string,
  }).isRequired,
  onFormDataChange: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};
