import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";

interface DashboardStyles {
  container: ViewStyle;
  header: ViewStyle;
  greeting: TextStyle;
  userName: TextStyle;
  logoutButton: ViewStyle;
  logoutText: TextStyle;
  content: ViewStyle;
  scrollContent: ViewStyle;
  titleSection: ViewStyle;
  appTitle: TextStyle;
  appSubtitle: TextStyle;
  modulesContainer: ViewStyle;
  moduleCard: ViewStyle;
  moduleCardDisabled: ViewStyle;
  moduleContent: ViewStyle;
  iconContainer: ViewStyle;
  icon: ImageStyle;
  iconSmall: ImageStyle;
  moduleTextContainer: ViewStyle;
  moduleTitle: TextStyle;
  moduleSubtitle: TextStyle;
  arrow: TextStyle;
  quoteContainer: ViewStyle;
  quote: TextStyle;
}

export const styles = StyleSheet.create<DashboardStyles>({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 14,
    color: "#666",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  modulesContainer: {
    marginBottom: 32,
  },
  moduleCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleCardDisabled: {
    opacity: 0.5,
  },
  moduleContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  icon: {
    width: 64,
    height: 64,
  },
  iconSmall: {
    width: 32,
    height: 32,
  },
  moduleTextContainer: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  arrow: {
    fontSize: 24,
    color: "#666",
  },
  quoteContainer: {
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  quote: {
    fontSize: 15,
    lineHeight: 24,
    color: "#1B5E20",
    fontStyle: "italic",
  },
});
