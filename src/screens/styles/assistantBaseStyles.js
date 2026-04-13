import { StyleSheet } from "react-native";

// Base container and layout styles
export const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
});

// Symbol zone (top header)
export const symbolStyles = StyleSheet.create({
  symbolZone: {
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    position: "relative",
  },
  backButton: { position: "absolute", top: 60, left: 20, padding: 8 },
  backButtonText: { fontSize: 28, color: "#666" },
  symbolImage: { width: 64, height: 64, marginBottom: 8 },
  symbolLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

// Model zone (middle)
export const modelStyles = StyleSheet.create({
  modelZone: { flex: 1, backgroundColor: "#F5F7FA" },
  modelContent: { padding: 20 },
  emptyState: { paddingVertical: 40, alignItems: "center" },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
});

// Value card styles
export const cardStyles = StyleSheet.create({
  valueCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
    elevation: 2,
  },
  similarHighlight: { borderWidth: 1, borderColor: "#D4AF37" },
  valueStatement: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000",
    marginBottom: 8,
  },
  insightContainer: { marginTop: 8 },
  insightText: { fontSize: 12, lineHeight: 18, color: "#8A8A8A" },
  insightActions: { flexDirection: "row", gap: 12, marginTop: 6 },
  insightButton: { paddingVertical: 4, paddingHorizontal: 6 },
  insightButtonText: { fontSize: 12, color: "#6B6B6B", fontWeight: "600" },
  valueFooter: { flexDirection: "row", justifyContent: "flex-end" },
  valueOrigin: { fontSize: 12, color: "#D4AF37", fontWeight: "500" },
  valueActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
});

// Action button styles
export const buttonStyles = StyleSheet.create({
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E3F2FD",
  },
  editButtonText: { fontSize: 13, fontWeight: "600", color: "#1976D2" },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  deleteButtonText: { fontSize: 13, fontWeight: "600", color: "#666" },
  deleteConfirm: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  deleteConfirmText: { fontSize: 12, color: "#666" },
  deleteConfirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  deleteConfirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FDECEA",
  },
  deleteConfirmButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C62828",
  },
  cancelDeleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  cancelDeleteButtonText: { fontSize: 12, fontWeight: "600", color: "#666" },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  rejectButtonText: { fontSize: 14, fontWeight: "600", color: "#666" },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#D4AF37",
  },
  acceptButtonText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
