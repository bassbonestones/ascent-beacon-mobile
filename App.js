import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AssistantScreen from "./src/screens/AssistantScreen";
import ValuesScreen from "./src/screens/ValuesScreenNew";
import PrioritiesScreen from "./src/screens/PrioritiesScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import api from "./src/services/api";
import { isAuthenticated, clearTokens } from "./src/utils/auth";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authed = await isAuthenticated();
      if (authed) {
        try {
          const currentUser = await api.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          // Token may have expired, clear it
          await clearTokens();
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleOnboardingComplete = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const needsOnboarding =
    user && (!user.display_name || !user.is_email_verified);

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
    <NavigationContainer>
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
                    onComplete={handleOnboardingComplete}
                  />
                )}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Dashboard">
                  {(props) => (
                    <DashboardScreen
                      {...props}
                      user={user}
                      onLogout={handleLogout}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Assistant" component={AssistantScreen} />
                <Stack.Screen name="Values">
                  {(props) => (
                    <ValuesScreen
                      {...props}
                      user={user}
                      onLogout={handleLogout}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Priorities">
                  {(props) => (
                    <PrioritiesScreen
                      {...props}
                      user={user}
                      onLogout={handleLogout}
                    />
                  )}
                </Stack.Screen>
              </>
            )}
          </>
        ) : (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
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
