import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import type { DependencyBlocker } from "../../types";
import { depModalStyles } from "./taskDependencyModalStyles";
import { transparentModalProps } from "./transparentModalProps";

export interface TaskDependencyOverrideModalProps {
  visible: boolean;
  taskTitle: string;
  blockers: DependencyBlocker[];
  reason: string;
  onReasonChange: (text: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function TaskDependencyOverrideModal({
  visible,
  taskTitle,
  blockers,
  reason,
  onReasonChange,
  onConfirm,
  onBack,
}: TaskDependencyOverrideModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      {...transparentModalProps()}
    >
      <View style={depModalStyles.overlay}>
        <View style={depModalStyles.card}>
          <Text style={depModalStyles.title}>Override prerequisites</Text>
          <Text style={depModalStyles.body}>
            You are about to complete &quot;{taskTitle}&quot; without satisfying:
          </Text>
          <ScrollView style={{ maxHeight: 120 }}>
            {blockers.map((b) => (
              <Text key={b.rule_id} style={depModalStyles.blockerTitle}>
                • {b.upstream_task.title}
              </Text>
            ))}
          </ScrollView>
          <Text style={[depModalStyles.body, { marginTop: 12 }]}>
            Optional reason (recommended):
          </Text>
          <TextInput
            style={depModalStyles.input}
            multiline
            value={reason}
            onChangeText={onReasonChange}
            placeholder="Why override?"
            accessibilityLabel="Override reason"
          />
          <View style={[depModalStyles.buttonRow, { marginTop: 12 }]}>
            <TouchableOpacity
              style={depModalStyles.primaryBtn}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm override and complete current"
            >
              <Text style={depModalStyles.primaryBtnText}>
                Override and complete current
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={depModalStyles.secondaryBtn}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={depModalStyles.secondaryBtnText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
