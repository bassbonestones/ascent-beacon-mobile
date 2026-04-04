import { StyleSheet } from "react-native";

// Form/create section styles
export const formStyles = StyleSheet.create({
  createSection: { marginBottom: 24 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 100,
    marginBottom: 12,
  },
  examplesLink: { alignSelf: "flex-start", marginBottom: 16 },
  examplesLinkText: { color: "#007AFF", fontSize: 14, fontWeight: "600" },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonDisabled: { backgroundColor: "#C8E6C9" },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

// Modal styles
export const modalStyles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#000" },
  modalCloseButton: { paddingVertical: 8, paddingHorizontal: 12 },
  modalCloseText: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
  modalContent: { flex: 1, padding: 20 },
  modalHint: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 20 },
  exampleCard: {
    backgroundColor: "#F5F7FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exampleText: { fontSize: 15, lineHeight: 22, color: "#000" },
});

// Edit modal styles
export const editStyles = StyleSheet.create({
  editModalContainer: { flex: 1, backgroundColor: "#fff" },
  editModalContent: { padding: 20 },
  editInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 120,
    marginBottom: 20,
    color: "#000",
  },
  editSaveButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  editSaveButtonDisabled: { backgroundColor: "#C8E6C9" },
  editSaveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
