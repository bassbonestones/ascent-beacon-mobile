import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { styles } from "../../screens/styles/valuesDiscoveryStyles";
import type { BucketItem } from "../../hooks/useValuesDiscovery";

interface ReviewStepProps {
  coreItems: BucketItem[];
  onBack: () => void;
  onSaveAndContinue: () => Promise<void>;
  saving: boolean;
}

/**
 * Step 3: Review core values before saving.
 */
export default function ReviewStep({
  coreItems,
  onBack,
  onSaveAndContinue,
  saving,
}: ReviewStepProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Review your core values
        </Text>
        <Text style={styles.subtitle}>
          These {coreItems.length} values will guide your priorities
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.reviewContent}
      >
        {coreItems.map((item, idx) => (
          <View
            key={item.prompt_id}
            style={styles.reviewItem}
            accessibilityLabel={`Value ${idx + 1}: ${item.prompt.prompt_text}`}
          >
            <Text style={styles.reviewNumber}>{idx + 1}</Text>
            <Text style={styles.reviewText}>{item.prompt.prompt_text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Go back to adjust"
        >
          <Text style={styles.backButtonText}>← Adjust</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.continueButton,
            saving && styles.continueButtonDisabled,
          ]}
          onPress={onSaveAndContinue}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save and continue"
          accessibilityState={{ disabled: saving }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Save & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
