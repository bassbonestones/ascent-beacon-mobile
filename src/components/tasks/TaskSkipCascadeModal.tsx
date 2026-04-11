import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import type { AffectedDownstreamEntry } from "../../types";
import { depModalStyles } from "./taskDependencyModalStyles";
import { transparentModalProps } from "./transparentModalProps";

export interface TaskSkipCascadeModalProps {
  visible: boolean;
  taskTitle: string;
  affected: AffectedDownstreamEntry[];
  onKeepPending: () => void;
  onCascadeSkip: () => void;
  onCancel: () => void;
}

export function TaskSkipCascadeModal({
  visible,
  taskTitle,
  affected,
  onKeepPending,
  onCascadeSkip,
  onCancel,
}: TaskSkipCascadeModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      {...transparentModalProps()}
    >
      <View style={depModalStyles.overlay}>
        <View style={depModalStyles.card}>
          <Text style={depModalStyles.title}>This affects other tasks</Text>
          <Text style={depModalStyles.body}>
            Skipping &quot;{taskTitle}&quot; may impact:
          </Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {affected.map((row) => (
              <View key={row.task_id} style={depModalStyles.blockerRow}>
                <Text style={depModalStyles.blockerTitle}>{row.task_title}</Text>
                <Text style={depModalStyles.progress}>
                  {row.strength} · ~{row.affected_occurrences} occurrence(s)
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={depModalStyles.buttonRow}>
            <TouchableOpacity
              style={depModalStyles.secondaryBtn}
              onPress={onKeepPending}
              accessibilityRole="button"
              accessibilityLabel="Keep affected pending"
            >
              <Text style={depModalStyles.secondaryBtnText}>
                Keep affected pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={depModalStyles.primaryBtn}
              onPress={onCascadeSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip affected tasks too"
            >
              <Text style={depModalStyles.primaryBtnText}>
                Skip affected tasks too
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
