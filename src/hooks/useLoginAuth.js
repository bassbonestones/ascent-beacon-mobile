import { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GOOGLE_CLIENT_ID } from "../config";
import api from "../services/api";

WebBrowser.maybeCompleteAuthSession();

/**
 * Hook for handling login authentication flows.
 */
export default function useLoginAuth(onLoginSuccess) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showVerifyScreen, setShowVerifyScreen] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [verificationCode, setVerificationCode] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [titleTaps, setTitleTaps] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });

  // Countdown timer
  useEffect(() => {
    if (showVerifyScreen && countdown > 0) {
      const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [showVerifyScreen, countdown]);

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

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
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address");
      return;
    }
    try {
      setLoading(true);
      await api.requestMagicLink(email);
      setEmailSent(true);
      setShowVerifyScreen(true);
      setCountdown(300);
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
      setCountdown(300);
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
    if (now - lastTapTime > 500) {
      setTitleTaps(1);
    } else {
      setTitleTaps(titleTaps + 1);
      if (titleTaps + 1 === 3) {
        setTitleTaps(0);
        await handleDevLogin();
        return;
      }
    }
    setLastTapTime(now);
  };

  return {
    email,
    setEmail,
    loading,
    showVerifyScreen,
    countdown,
    verificationCode,
    setVerificationCode,
    showEmailInput,
    showTermsModal,
    setShowTermsModal,
    request,
    promptAsync,
    handleEmailRequest,
    handleResendMagicLink,
    handleCancelVerify,
    handleVerifyCode,
    formatTime,
    handleTitleTap,
  };
}
