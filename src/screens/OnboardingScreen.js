import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import ApiService from "../services/api";

const OnboardingScreen = ({ navigation, user, onComplete }) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(user?.primary_email || "");
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [step, setStep] = useState("display-name"); // display-name, email, verify-email
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [pollingInterval, setPollingInterval] = useState(null);

  console.log("OnboardingScreen rendered, current step:", step);

  // Handle display name submission
  const handleDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Please enter a display name");
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.request(
        "/auth/onboarding/display-name",
        {
          method: "POST",
          body: JSON.stringify({ display_name: displayName }),
        },
      );

      // If email is already verified (e.g., logged in with email code), skip email step
      if (response.is_email_verified) {
        console.log("Email already verified, completing onboarding");
        onComplete(response);
      } else {
        setStep("email");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to set display name");
    } finally {
      setLoading(false);
    }
  };

  // Handle email update or skip
  const handleEmailSubmit = async () => {
    console.log("handleEmailSubmit called", { email, newEmail, isAddingEmail });

    // Determine which email is being used
    const emailToUse = isAddingEmail ? newEmail : email;
    console.log(
      "Email to use:",
      emailToUse,
      "OAuth email:",
      user?.primary_email,
    );

    // Validate email input
    if (!emailToUse.trim()) {
      Alert.alert("Error", "Please enter an email");
      return;
    }

    setLoading(true);
    try {
      // If user clicked "Continue" with default OAuth email, auto-verify
      if (!isAddingEmail && emailToUse === user?.primary_email) {
        // Just update verification status, no need to send code
        const updatedUser = await ApiService.request("/auth/onboarding/email", {
          method: "POST",
          body: JSON.stringify({ primary_email: emailToUse }),
        });
        console.log("OAuth email auto-verified, completing onboarding");
        onComplete(updatedUser);
      } else {
        // User is adding a different email - always require verification
        const updatedUser = await ApiService.request("/auth/onboarding/email", {
          method: "POST",
          body: JSON.stringify({
            primary_email: emailToUse,
            force_verification: true, // Always verify when user manually enters
          }),
        });

        console.log("Setting step to verify-email");
        setStep("verify-email");
        setEmail(emailToUse);
        startVerificationCountdown();
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDifferentEmail = () => {
    setIsAddingEmail(true);
    setNewEmail("");
  };

  const handleCancelNewEmail = () => {
    setIsAddingEmail(false);
    setNewEmail("");
    setEmail(user?.primary_email || "");
  };

  const handleSkipEmail = () => {
    onComplete(user);
  };

  // Request verification code (this is already sent by backend, but we can resend)
  const requestVerificationCode = async () => {
    // Verification email is automatically sent by backend
    // This is just for manual resend if needed
  };

  // Handle email verification
  const handleVerifyEmail = async () => {
    console.log("Verify button clicked, token:", verificationToken);

    if (!verificationToken.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending verification request...");
      const response = await ApiService.request(
        "/auth/onboarding/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: verificationToken }),
        },
      );
      console.log("Verification response:", response);

      // Clear polling interval
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      Alert.alert("Success", "Email verified!");
      onComplete(response);
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Error", error.message || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  // Poll for email verification status
  const startVerificationCountdown = () => {
    setTimeRemaining(300); // Reset to 5 minutes

    const interval = setInterval(async () => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          Alert.alert(
            "Timeout",
            "Verification code expired. Please request a new one.",
          );
          setStep("email");
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    setPollingInterval(interval);
  };

  const handleResendCode = async () => {
    // Resend verification email
    setLoading(true);
    try {
      await ApiService.request("/auth/onboarding/email", {
        method: "POST",
        body: JSON.stringify({ primary_email: email }),
      });
      Alert.alert("Success", "Verification code sent to " + email);
      startVerificationCountdown();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {step === "display-name" && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Set Your Display Name</Text>
          <Text style={styles.subtitle}>
            This is how others will see you in the app
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor="#999"
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleDisplayName}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === "email" && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We'll use this email to verify your account
          </Text>

          {!isAddingEmail ? (
            <>
              <View style={styles.emailDropdown}>
                <Text style={styles.emailDropdownLabel}>Email:</Text>
                <Text style={styles.emailDropdownValue}>{email}</Text>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleEmailSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleSelectDifferentEmail}
                  disabled={loading}
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
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                placeholderTextColor="#999"
                editable={!loading}
              />

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    (!newEmail.trim() || loading) && styles.buttonDisabled,
                  ]}
                  onPress={handleEmailSubmit}
                  disabled={!newEmail.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleCancelNewEmail}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {step === "verify-email" && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            Check your email for the verification code
          </Text>

          <Text style={styles.timerText}>
            Code expires in: {formatTime(timeRemaining)}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter verification code"
            value={verificationToken}
            onChangeText={setVerificationToken}
            placeholderTextColor="#999"
            editable={!loading}
            autoCapitalize="none"
          />

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={() => {
                console.log("VERIFY BUTTON PRESSED");
                handleVerifyEmail();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleResendCode}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  stepContainer: {
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
  },
  currentEmail: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  currentEmailLabel: {
    fontSize: 12,
    color: "#666",
  },
  currentEmailValue: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  emailDropdown: {
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 6,
  },
  emailDropdownLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  emailDropdownValue: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  linkButton: {
    padding: 8,
  },
  linkButtonText: {
    color: "#007AFF",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "transparent",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  timerText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
  },
});

export default OnboardingScreen;
