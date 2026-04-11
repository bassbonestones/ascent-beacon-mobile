import { StyleSheet } from "react-native";

export const prerequisiteSelectorStyles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  prereqItem: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  prereqMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  prereqInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  prereqTitle: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  prereqRecurring: {
    fontSize: 12,
  },
  strengthToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  strengthHard: {
    backgroundColor: "#DC2626",
  },
  strengthSoft: {
    backgroundColor: "#D97706",
  },
  strengthText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  strengthToggleIcon: {
    color: "#FFFFFF",
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.8,
  },
  removeButton: {
    padding: 4,
  },
  removeText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
  moreOptionsToggle: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#4B5563",
  },
  moreOptionsText: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
  advancedOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#4B5563",
  },
  optionLabel: {
    color: "#D1D5DB",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
  },
  scopeOptions: {
    flexDirection: "column",
    gap: 6,
  },
  scopeOption: {
    backgroundColor: "#4B5563",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  scopeOptionSelected: {
    backgroundColor: "#3B82F6",
  },
  scopeOptionText: {
    color: "#D1D5DB",
    fontSize: 13,
  },
  scopeOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  countInput: {
    backgroundColor: "#4B5563",
    borderRadius: 6,
    padding: 10,
    color: "#F9FAFB",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4B5563",
    borderStyle: "dashed",
  },
  addButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
});
