import { StyleSheet, Platform, ViewStyle } from "react-native";

// Cross-platform shadow helper
const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  android: { elevation: 2 },
  default: {},
}) as ViewStyle;

const buttonShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: { elevation: 3 },
  default: {},
}) as ViewStyle;

const lightButtonShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  android: { elevation: 2 },
  default: {},
}) as ViewStyle;

// Base container and layout styles
export const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: "#F5F7FA",
  },
  footerFullWidth: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButtonFull: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonFullText: { color: "#333", fontSize: 16, fontWeight: "600" },
});

// Header styles
export const headerStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#000" },
  logoutButton: { paddingVertical: 8, paddingHorizontal: 12 },
  logoutText: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
  weightsButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  weightsButton: {
    backgroundColor: "#66BB6A",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  weightsButtonIcon: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  weightsButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

// Card and list styles
export const cardStyles = StyleSheet.create({
  valuesList: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  valueCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...cardShadow,
  },
  similarHighlight: { borderWidth: 1, borderColor: "#D4AF37" },
  valueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  valueStatement: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
    marginRight: 8,
  },
  insightContainer: { marginTop: 10 },
  insightText: { fontSize: 12, lineHeight: 18, color: "#8A8A8A" },
  insightActions: { flexDirection: "row", gap: 12, marginTop: 6 },
  insightButton: { paddingVertical: 4, paddingHorizontal: 6 },
  insightButtonText: { fontSize: 12, color: "#6B6B6B", fontWeight: "600" },
  weightText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 8,
  },
  valueActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    justifyContent: "flex-end",
  },
});

// Info and guidance box styles
export const infoStyles = StyleSheet.create({
  infoBox: {
    backgroundColor: "#E8F5E9",
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  infoText: { fontSize: 14, lineHeight: 20, color: "#1B5E20" },
  guidanceBox: { backgroundColor: "#FFF3E0", padding: 16, borderRadius: 12 },
  guidanceText: { fontSize: 14, color: "#E65100", textAlign: "center" },
  hint: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 12 },
});

// Button styles
export const buttonStyles = StyleSheet.create({
  deleteButton: {
    backgroundColor: "#FFEBEE",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: { color: "#C62828", fontSize: 14, fontWeight: "600" },
  editButton: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: { color: "#1976D2", fontSize: 14, fontWeight: "600" },
  dashboardButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    zIndex: 100,
    ...buttonShadow,
  },
  dashboardButtonText: { color: "#1976D2", fontSize: 16, fontWeight: "600" },
  backButton: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    ...lightButtonShadow,
  },
  backButtonText: { color: "#1976D2", fontSize: 16, fontWeight: "600" },
  backButtonStyled: {
    backgroundColor: "#E0E0E0",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonStyledText: { color: "#333", fontSize: 16, fontWeight: "600" },
});
