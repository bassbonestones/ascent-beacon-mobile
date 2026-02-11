import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Animated,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";

const AnimatedImage = Animated.createAnimatedComponent(Image);

const kiteSprites = {
  vertical: require("../../assets/kite_vertical.png"),
  slightLeft: require("../../assets/kite_slight_left.png"),
  fullLeft: require("../../assets/kite_full_left.png"),
  slightRight: require("../../assets/kite_slight_right.png"),
  fullRight: require("../../assets/kite_full_right.png"),
};
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GOOGLE_CLIENT_ID } from "../config";
import api from "../services/api";
import TermsModal from "../components/TermsModal";

// Required for web browser to close after auth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showVerifyScreen, setShowVerifyScreen] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [verificationCode, setVerificationCode] = useState("");
  const [titleTaps, setTitleTaps] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const kitePos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const [kiteSprite, setKiteSprite] = useState("vertical");
  const driftTimeout = useRef(null);
  const currentAnimation = useRef(null);
  const isTouching = useRef(false);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const kiteSize = 42;
  const topZoneHeight = screenHeight / 3;

  // Countdown timer effect
  React.useEffect(() => {
    if (showVerifyScreen && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showVerifyScreen, countdown]);

  // Google OAuth setup
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });

  // Handle Google OAuth response
  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const selectKiteSprite = (fromX, fromY, toX, toY) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angleRad = Math.atan2(dx, -dy); // -dy because y increases downward
    let angleDeg = (angleRad * 180) / Math.PI;

    // Normalize to -180 to 180
    while (angleDeg > 180) angleDeg -= 360;
    while (angleDeg < -180) angleDeg += 360;

    const absAngle = Math.abs(angleDeg);
    // Deviation from vertical (0° = up, 180° = down)
    const deviationFromVertical = Math.min(absAngle, 180 - absAngle);

    // Vertical (up or down, within 10 degrees)
    if (deviationFromVertical <= 10) {
      return "vertical";
    }

    // Determine if moving right or left
    const movingRight = angleDeg > 0;

    if (deviationFromVertical <= 45) {
      return movingRight ? "slightRight" : "slightLeft";
    } else {
      return movingRight ? "fullRight" : "fullLeft";
    }
  };

  const scheduleDrift = () => {
    if (isTouching.current) return;

    const targetX = Math.max(
      12,
      Math.min(screenWidth - kiteSize - 12, Math.random() * screenWidth),
    );
    const targetY = Math.max(
      12,
      Math.min(topZoneHeight - kiteSize - 12, Math.random() * topZoneHeight),
    );

    targetPos.current = { x: targetX, y: targetY };
    const sprite = selectKiteSprite(
      currentPos.current.x,
      currentPos.current.y,
      targetX,
      targetY,
    );
    setKiteSprite(sprite);

    if (currentAnimation.current) {
      currentAnimation.current.stop();
    }

    currentAnimation.current = Animated.timing(kitePos, {
      toValue: { x: targetX, y: targetY },
      duration: 12000,
      useNativeDriver: true,
    });

    currentAnimation.current.start(({ finished }) => {
      if (finished) {
        currentPos.current = { x: targetX, y: targetY };
        if (!isTouching.current) {
          driftTimeout.current = setTimeout(scheduleDrift, 2000);
        }
      }
    });
  };

  useEffect(() => {
    const startX = screenWidth * 0.65;
    const startY = topZoneHeight * 0.35;
    kitePos.setValue({ x: startX, y: startY });
    currentPos.current = { x: startX, y: startY };
    targetPos.current = { x: startX, y: startY };

    scheduleDrift();

    return () => {
      if (driftTimeout.current) {
        clearTimeout(driftTimeout.current);
      }
      if (currentAnimation.current) {
        currentAnimation.current.stop();
      }
    };
  }, []);

  const handleTopZoneTouch = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const targetX = Math.max(
      12,
      Math.min(screenWidth - kiteSize - 12, locationX - kiteSize / 2),
    );
    const targetY = Math.max(
      12,
      Math.min(topZoneHeight - kiteSize - 12, locationY - kiteSize / 2),
    );

    targetPos.current = { x: targetX, y: targetY };
    const sprite = selectKiteSprite(
      currentPos.current.x,
      currentPos.current.y,
      targetX,
      targetY,
    );
    setKiteSprite(sprite);

    if (currentAnimation.current) {
      currentAnimation.current.stop();
    }

    // Update current position immediately for better sprite selection on next update
    const distance = Math.sqrt(
      Math.pow(targetX - currentPos.current.x, 2) +
        Math.pow(targetY - currentPos.current.y, 2),
    );
    const duration = Math.max(6000, distance * 30);

    currentAnimation.current = Animated.timing(kitePos, {
      toValue: { x: targetX, y: targetY },
      duration: duration,
      useNativeDriver: true,
    });

    currentAnimation.current.start(({ finished }) => {
      if (finished) {
        currentPos.current = { x: targetX, y: targetY };
      }
    });

    // Update current position estimate for smoother sprite transitions
    currentPos.current = {
      x: currentPos.current.x + (targetX - currentPos.current.x) * 0.15,
      y: currentPos.current.y + (targetY - currentPos.current.y) * 0.15,
    };
  };

  const handleTouchStart = (event) => {
    isTouching.current = true;
    if (driftTimeout.current) {
      clearTimeout(driftTimeout.current);
      driftTimeout.current = null;
    }
    if (currentAnimation.current) {
      currentAnimation.current.stop();
    }
    handleTopZoneTouch(event);
  };

  const handleTouchEnd = () => {
    isTouching.current = false;
    // Resume drifting after 1 second
    driftTimeout.current = setTimeout(() => {
      scheduleDrift();
    }, 1000);
  };

  const handleGoogleLogin = async (idToken) => {
    try {
      setLoading(true);
      const user = await api.loginWithGoogle(idToken);
      onLoginSuccess(user);
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      setLoading(true);
      const user = await api.devLogin();
      onLoginSuccess(user);
    } catch (error) {
      Alert.alert("Dev Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRequest = async () => {
    // If email input not shown, just expand it
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }

    // Otherwise validate and submit
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await api.requestMagicLink(email);
      setEmailSent(true);
      setShowVerifyScreen(true);
      setCountdown(300); // Reset countdown
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendMagicLink = async () => {
    try {
      setLoading(true);
      await api.requestMagicLink(email);
      setCountdown(300); // Reset countdown
      Alert.alert("Email Sent", "Check your inbox for the magic link");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVerify = () => {
    setShowVerifyScreen(false);
    setEmailSent(false);
    setEmail("");
    setVerificationCode("");
    setCountdown(300);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("Code Required", "Please enter the 6-digit code");
      return;
    }

    try {
      setLoading(true);
      const user = await api.verifyMagicLink(email, verificationCode);
      onLoginSuccess(user);
    } catch (error) {
      Alert.alert("Verification Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTitleTap = async () => {
    const now = Date.now();
    // Reset if more than 500ms since last tap
    if (now - lastTapTime > 500) {
      setTitleTaps(1);
    } else {
      setTitleTaps(titleTaps + 1);
      // Trigger dev login on 3 taps
      if (titleTaps + 1 === 3) {
        setTitleTaps(0);
        await handleDevLogin();
        return;
      }
    }
    setLastTapTime(now);
  };

  return (
    <ImageBackground
      source={require("../../assets/login-background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View
        style={styles.topZone}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTopZoneTouch}
        onResponderRelease={handleTouchEnd}
        onResponderTerminate={handleTouchEnd}
      >
        <AnimatedImage
          source={kiteSprites[kiteSprite]}
          style={[
            styles.kiteImage,
            kiteSprite === "slightLeft" || kiteSprite === "slightRight"
              ? { width: 51, height: 51 }
              : null,
            { transform: kitePos.getTranslateTransform() },
          ]}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Logo/Title Area */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleTitleTap} activeOpacity={0.8}>
              <Text style={styles.title}>Ascent Beacon</Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>
              Find your path. Lock your priorities.
            </Text>
          </View>

          {showVerifyScreen ? (
            /* Verify Magic Link Screen */
            <View style={styles.authContainer}>
              <Text style={styles.verifyTitle}>Check Your Email</Text>
              <Text style={styles.verifySubtitle}>
                We sent a 6-digit code to:
              </Text>
              <Text style={styles.verifyEmail}>{email}</Text>

              <Text style={styles.verifyInstructions}>
                Enter the code below. It expires in:
              </Text>

              <Text style={styles.countdown}>{formatTime(countdown)}</Text>

              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor="#999"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, styles.emailButton]}
                onPress={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.emailButtonText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.resendButton]}
                onPress={handleResendMagicLink}
                disabled={loading || countdown > 270}
              >
                {loading ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <Text style={styles.resendButtonText}>
                    Resend Code {countdown > 270 && `(in ${countdown - 270}s)`}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelVerify}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Auth Options */
            <View style={styles.authContainer}>
              {/* Google Sign-In */}
              <TouchableOpacity
                style={[styles.button, styles.googleButton]}
                onPress={() => promptAsync()}
                disabled={!request || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Magic Link */}
              <View style={styles.emailContainer}>
                {showEmailInput && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    autoFocus
                  />
                )}

                <TouchableOpacity
                  style={[styles.button, styles.emailButton]}
                  onPress={handleEmailRequest}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.emailButtonText}>
                      {showEmailInput ? "Send Code" : "Log In with Code"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Terms Disclaimer */}
              <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                  By logging in, you agree to our{" "}
                  <Text
                    style={styles.disclaimerLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Terms & Conditions
                  </Text>
                  .
                </Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  topZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "33%",
    zIndex: 2,
  },
  kiteImage: {
    position: "absolute",
    width: 42,
    height: 42,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#B3D9F2",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  authContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 24,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  googleButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  devButton: {
    backgroundColor: "#FF6B35",
  },
  devButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#666",
    fontSize: 14,
  },
  emailContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  emailButton: {
    backgroundColor: "#007AFF",
  },
  emailButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 12,
  },
  verifySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  verifyEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  verifyInstructions: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  countdown: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginVertical: 24,
    fontVariant: ["tabular-nums"],
  },
  codeInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 8,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
    marginBottom: 16,
    fontVariant: ["tabular-nums"],
  },
  resendButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
    marginBottom: 12,
  },
  resendButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimerContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  disclaimerText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  disclaimerLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
