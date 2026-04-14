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
  deleteButton: {
    fontSize: 16,
    color: "#EF4444",
  },
  disabledActionText: {
    color: "#6B7280",
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
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterToggle: {
    alignSelf: "flex-start",
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
  badgeColumn: {
    alignItems: "flex-end",
    gap: 4,
  },
  recordStateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  recordStateText: {
    fontSize: 11,
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
  goalCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
    flex: 1,
    marginRight: 8,
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
  goalDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  targetDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  warningText: {
    fontSize: 13,
    color: "#FBBF24",
    marginTop: 4,
  },
  prioritiesRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  prioritiesLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  prioritiesText: {
    fontSize: 13,
    color: "#9CA3AF",
    flex: 1,
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
  statusBadgeLarge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 24,
  },
  statusTextLarge: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailText: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 24,
  },
  priorityItem: {
    fontSize: 16,
    color: "#D1D5DB",
    marginBottom: 4,
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: "#1F2937",
  },
  statusButtonText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  warningBox: {
    backgroundColor: "#422006",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningBoxText: {
    fontSize: 14,
    color: "#FCD34D",
  },
  archiveTaskCard: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  archiveTaskTitle: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  archiveTaskChoice: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 8,
  },
  archiveTargetList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
});

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "not_started":
      return "#9CA3AF";
    case "in_progress":
      return "#3B82F6";
    case "completed":
      return "#10B981";
    case "abandoned":
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "abandoned":
      return "Abandoned";
    default:
      return status;
  }
};

export const getRecordStateColor = (recordState: string): string => {
  switch (recordState) {
    case "paused":
      return "#D97706";
    case "archived":
      return "#64748B";
    case "deleted":
      return "#4B5563";
    case "active":
    default:
      return "#4B5563";
  }
};

export const getRecordStateLabel = (recordState: string | undefined): string => {
  const state = recordState ?? "active";
  switch (state) {
    case "paused":
      return "Paused";
    case "archived":
      return "Archived";
    case "deleted":
      return "Deleted";
    case "active":
    default:
      return "Active";
  }
};
