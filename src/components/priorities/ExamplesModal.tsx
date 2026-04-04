import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";

interface RuleExample {
  rule_title: string;
  good_examples?: string[];
  bad_examples?: string[];
}

interface ExamplesModalProps {
  visible: boolean;
  ruleExamples: Record<string, RuleExample>;
  onClose: () => void;
}

/**
 * Modal displaying examples for each validation rule.
 */
export default function ExamplesModal({
  visible,
  ruleExamples,
  onClose,
}: ExamplesModalProps): React.ReactElement {
  const closeButtonRef = useRef<View>(null);

  useEffect(() => {
    if (visible && Platform.OS === "web") {
      // Move focus into modal to avoid aria-hidden conflict
      setTimeout(() => {
        (closeButtonRef.current as unknown as HTMLElement)?.focus?.();
      }, 100);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Examples for Each Rule</Text>
            <TouchableOpacity
              ref={closeButtonRef}
              onPress={onClose}
              accessibilityLabel="Close examples"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.examplesContainer}>
            {Object.entries(ruleExamples).map(([ruleName, ruleData]) => (
              <View key={ruleName} style={styles.ruleExampleCard}>
                <Text style={styles.ruleExampleTitle}>
                  {ruleData.rule_title}
                </Text>

                {Array.isArray(ruleData.good_examples) &&
                  ruleData.good_examples.length > 0 && (
                    <View style={styles.exampleSection}>
                      <Text style={styles.exampleLabel}>✓ Good examples:</Text>
                      {ruleData.good_examples.map((example, idx) => (
                        <Text key={`good-${idx}`} style={styles.goodExample}>
                          "{example}"
                        </Text>
                      ))}
                    </View>
                  )}

                {Array.isArray(ruleData.bad_examples) &&
                  ruleData.bad_examples.length > 0 && (
                    <View style={styles.exampleSection}>
                      <Text style={styles.exampleLabel}>✗ Bad examples:</Text>
                      {ruleData.bad_examples.map((example, idx) => (
                        <Text key={`bad-${idx}`} style={styles.badExample}>
                          "{example}"
                        </Text>
                      ))}
                    </View>
                  )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
            accessibilityLabel="Close examples"
            accessibilityRole="button"
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
