import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";

export default function DashboardScreen({ user, onLogout, navigation }) {
  const modules = [
    {
      id: "values",
      title: "Values",
      subtitle: "Discover what matters",
      icon: require("../../assets/NorthStarIcon_values.png"),
      color: "#4CAF50",
      route: "Values",
    },
    {
      id: "priorities",
      title: "Priorities",
      subtitle: "Lock what's important",
      icon: require("../../assets/AnchorIcon_Priorities.png"),
      color: "#2196F3",
      route: "Priorities",
      disabled: true, // Coming soon
    },
    {
      id: "alignment",
      title: "Alignment",
      subtitle: "See your coherence",
      icon: require("../../assets/TwoCirclesIcon_Alignment.png"),
      color: "#9C27B0",
      route: "Alignment",
      disabled: true, // Coming soon
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.userName}>{user?.email || "User"}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Title */}
        <View style={styles.titleSection}>
          <Text style={styles.appTitle}>Ascent Beacon</Text>
          <Text style={styles.appSubtitle}>Navigate your climb</Text>
        </View>

        {/* Modules */}
        <View style={styles.modulesContainer}>
          {modules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={[
                styles.moduleCard,
                module.disabled && styles.moduleCardDisabled,
              ]}
              onPress={() =>
                !module.disabled &&
                navigation.navigate(module.route, module.params || {})
              }
              disabled={module.disabled}
              activeOpacity={0.7}
            >
              <View style={styles.moduleContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: module.color + "20" },
                  ]}
                >
                  <Image source={module.icon} style={styles.icon} />
                </View>
                <View style={styles.moduleTextContainer}>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleSubtitle}>
                    {module.disabled ? "Coming soon" : module.subtitle}
                  </Text>
                </View>
                {!module.disabled && <Text style={styles.arrow}>→</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>
            "Most stress isn't from doing too much — it's from doing the wrong
            things first."
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 32,
    height: 32,
    resizeMode: "contain",
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
