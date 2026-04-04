import { StyleSheet } from "react-native";

// Form styles
export const formStyles = StyleSheet.create({
  formSection: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 12 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  labelIcon: { width: 18, height: 18 },
  helperText: { fontSize: 13, color: "#666", marginBottom: 8, marginTop: 4 },
  example: { fontSize: 13, color: "#4CAF50", marginLeft: 12, marginBottom: 4 },
  badExample: {
    fontSize: 13,
    color: "#C62828",
    marginLeft: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 44,
  },
  largeInput: { minHeight: 100, textAlignVertical: "top" },
  feedbackBox: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFE082",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  feedbackText: { fontSize: 13, color: "#856404", marginBottom: 4 },
  rulesBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  ruleItemPassed: { backgroundColor: "#F1F8E9", borderBottomColor: "#C5E1A5" },
  ruleCheck: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 8,
    marginTop: 2,
  },
  ruleText: { fontSize: 13, color: "#666", flex: 1 },
  pickerButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
  },
  pickerButtonText: { fontSize: 14, color: "#333" },
});

// Values list styles
export const valuesStyles = StyleSheet.create({
  valuesList: { gap: 8 },
  valueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  valueItemSelected: { borderColor: "#4CAF50", backgroundColor: "#F1F8E9" },
  valueCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    marginTop: 2,
  },
  checkmark: { fontSize: 14, color: "#4CAF50", fontWeight: "bold" },
  valueContent: { flex: 1 },
  valueStatement: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
  },
  valueWeight: { fontSize: 12, color: "#999" },
  linkedValuesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  linkedValueTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  linkedValueText: { fontSize: 14, color: "#1976D2", fontWeight: "500" },
});

// Modal styles
export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalOptionText: { fontSize: 16, color: "#333" },
  modalCloseButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  modalCloseButtonText: { fontSize: 16, fontWeight: "600", color: "#2196F3" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 12,
  },
  modalCloseX: { fontSize: 24, color: "#666" },
  examplesContainer: { flex: 1, marginBottom: 16 },
  ruleExampleCard: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  ruleExampleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  exampleSection: { marginBottom: 12 },
  exampleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  goodExample: {
    fontSize: 13,
    color: "#2E7D32",
    marginLeft: 8,
    marginBottom: 4,
    fontStyle: "italic",
  },
  badExample: {
    fontSize: 13,
    color: "#C62828",
    marginLeft: 8,
    marginBottom: 4,
    fontStyle: "italic",
  },
});

// Review/detail styles
export const reviewStyles = StyleSheet.create({
  reviewSection: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 4,
  },
  reviewValue: { fontSize: 14, color: "#333", lineHeight: 20 },
  reviewValueItem: { marginTop: 8 },
  reviewValueText: { fontSize: 13, color: "#666" },
  detailSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailValue: { fontSize: 16, color: "#333", lineHeight: 24 },
});

// Constants
export interface ScopeOption {
  label: string;
  value: string;
}

export interface ScoreOption {
  label: string;
  value: number;
}

export const SCOPES: ScopeOption[] = [
  { label: "Ongoing (no end point)", value: "ongoing" },
  { label: "In Progress (working toward completion)", value: "in_progress" },
  { label: "Habitual (repeated, sustained)", value: "habitual" },
  { label: "Seasonal (activated during specific windows)", value: "seasonal" },
];

export const SCORE_OPTIONS: ScoreOption[] = [
  { label: "1 - Minor", value: 1 },
  { label: "2 - Somewhat Important", value: 2 },
  { label: "3 - Important", value: 3 },
  { label: "4 - Very Important", value: 4 },
  { label: "5 - Critical", value: 5 },
];
