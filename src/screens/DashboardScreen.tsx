import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ImageSourcePropType,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { User, RootStackParamList } from "../types";
import { styles } from "./styles/dashboardScreenStyles";
import { useTime } from "../context/TimeContext";
import { TimeMachineModal } from "../components/TimeMachineModal";
import { TimeTravelIndicator } from "../components/TimeTravelIndicator";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  icon?: ImageSourcePropType;
  iconSize?: "small" | "large";
  vectorIcon?: {
    name: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
  };
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
  const { isTimeMachineEnabled, enableTimeMachine } = useTime();
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blurActiveElement = (): void => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  };

  // Triple-tap handler to enable time machine
  const handleTitlePress = useCallback(() => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 3) {
      // Triple tap detected
      tapCountRef.current = 0;
      enableTimeMachine();
    } else {
      // Reset after 500ms
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 500);
    }
  }, [enableTimeMachine]);

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
      vectorIcon: { name: "lighthouse-on", color: "#FF9800" },
      color: "#FF9800",
      route: "Goals",
    },
    {
      id: "tasks",
      title: "Tasks",
      subtitle: "Take daily action",
      icon: require("../../assets/knot.png") as ImageSourcePropType,
      iconSize: "small",
      color: "#00BCD4",
      route: "Tasks",
    },
    {
      id: "habits",
      title: "Habit Tracker",
      subtitle: "Track your streaks",
      vectorIcon: { name: "chart-line", color: "#E91E63" },
      color: "#E91E63",
      route: "HabitTracker",
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
      {/* Time Travel Indicator */}
      <TimeTravelIndicator onPress={() => setShowTimeMachine(true)} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.userName}>
            {user?.display_name || user?.primary_email || "User"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {isTimeMachineEnabled && (
            <TouchableOpacity
              onPress={() => setShowTimeMachine(true)}
              style={styles.gearButton}
              accessibilityLabel="Open Time Machine"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="cog" size={24} color="#9C27B0" />
            </TouchableOpacity>
          )}
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
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Title - Triple tap to enable time machine */}
        <TouchableOpacity
          style={styles.titleSection}
          onPress={handleTitlePress}
          activeOpacity={1}
          accessibilityLabel="Ascent Beacon"
        >
          <Text style={styles.appTitle}>Ascent Beacon</Text>
          <Text style={styles.appSubtitle}>Navigate your climb</Text>
        </TouchableOpacity>

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
                  {module.vectorIcon ? (
                    <MaterialCommunityIcons
                      name={module.vectorIcon.name}
                      size={32}
                      color={module.vectorIcon.color}
                    />
                  ) : (
                    <Image
                      source={module.icon!}
                      style={
                        module.iconSize === "small"
                          ? styles.iconSmall
                          : styles.icon
                      }
                      resizeMode="contain"
                    />
                  )}
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

      {/* Time Machine Modal */}
      <TimeMachineModal
        visible={showTimeMachine}
        onClose={() => setShowTimeMachine(false)}
      />
    </View>
  );
}
