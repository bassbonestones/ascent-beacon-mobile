import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { styles } from "../../screens/styles/prioritiesScreenStyles";

/**
 * Modal displaying examples for each validation rule.
 */
export default function ExamplesModal({ visible, ruleExamples, onClose }) {
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
            <TouchableOpacity onPress={onClose}>
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

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

ExamplesModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  ruleExamples: PropTypes.objectOf(
    PropTypes.shape({
      rule_title: PropTypes.string,
      good_examples: PropTypes.arrayOf(PropTypes.string),
      bad_examples: PropTypes.arrayOf(PropTypes.string),
    }),
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};
