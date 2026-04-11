import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import type { DependencyBlocker } from "../../types";
import { depModalStyles } from "./taskDependencyModalStyles";
import { transparentModalProps } from "./transparentModalProps";

export interface TaskDependencySoftModalProps {
  visible: boolean;
  taskTitle: string;
  blockers: DependencyBlocker[];
  onCompletePrereqs: () => void;
  onCompleteAnyway: () => void;
  onCancel: () => void;
}

export function TaskDependencySoftModal({
  visible,
  taskTitle,
  blockers,
  onCompletePrereqs,
  onCompleteAnyway,
  onCancel,
}: TaskDependencySoftModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      {...transparentModalProps()}
    >
      <View style={depModalStyles.overlay}>
        <View style={depModalStyles.card}>
          <Text style={depModalStyles.title}>Usually follows:</Text>
          <Text style={depModalStyles.body}>
            Before &quot;{taskTitle}&quot; you often complete:
          </Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {blockers.map((b) => (
              <View key={b.rule_id} style={depModalStyles.blockerRow}>
                <Text style={depModalStyles.blockerTitle}>
                  {b.upstream_task.title}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={depModalStyles.buttonRow}>
            <TouchableOpacity
              style={depModalStyles.primaryBtn}
              onPress={onCompleteAnyway}
              accessibilityRole="button"
              accessibilityLabel="Complete anyway"
            >
              <Text style={depModalStyles.primaryBtnText}>Complete anyway</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={depModalStyles.secondaryBtn}
              onPress={onCompletePrereqs}
              accessibilityRole="button"
            >
              <Text style={depModalStyles.secondaryBtnText}>
                Complete prerequisites
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
