import { StyleSheet } from "react-native";

export const depModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "85%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },
  body: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
  blockerRow: {
    marginVertical: 6,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  blockerTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },
  /** Multiplicity suffix on success lists, e.g. (×2) */
  blockerTitleCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#22C55E",
  },
  progress: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  buttonRow: {
    marginTop: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#6B7280",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
