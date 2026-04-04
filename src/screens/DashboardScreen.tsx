import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ImageSourcePropType,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { User, RootStackParamList } from "../types";
import { styles } from "./styles/dashboardScreenStyles";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  icon: ImageSourcePropType;
  color: string;
  route: keyof RootStackParamList;
  disabled?: boolean;
  params?: Record<string, unknown>;
}

interface DashboardScreenProps {
  user: User | null;
  onLogout: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export default function DashboardScreen({
  user,
  onLogout,
  navigation,
}: DashboardScreenProps): React.ReactElement {
  const blurActiveElement = (): void => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  };

  const modules: Module[] = [
    {
      id: "values",
      title: "Values",
      subtitle: "Discover what matters",
      icon: require("../../assets/NorthStarIcon_values.png") as ImageSourcePropType,
      color: "#4CAF50",
      route: "Values",
    },
    {
      id: "priorities",
      title: "Priorities",
      subtitle: "Anchor what's important",
      icon: require("../../assets/AnchorIcon_Priorities.png") as ImageSourcePropType,
      color: "#2196F3",
      route: "Priorities",
    },
    {
      id: "goals",
      title: "Goals",
      subtitle: "Set your targets",
      icon: require("../../assets/kite_vertical.png") as ImageSourcePropType,
      color: "#FF9800",
      route: "Goals",
    },
    {
      id: "alignment",
      title: "Alignment",
      subtitle: "See your coherence",
      icon: require("../../assets/TwoCirclesIcon_Alignment.png") as ImageSourcePropType,
      color: "#9C27B0",
      route: "Alignment" as keyof RootStackParamList,
      disabled: true, // Coming soon
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.userName}>
            {user?.display_name || user?.primary_email || "User"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            blurActiveElement();
            onLogout();
          }}
          style={styles.logoutButton}
          accessibilityLabel="Logout"
          accessibilityRole="button"
        >
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
              onPress={() => {
                if (module.disabled) {
                  return;
                }

                blurActiveElement();
                // Navigate without params for routes that don't need them
                if (module.params) {
                  // @ts-expect-error Route params vary by route
                  navigation.navigate(module.route, module.params);
                } else {
                  // @ts-expect-error Route types vary
                  navigation.navigate(module.route);
                }
              }}
              disabled={module.disabled}
              activeOpacity={0.7}
              accessibilityLabel={
                module.disabled
                  ? `${module.title}, coming soon`
                  : `Navigate to ${module.title}`
              }
              accessibilityRole="button"
            >
              <View style={styles.moduleContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: module.color + "20" },
                  ]}
                >
                  <Image
                    source={module.icon}
                    style={styles.icon}
                    resizeMode="contain"
                  />
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
