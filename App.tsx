// Must be first import to suppress warnings before react-native-web loads
import "./src/utils/suppressWarnings";

import React from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ImageBackground,
  LogBox,
  Platform,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Conditionally import GestureHandlerRootView - only needed on native
let GestureHandlerRootView: React.ComponentType<{
  style?: any;
  children?: React.ReactNode;
}>;
if (Platform.OS !== "web") {
  GestureHandlerRootView =
    require("react-native-gesture-handler").GestureHandlerRootView;
} else {
  // On web, just use a View wrapper
  GestureHandlerRootView = View;
}

// Suppress known warnings on mobile (LogBox)
LogBox.ignoreLogs([
  "props.pointerEvents is deprecated",
  "Animated: `useNativeDriver`",
  "InteractionManager has been deprecated", // From react-native-draggable-flatlist
]);

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { TimeProvider } from "./src/context/TimeContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AssistantScreen from "./src/screens/AssistantScreen";
import ValuesDiscovery from "./src/screens/ValuesDiscovery";
import PrioritiesScreen from "./src/screens/PrioritiesScreen";
import GoalsScreen from "./src/screens/GoalsScreen";
import TasksScreen from "./src/screens/TasksScreen";
import HabitTrackerScreen from "./src/screens/HabitTrackerScreen";
import HabitMetricsScreen from "./src/screens/HabitMetricsScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import ValuePriorityLinksScreen from "./src/screens/ValuePriorityLinksScreen";
import ReorderTasksScreen from "./src/screens/ReorderTasksScreen";
import type { RootStackParamList } from "./src/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator(): React.ReactElement {
  const { user, loading, login, logout, updateUser, needsOnboarding } =
    useAuth();

  if (loading) {
    return (
      <ImageBackground
        source={require("./assets/login-background.png")}
        style={styles.loadingBackground}
        resizeMode="cover"
      >
        <View style={styles.loadingOverlay} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B3D9F2" />
        </View>
      </ImageBackground>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {needsOnboarding ? (
            <Stack.Screen name="Onboarding" options={{ animation: "none" }}>
              {(props) => (
                <OnboardingScreen
                  {...props}
                  user={user}
                  onComplete={(updatedUser) => updateUser(updatedUser)}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Dashboard">
                {(props) => (
                  <DashboardScreen {...props} user={user} onLogout={logout} />
                )}
              </Stack.Screen>
              <Stack.Screen name="Assistant" component={AssistantScreen} />
              <Stack.Screen name="Values">
                {(props) => (
                  <ValuesDiscovery {...props} user={user} onLogout={logout} />
                )}
              </Stack.Screen>
              <Stack.Screen name="Priorities">
                {(props) => <PrioritiesScreen {...props} user={user} />}
              </Stack.Screen>
              <Stack.Screen name="Goals">
                {(props) => <GoalsScreen {...props} user={user} />}
              </Stack.Screen>
              <Stack.Screen name="Tasks">
                {(props) => <TasksScreen {...props} user={user} />}
              </Stack.Screen>
              <Stack.Screen name="HabitTracker">
                {(props) => <HabitTrackerScreen {...props} user={user} />}
              </Stack.Screen>
              <Stack.Screen
                name="HabitMetrics"
                component={HabitMetricsScreen}
              />
              <Stack.Screen
                name="ValuePriorityLinks"
                component={ValuePriorityLinksScreen}
                options={{ title: "Review Links" }}
              />
              <Stack.Screen
                name="ReorderTasks"
                component={ReorderTasksScreen}
                options={{ title: "Reorder Tasks" }}
              />
            </>
          )}
        </>
      ) : (
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLoginSuccess={login} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

export default function App(): React.ReactElement {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <AuthProvider>
            <TimeProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </TimeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingBackground: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
