import { StyleSheet, ViewStyle, TextStyle } from "react-native";

interface TimeMachineModalStyles {
  overlay: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  closeText: TextStyle;
  statusBox: ViewStyle;
  pendingBox: ViewStyle;
  statusLabel: TextStyle;
  statusValue: TextStyle;
  statusWarning: TextStyle;
  quickActions: ViewStyle;
  sectionLabel: TextStyle;
  quickButtonsRow: ViewStyle;
  quickButton: ViewStyle;
  quickButtonText: TextStyle;
  calendarContainer: ViewStyle;
  timezoneSection: ViewStyle;
  timezoneHeader: ViewStyle;
  timezoneHeaderContent: ViewStyle;
  timezoneValue: TextStyle;
  timezonePickerContainer: ViewStyle;
  actions: ViewStyle;
  returnButton: ViewStyle;
  returnButtonText: TextStyle;
  fullResetButton: ViewStyle;
  fullResetButtonText: TextStyle;
  confirmTravelButton: ViewStyle;
  confirmTravelButtonText: TextStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  confirmOverlay: ViewStyle;
  confirmBox: ViewStyle;
  confirmTitle: TextStyle;
  confirmText: TextStyle;
  confirmWarning: TextStyle;
  confirmButtons: ViewStyle;
  confirmCancel: ViewStyle;
  confirmCancelText: TextStyle;
  confirmDelete: ViewStyle;
  confirmDeleteText: TextStyle;
  confirmTravel: ViewStyle;
  confirmKeep: ViewStyle;
  confirmKeepText: TextStyle;
}

export const styles = StyleSheet.create<TimeMachineModalStyles>({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#9C27B0",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: "#666",
  },
  statusBox: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    alignItems: "center",
  },
  pendingBox: {
    backgroundColor: "#FFF3E0",
    borderWidth: 2,
    borderColor: "#FF9800",
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 4,
  },
  statusWarning: {
    fontSize: 14,
    color: "#FF9800",
    marginTop: 8,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  quickButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#E8E8E8",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  calendarContainer: {
    paddingHorizontal: 16,
  },
  timezoneSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  timezoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  timezoneHeaderContent: {
    flex: 1,
  },
  timezoneValue: {
    fontSize: 15,
    color: "#9C27B0",
    fontWeight: "500",
    marginTop: 4,
  },
  timezonePickerContainer: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  returnButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  returnButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fullResetButton: {
    backgroundColor: "#FF5722",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  fullResetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmTravelButton: {
    backgroundColor: "#9C27B0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmTravelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF5722",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  confirmWarning: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  confirmDelete: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#FF5722",
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  confirmTravel: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#9C27B0",
    alignItems: "center",
  },
  confirmKeep: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    alignItems: "center",
  },
  confirmKeepText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
