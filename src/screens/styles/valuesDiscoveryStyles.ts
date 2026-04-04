import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  // ============================================================================
  // Container & Layout
  // ============================================================================
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  // ============================================================================
  // Header
  // ============================================================================
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  subsubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    fontStyle: "italic",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },

  // ============================================================================
  // Progress Dots
  // ============================================================================
  progressDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    justifyContent: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
  },
  progressDotActive: {
    backgroundColor: "#007AFF",
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: "#34C759",
  },

  // ============================================================================
  // Content & Scrolling
  // ============================================================================
  content: {
    flex: 1,
  },
  gridContent: {
    padding: 20,
  },

  // ============================================================================
  // Grid (Selection)
  // ============================================================================
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    minHeight: 80,
    justifyContent: "center",
  },
  gridItemSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  gridItemText: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
  },
  gridItemTextSelected: {
    color: "#007AFF",
    fontWeight: "500",
  },

  // ============================================================================
  // Buckets
  // ============================================================================
  bucketSection: {
    padding: 20,
    paddingBottom: 10,
  },
  bucketTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  bucketDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 12,
  },
  bucketItemsContainer: {
    maxHeight: 280,
  },
  bucketItem: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 8,
  },
  bucketItemText: {
    fontSize: 15,
    color: "#000",
  },
  emptyBucket: {
    padding: 24,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  emptyBucketText: {
    fontSize: 14,
    color: "#B0B0B0",
    fontStyle: "italic",
  },
  warningBox: {
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FFB84D",
  },
  warningText: {
    fontSize: 13,
    color: "#8B7236",
  },

  // ============================================================================
  // Review
  // ============================================================================
  reviewContent: {
    paddingTop: 20,
  },
  reviewItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  reviewNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
    marginRight: 16,
    width: 30,
  },
  reviewText: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },

  // ============================================================================
  // Statement Creation
  // ============================================================================
  statementContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statementPrompt: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  statementLens: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 24,
    fontStyle: "italic",
  },
  statementLabelStandalone: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  startersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  starterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E5EA",
  },
  starterButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  starterButtonText: {
    fontSize: 14,
    color: "#000",
  },
  starterButtonTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  statementLabelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  statementLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  statementLabelPrompt: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  statementInputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginBottom: 16,
  },
  statementStarter: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  statementInput: {
    fontSize: 16,
    color: "#000",
    minHeight: 60,
    textAlignVertical: "top",
  },
  statementPreview: {
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  statementPreviewLabel: {
    fontSize: 12,
    color: "#007AFF",
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statementPreviewText: {
    fontSize: 16,
    color: "#000",
    fontStyle: "italic",
  },

  // ============================================================================
  // Footer
  // ============================================================================
  footer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    gap: 12,
    alignItems: "center",
  },
  footerRight: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  selectionCount: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "500",
  },
  continueButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  // ============================================================================
  // Modal
  // ============================================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    padding: 16,
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#FFE5E5",
  },
  modalButtonText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "500",
  },

  // ============================================================================
  // Warning/Alert Modals
  // ============================================================================
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  alertContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  alertText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  alertButtons: {
    gap: 12,
  },
  alertButton: {
    padding: 14,
    backgroundColor: "#F5F5F7",
    borderRadius: 10,
    alignItems: "center",
  },
  alertButtonPrimary: {
    backgroundColor: "#007AFF",
  },
  alertButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  alertButtonTextPrimary: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // ============================================================================
  // Done Screen
  // ============================================================================
  doneTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#34C759",
    marginBottom: 16,
  },
  doneText: {
    fontSize: 18,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 26,
  },
  doneButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
