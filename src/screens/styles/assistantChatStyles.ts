import { StyleSheet } from "react-native";

// Proposed value card styles
export const proposedStyles = StyleSheet.create({
  proposedValueCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#D4AF37",
    shadowColor: "rgba(212, 175, 55, 0.15)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  proposedHeader: { marginBottom: 8 },
  proposedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D4AF37",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  proposedStatement: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    lineHeight: 25,
  },
  proposedRationale: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  proposedActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
});

// Chat zone styles
export const chatStyles = StyleSheet.create({
  chatZone: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  chatContent: { padding: 12 },
  messageRow: { marginBottom: 8 },
  userRow: { alignItems: "flex-end" },
  assistantRow: { alignItems: "flex-start" },
  messageBubble: { maxWidth: "85%", padding: 10, borderRadius: 12 },
  userBubble: { backgroundColor: "#E3F2FD", borderBottomRightRadius: 3 },
  assistantBubble: { backgroundColor: "#F5F5F5", borderBottomLeftRadius: 3 },
  messageText: { fontSize: 14, lineHeight: 19 },
  userText: { color: "#1976D2" },
  assistantText: { color: "#333" },
});

// Input zone styles
export const inputStyles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 34,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  voiceButtonText: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 80,
    marginRight: 8,
    color: "#000",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { backgroundColor: "#E0E0E0" },
  sendButtonText: { color: "#fff", fontSize: 20, fontWeight: "600" },
});
