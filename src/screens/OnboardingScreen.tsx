import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useOnboarding from "../hooks/useOnboarding";
import { styles } from "./styles/onboardingScreenStyles";
import type { User, RootStackParamList } from "../types";

interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  user: User;
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  navigation,
  user,
  onComplete,
}) => {
  const ob = useOnboarding(user, onComplete);

  return (
    <View style={styles.container}>
      {ob.step === "display-name" && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Set Your Display Name</Text>
          <Text style={styles.subtitle}>
            This is how others will see you in the app
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your display name"
            value={ob.displayName}
            onChangeText={ob.setDisplayName}
            placeholderTextColor="#999"
            editable={!ob.loading}
            accessibilityLabel="Display name"
          />
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              ob.loading && styles.buttonDisabled,
            ]}
            onPress={ob.handleDisplayName}
            disabled={ob.loading}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            {ob.loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {ob.step === "email" && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We'll use this email to verify your account
          </Text>
          {!ob.isAddingEmail ? (
            <>
              <View style={styles.emailDropdown}>
                <Text style={styles.emailDropdownLabel}>Email:</Text>
                <Text style={styles.emailDropdownValue}>{ob.email}</Text>
              </View>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={ob.handleEmailSubmit}
                  disabled={ob.loading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with this email"
                >
                  {ob.loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={ob.handleSelectDifferentEmail}
                  disabled={ob.loading}
                  accessibilityRole="button"
                  accessibilityLabel="Use a different email"
                >
                  <Text style={styles.secondaryButtonText}>
                    + Different Email
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={ob.newEmail}
                onChangeText={ob.setNewEmail}
                keyboardType="email-address"
                placeholderTextColor="#999"
                editable={!ob.loading}
                accessibilityLabel="New email address"
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    (!ob.newEmail.trim() || ob.loading) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={ob.handleEmailSubmit}
                  disabled={!ob.newEmail.trim() || ob.loading}
                  accessibilityRole="button"
                  accessibilityLabel="Verify this email"
                >
                  {ob.loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={ob.handleCancelNewEmail}
                  disabled={ob.loading}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {ob.step === "verify-email" && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            Check your email for the verification code
          </Text>
          <Text style={styles.timerText}>
            Code expires in: {ob.formatTime(ob.timeRemaining)}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter verification code"
            value={ob.verificationToken}
            onChangeText={ob.setVerificationToken}
            placeholderTextColor="#999"
            editable={!ob.loading}
            autoCapitalize="none"
            accessibilityLabel="Verification code"
          />
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                ob.loading && styles.buttonDisabled,
              ]}
              onPress={ob.handleVerifyEmail}
              disabled={ob.loading}
              accessibilityRole="button"
              accessibilityLabel="Verify code"
            >
              {ob.loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={ob.handleResendCode}
              disabled={ob.loading}
              accessibilityRole="button"
              accessibilityLabel="Resend code"
            >
              <Text style={styles.secondaryButtonText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default OnboardingScreen;
