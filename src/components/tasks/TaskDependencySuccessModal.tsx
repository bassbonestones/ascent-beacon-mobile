import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { depModalStyles } from "./taskDependencyModalStyles";
import { transparentModalProps } from "./transparentModalProps";

/** Merge consecutive duplicate titles so the list can show "(×2)" on the title line. */
export function aggregateSuccessTitles(
  titles: string[],
): { title: string; count: number }[] {
  const out: { title: string; count: number }[] = [];
  for (const t of titles) {
    const last = out[out.length - 1];
    if (last && last.title === t) {
      last.count += 1;
    } else {
      out.push({ title: t, count: 1 });
    }
  }
  return out;
}

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

  const rows = useMemo(() => aggregateSuccessTitles(titles), [titles]);

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
            {rows.map((row, i) => (
              <Text
                key={`${row.title}-${i}-${row.count}`}
                style={depModalStyles.blockerTitle}
              >
                {i + 1}. {row.title}
                {row.count > 1 ? (
                  <Text style={depModalStyles.blockerTitleCount}>
                    {` (×${row.count})`}
                  </Text>
                ) : null}
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
