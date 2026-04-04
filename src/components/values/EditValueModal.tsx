import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { styles } from "../../screens/styles/valuesManagementStyles";

interface EditValueModalProps {
  visible: boolean;
  statement: string;
  onChangeStatement: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

/**
 * Modal for editing an existing value statement.
 */
export default function EditValueModal({
  visible,
  statement,
  onChangeStatement,
  onSave,
  onCancel,
  isSaving = false,
}: EditValueModalProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && Platform.OS === "web") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.editModalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Value</Text>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.modalCloseButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <View style={styles.editModalContent}>
            <TextInput
              ref={inputRef}
              style={styles.editInput}
              placeholder="Edit your value statement..."
              placeholderTextColor="#999"
              value={statement}
              onChangeText={onChangeStatement}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              accessibilityLabel="Edit value statement"
            />
            <TouchableOpacity
              style={[
                styles.editSaveButton,
                isSaving && styles.editSaveButtonDisabled,
              ]}
              onPress={onSave}
              disabled={isSaving || !statement.trim()}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.editSaveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
