import { StyleSheet } from "react-native";

export const recurrencePickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  cancelText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  saveText: {
    fontSize: 16,
    color: "#60A5FA",
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#4B5563",
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 16,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  optionButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  optionText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intervalInput: {
    backgroundColor: "#374151",
    color: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: "center",
    fontSize: 16,
  },
  intervalLabel: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  dayText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  dayTextActive: {
    color: "#FFFFFF",
  },
  modeOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 8,
  },
  modeOptionActive: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  modeTitle: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  modeDesc: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  endOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 8,
  },
  endOptionActive: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  endOptionText: {
    color: "#F9FAFB",
    fontSize: 14,
  },
  endInput: {
    backgroundColor: "#374151",
    color: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 8,
  },
  preview: {
    backgroundColor: "#374151",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  previewLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  previewText: {
    color: "#F9FAFB",
    fontSize: 14,
  },
});
