import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { showAlert } from "../utils/alert";
import type { AuthRequest, AuthSessionResult } from "expo-auth-session";
import { GOOGLE_CLIENT_ID } from "../config";
import api from "../services/api";
import type { User } from "../types";

WebBrowser.maybeCompleteAuthSession();

/**
 * Return type for useLoginAuth hook.
 */
export interface UseLoginAuthReturn {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  showVerifyScreen: boolean;
  countdown: number;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  showEmailInput: boolean;
  showTermsModal: boolean;
  setShowTermsModal: (show: boolean) => void;
  request: AuthRequest | null;
  promptAsync: () => Promise<AuthSessionResult>;
  handleEmailRequest: () => Promise<void>;
  handleResendMagicLink: () => Promise<void>;
  handleCancelVerify: () => void;
  handleVerifyCode: () => Promise<void>;
  formatTime: (seconds: number) => string;
  handleTitleTap: () => Promise<void>;
}

/**
 * Hook for handling login authentication flows.
 */
export default function useLoginAuth(
  onLoginSuccess: (user: User) => void,
): UseLoginAuthReturn {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleGoogleLogin = async (idToken: string): Promise<void> => {
    try {
      setLoading(true);
      const user = await api.loginWithGoogle(idToken);
      onLoginSuccess(user);
    } catch (error) {
      showAlert("Login Failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (): Promise<void> => {
    try {
      setLoading(true);
      const user = await api.devLogin();
      onLoginSuccess(user);
    } catch (error) {
      showAlert("Dev Login Failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRequest = async (): Promise<void> => {
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }
    if (!email.trim()) {
      showAlert("Email Required", "Please enter your email address");
      return;
    }
    try {
      setLoading(true);
      await api.requestMagicLink(email);
      setEmailSent(true);
      setShowVerifyScreen(true);
      setCountdown(300);
    } catch (error) {
      showAlert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendMagicLink = async (): Promise<void> => {
    try {
      setLoading(true);
      await api.requestMagicLink(email);
      setCountdown(300);
      showAlert("Email Sent", "Check your inbox for the magic link");
    } catch (error) {
      showAlert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVerify = (): void => {
    setShowVerifyScreen(false);
    setEmailSent(false);
    setEmail("");
    setVerificationCode("");
    setCountdown(300);
  };

  const handleVerifyCode = async (): Promise<void> => {
    if (!verificationCode.trim()) {
      showAlert("Code Required", "Please enter the 6-digit code");
      return;
    }
    try {
      setLoading(true);
      const user = await api.verifyMagicLink(email, verificationCode);
      onLoginSuccess(user);
    } catch (error) {
      showAlert("Verification Failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTitleTap = async (): Promise<void> => {
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
