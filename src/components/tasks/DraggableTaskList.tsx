import React from "react";
import { Platform } from "react-native";
import { DraggableTaskList as DraggableTaskListWeb } from "./DraggableTaskList.web";
import type { DraggableTaskListProps } from "./draggableTaskListShared";

export type { DraggableTaskListProps };

/**
 * Web: static import. Native: require() so web bundles do not load
 * react-native-draggable-flatlist / Reanimated.
 */
export function DraggableTaskList(
  props: DraggableTaskListProps,
): React.ReactElement {
  if (Platform.OS === "web") {
    return <DraggableTaskListWeb {...props} />;
  }
  const { DraggableTaskList: NativeList } = require("./DraggableTaskList.native");
  return <NativeList {...props} />;
}
