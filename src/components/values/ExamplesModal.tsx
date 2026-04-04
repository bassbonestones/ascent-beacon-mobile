import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { styles } from "../../screens/styles/valuesManagementStyles";

const VALUE_EXAMPLES: string[] = [
  "Being deeply present with family by listening attentively, creating rituals, and protecting shared time.",
  "Growing professionally by learning deliberately, seeking feedback, and taking calculated risks.",
  "Showing up for community through consistent service, advocacy, and creating space for others.",
  "Prioritizing health by moving daily, eating intentionally, and honoring rest.",
  "Creating meaningful work that serves others, challenges me, and reflects my values.",
  "Building financial stability through intentional saving, mindful spending, and long-term planning.",
];

interface ExamplesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExample: (example: string) => void;
}

/**
 * Modal showing value examples that can be selected as starting points.
 */
export default function ExamplesModal({
  visible,
  onClose,
  onSelectExample,
}: ExamplesModalProps): React.ReactElement {
  const closeButtonRef = useRef<View>(null);

  useEffect(() => {
    if (visible && Platform.OS === "web") {
      setTimeout(() => {
        (closeButtonRef.current as unknown as HTMLElement)?.focus?.();
      }, 100);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Value Examples</Text>
          <TouchableOpacity
            ref={closeButtonRef}
            onPress={onClose}
            style={styles.modalCloseButton}
            accessibilityRole="button"
            accessibilityLabel="Close examples"
          >
            <Text style={styles.modalCloseText}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalHint}>
            These are examples to inspire you. Tap one to use it as a starting
            point, then edit it to make it your own.
          </Text>
          {VALUE_EXAMPLES.map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleCard}
              onPress={() => onSelectExample(example)}
              accessibilityRole="button"
              accessibilityLabel={`Use example: ${example.substring(0, 50)}...`}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
