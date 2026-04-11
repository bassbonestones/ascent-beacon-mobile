import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { depModalStyles } from "./taskDependencyModalStyles";
import { transparentModalProps } from "./transparentModalProps";

export interface TaskDependencySuccessModalProps {
  visible: boolean;
  titles: string[];
  kind: "complete_chain" | "cascade_skip";
  skipReason?: string;
  onDismiss: () => void;
}

export function TaskDependencySuccessModal({
  visible,
  titles,
  kind,
  skipReason,
  onDismiss,
}: TaskDependencySuccessModalProps): React.ReactElement {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!visible) return;
    timerRef.current = setTimeout(() => {
      dismissRef.current();
    }, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const heading =
    kind === "complete_chain" ? "Completed together" : "Skipped together";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      {...transparentModalProps()}
    >
      <View style={depModalStyles.overlay}>
        <View style={depModalStyles.card}>
          <Text style={depModalStyles.title}>{heading}</Text>
          <ScrollView style={{ maxHeight: 240 }}>
            {titles.map((t, i) => (
              <Text key={`${t}-${i}`} style={depModalStyles.blockerTitle}>
                {i + 1}. {t}
              </Text>
            ))}
          </ScrollView>
          {kind === "cascade_skip" && skipReason ? (
            <Text style={depModalStyles.body}>Reason: {skipReason}</Text>
          ) : null}
          <TouchableOpacity
            style={[depModalStyles.primaryBtn, { marginTop: 16 }]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={depModalStyles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
