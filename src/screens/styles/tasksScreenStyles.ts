import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
    flex: 1,
    textAlign: "center",
  },
  backButtonRow: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  backButton: {
    backgroundColor: "#374151",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#374151",
  },
  filterToggleActive: {
    backgroundColor: "#1F2937",
    borderColor: "#60A5FA",
  },
  filterToggleText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  filterToggleTextActive: {
    color: "#60A5FA",
  },
  viewModeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  viewModeToggle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  viewModeToggleActive: {
    borderBottomColor: "#3B82F6",
  },
  viewModeToggleText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
  },
  viewModeToggleTextActive: {
    color: "#F9FAFB",
    fontWeight: "600",
  },
  sectionHeader: {
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionReorderButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#4B5563",
  },
  sectionReorderButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
    alignItems: "center",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
    marginRight: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  overdueCount: {
    color: "#EF4444",
  },
  condenseToggle: {
    marginLeft: "auto",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#6B7280",
    backgroundColor: "transparent",
  },
  condenseToggleActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  condenseToggleText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  condenseToggleTextActive: {
    color: "#FFFFFF",
  },
  // Reorder button in Today summary row - matches section header style
  summaryReorderButton: {
    marginLeft: "auto",
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#4B5563",
  },
  summaryReorderButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative", // Required for absolute positioned children
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  taskTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  occurrenceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    backgroundColor: "#374151",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskGoal: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  unalignedText: {
    color: "#F59E0B",
    fontStyle: "italic",
  },
  timeWarning: {
    fontSize: 12,
    color: "#F59E0B",
    marginTop: 4,
    fontStyle: "italic",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  taskDuration: {
    fontSize: 13,
    color: "#6B7280",
  },
  taskScheduled: {
    fontSize: 13,
    color: "#6B7280",
  },
  taskTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  taskTimeOverdue: {
    color: "#EF4444",
  },
  taskTimeFlexible: {
    color: "#8B5CF6", // Purple for flexible window tasks
  },
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  taskCardDragging: {
    opacity: 0.9,
    backgroundColor: "#F3E8FF",
    elevation: 8,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  lightningBadge: {
    backgroundColor: "#FBBF24",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lightningText: {
    fontSize: 11,
    color: "#1F2937",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  checkButton: {
    padding: 8,
    marginLeft: 8,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleCompleted: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkMark: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  // New styles for non-nested button structure
  taskCardPressable: {
    flex: 1,
  },
  actionSpacer: {
    width: 48, // Space for absolute positioned button
  },
  checkButtonAbsolute: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 8,
    zIndex: 10,
  },
  checkCircleAbsolute: {
    position: "absolute",
    right: 24,
    top: 24,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#D1D5DB",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 12,
    color: "#F9FAFB",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
  },
  picker: {
    color: "#F9FAFB",
    backgroundColor: "transparent",
  },
  goalSelector: {
    gap: 8,
  },
  goalOption: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  goalOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#1E3A5F",
  },
  goalOptionText: {
    color: "#D1D5DB",
    fontSize: 15,
  },
  goalOptionTextSelected: {
    color: "#F9FAFB",
    fontWeight: "500",
  },
  lightningCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#374151",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#FBBF24",
    borderColor: "#FBBF24",
  },
  lightningLabel: {
    color: "#D1D5DB",
    fontSize: 16,
  },
  lightningHelp: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
    marginLeft: 36,
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: "#374151",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  detailContainer: {
    padding: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 16,
    color: "#D1D5DB",
    marginBottom: 16,
    lineHeight: 24,
  },
  detailMeta: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailMetaLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  detailMetaValue: {
    fontSize: 14,
    color: "#F9FAFB",
    fontWeight: "500",
  },
  actionButtons: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  completeButton: {
    backgroundColor: "#10B981",
  },
  trackingButton: {
    backgroundColor: "#E91E63",
  },
  editButton: {
    backgroundColor: "#6366F1",
  },
  skipButton: {
    backgroundColor: "#6B7280",
  },
  reopenButton: {
    backgroundColor: "#3B82F6",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  // Recurrence styles
  recurrenceButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  recurrenceButtonText: {
    color: "#60A5FA",
    fontSize: 14,
  },
  recurrenceButtonIcon: {
    color: "#60A5FA",
    fontSize: 16,
  },
  schedulingModeDisplay: {
    marginTop: 8,
    marginLeft: 36,
  },
  schedulingModeText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  recurringBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recurringText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  anytimeBadge: {
    backgroundColor: "#14B8A6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  anytimeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  skipReasonText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: "#374151",
  },
  viewToggleText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  viewToggleTextActive: {
    color: "#F9FAFB",
    fontWeight: "500",
  },
  listFooter: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  listFooterText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  // Phase 4e: Anytime task reorder buttons
  reorderButtons: {
    position: "absolute",
    right: 50,
    top: 8,
    flexDirection: "column",
    gap: 2,
    zIndex: 90,
  },
  reorderButton: {
    width: 28,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 4,
  },
  reorderButtonText: {
    color: "#9CA3AF",
    fontSize: 10,
  },
});
