import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import type { DependencyBlocker } from "../../types";
import { depModalStyles } from "./taskDependencyModalStyles";
import { transparentModalProps } from "./transparentModalProps";

export interface TaskDependencyHardModalProps {
  visible: boolean;
  taskTitle: string;
  blockers: DependencyBlocker[];
  onCompletePrereqs: () => void;
  onOverride: () => void;
  onCancel: () => void;
}

export function TaskDependencyHardModal({
  visible,
  taskTitle,
  blockers,
  onCompletePrereqs,
  onOverride,
  onCancel,
}: TaskDependencyHardModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      {...transparentModalProps()}
    >
      <View style={depModalStyles.overlay}>
        <View style={depModalStyles.card}>
          <Text style={depModalStyles.title}>Requires:</Text>
          <Text style={depModalStyles.body}>
            &quot;{taskTitle}&quot; needs these first:
          </Text>
          <ScrollView style={{ maxHeight: 220 }}>
            {blockers.map((b) => (
              <View key={b.rule_id} style={depModalStyles.blockerRow}>
                <Text style={depModalStyles.blockerTitle}>
                  {b.upstream_task.title}
                </Text>
                {b.required_count > 1 && (
                  <Text style={depModalStyles.progress}>
                    {b.completed_count} of {b.required_count} completed
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
          <View style={depModalStyles.buttonRow}>
            <TouchableOpacity
              style={depModalStyles.primaryBtn}
              onPress={onCompletePrereqs}
              accessibilityRole="button"
              accessibilityLabel="Complete prerequisites"
            >
              <Text style={depModalStyles.primaryBtnText}>
                Complete prerequisites
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={depModalStyles.secondaryBtn}
              onPress={onOverride}
              accessibilityRole="button"
              accessibilityLabel="Override and complete current"
            >
              <Text style={depModalStyles.secondaryBtnText}>
                Override and complete current
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={depModalStyles.cancelBtn}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={depModalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
