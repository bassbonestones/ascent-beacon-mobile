// Must be first import to suppress warnings before react-native-web loads
import "./src/utils/suppressWarnings";

import React from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ImageBackground,
  LogBox,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";

// Suppress known warnings on mobile (LogBox)
LogBox.ignoreLogs([
  "props.pointerEvents is deprecated",
  "Animated: `useNativeDriver`",
]);

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AssistantScreen from "./src/screens/AssistantScreen";
import ValuesDiscovery from "./src/screens/ValuesDiscovery";
import PrioritiesScreen from "./src/screens/PrioritiesScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import ValuePriorityLinksScreen from "./src/screens/ValuePriorityLinksScreen";
import GoalsScreen from "./src/screens/GoalsScreen";

const Stack = createNativeStackNavigator();

function AppNavigator() {
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
            <Stack.Screen
              name="Onboarding"
              options={{ animationEnabled: false }}
            >
              {(props) => (
                <OnboardingScreen
                  {...props}
                  user={user}
                  onComplete={updateUser}
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
                {(props) => (
                  <PrioritiesScreen {...props} user={user} onLogout={logout} />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="ValuePriorityLinks"
                component={ValuePriorityLinksScreen}
                options={{ title: "Review Links" }}
              />
              <Stack.Screen
                name="Goals"
                options={{ headerShown: true, title: "Goals" }}
              >
                {(props) => <GoalsScreen {...props} user={user} />}
              </Stack.Screen>
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

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
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
