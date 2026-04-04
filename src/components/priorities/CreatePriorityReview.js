import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { styles, SCOPES } from "../../screens/styles/prioritiesScreenStyles";

/**
 * Review Step: Show summary before creating/updating
 */
export default function CreatePriorityReview({
  formData,
  values,
  selectedValues,
  isEditMode,
  loading,
  onBack,
  onSubmit,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Review</Text>
        <Text style={styles.title}>Confirm Priority</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Name</Text>
          {formData.title?.trim() ? (
            <Text style={styles.reviewValue}>{formData.title}</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Why This Matters</Text>
          {formData.why_matters?.trim() ? (
            <Text style={styles.reviewValue}>{formData.why_matters}</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Scope</Text>
          {SCOPES.find((s) => s.value === formData.scope)?.label ? (
            <Text style={styles.reviewValue}>
              {SCOPES.find((s) => s.value === formData.scope).label}
            </Text>
          ) : formData.scope ? (
            <Text style={styles.reviewValue}>{String(formData.scope)}</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Importance</Text>
          {formData.score ? (
            <Text style={styles.reviewValue}>{formData.score}/5</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        {formData.cadence ? (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Cadence</Text>
            <Text style={styles.reviewValue}>{formData.cadence}</Text>
          </View>
        ) : null}

        {formData.constraints ? (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Constraints</Text>
            <Text style={styles.reviewValue}>{formData.constraints}</Text>
          </View>
        ) : null}

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Linked Values</Text>
          <View style={styles.valuesList}>
            {selectedValues.size > 0 ? (
              values
                .filter((v) => selectedValues.has(v.id))
                .filter((v) => v?.revisions?.[0]?.statement?.trim())
                .map((value) => (
                  <View key={value.id} style={styles.reviewValueItem}>
                    <Text style={styles.reviewValueText}>
                      {`• ${value.revisions[0].statement}`}
                    </Text>
                  </View>
                ))
            ) : (
              <Text style={styles.reviewValueText}>No values selected</Text>
            )}
          </View>
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
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={onSubmit}
          disabled={loading}
          accessibilityLabel={
            isEditMode ? "Update priority" : "Create priority"
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
        >
          <Text style={styles.nextButtonText}>
            {loading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Priority"
                : "Create Priority"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

CreatePriorityReview.propTypes = {
  formData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    why_matters: PropTypes.string.isRequired,
    scope: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    cadence: PropTypes.string,
    constraints: PropTypes.string,
  }).isRequired,
  values: PropTypes.array.isRequired,
  selectedValues: PropTypes.array.isRequired,
  isEditMode: PropTypes.bool,
  loading: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
