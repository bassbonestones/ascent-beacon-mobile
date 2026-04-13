import { StyleSheet } from "react-native";

// Base layout and container styles
export const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  content: { flex: 1, padding: 20 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
  },
  emptySubText: { fontSize: 14, color: "#CCC" },
});

// Header styles
export const headerStyles = StyleSheet.create({
  header: { backgroundColor: "#F0F8FF", padding: 24, paddingTop: 40 },
  headerMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 120,
    gap: 0,
  },
  headerTextBlock: { flex: 1, paddingLeft: 0 },
  headerIconContainer: { alignItems: "center", justifyContent: "center" },
  headerMainIcon: { width: 112, height: 112 },
  stepNumber: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666" },
});

// Priority card styles
export const cardStyles = StyleSheet.create({
  prioritiesList: { gap: 12 },
  priorityCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  priorityCardAnchored: {
    borderWidth: 2,
    borderColor: "#2196F3",
    backgroundColor: "#F0F8FF",
  },
  priorityCardContent: { gap: 8 },
  priorityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityTitle: { fontSize: 16, fontWeight: "600", color: "#333", flex: 1 },
  anchoredBadge: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityWhy: { fontSize: 13, color: "#666", lineHeight: 18 },
  priorityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priorityScope: { fontSize: 12, color: "#999", fontWeight: "500" },
  priorityScore: { fontSize: 12, color: "#2196F3", fontWeight: "500" },
});

// Button styles
export const buttonStyles = StyleSheet.create({
  createButton: {
    backgroundColor: "#2196F3",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  footer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
    alignItems: "center",
  },
  continueButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  backButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
  nextButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonDisabled: { backgroundColor: "#CCC" },
  nextButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  examplesButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
    alignItems: "center",
  },
  examplesButtonText: { fontSize: 14, fontWeight: "600", color: "#2E7D32" },
});
