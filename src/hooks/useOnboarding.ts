import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import ApiService from "../services/api";
import { logError } from "../utils/logger";
import type { User } from "../types";

type OnboardingStep = "display-name" | "email" | "verify-email";

/**
 * Return type for useOnboarding hook.
 */
export interface UseOnboardingReturn {
  displayName: string;
  setDisplayName: (name: string) => void;
  email: string;
  newEmail: string;
  setNewEmail: (email: string) => void;
  isAddingEmail: boolean;
  step: OnboardingStep;
  loading: boolean;
  verificationToken: string;
  setVerificationToken: (token: string) => void;
  timeRemaining: number;
  handleDisplayName: () => Promise<void>;
  handleEmailSubmit: () => Promise<void>;
  handleSelectDifferentEmail: () => void;
  handleCancelNewEmail: () => void;
  handleSkipEmail: () => void;
  handleVerifyEmail: () => Promise<void>;
  handleResendCode: () => Promise<void>;
  formatTime: (seconds: number) => string;
}

/**
 * Hook for managing onboarding process state and operations.
 */
export default function useOnboarding(
  user: User | null,
  onComplete: (user: User) => void,
): UseOnboardingReturn {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(user?.primary_email || "");
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("display-name");
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(300);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const handleDisplayName = async (): Promise<void> => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Please enter a display name");
      return;
    }
    setLoading(true);
    try {
      const response = await ApiService.request<User>(
        "/auth/onboarding/display-name",
        {
          method: "POST",
          body: JSON.stringify({ display_name: displayName }),
        },
      );
      if (response.is_email_verified) onComplete(response);
      else setStep("email");
    } catch (error) {
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to set display name",
      );
    } finally {
      setLoading(false);
    }
  };

  const startVerificationCountdown = (): void => {
    setTimeRemaining(300);
    const interval = setInterval(() => {
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
    pollingIntervalRef.current = interval;
  };

  const handleEmailSubmit = async (): Promise<void> => {
    const emailToUse = isAddingEmail ? newEmail : email;
    if (!emailToUse.trim()) {
      Alert.alert("Error", "Please enter an email");
      return;
    }
    setLoading(true);
    try {
      if (!isAddingEmail && emailToUse === user?.primary_email) {
        const updatedUser = await ApiService.request<User>(
          "/auth/onboarding/email",
          {
            method: "POST",
            body: JSON.stringify({ primary_email: emailToUse }),
          },
        );
        onComplete(updatedUser);
      } else {
        await ApiService.request("/auth/onboarding/email", {
          method: "POST",
          body: JSON.stringify({
            primary_email: emailToUse,
            force_verification: true,
          }),
        });
        setStep("verify-email");
        setEmail(emailToUse);
        startVerificationCountdown();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to update email",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDifferentEmail = (): void => {
    setIsAddingEmail(true);
    setNewEmail("");
  };

  const handleCancelNewEmail = (): void => {
    setIsAddingEmail(false);
    setNewEmail("");
    setEmail(user?.primary_email || "");
  };

  const handleSkipEmail = (): void => {
    if (user) onComplete(user);
  };

  const handleVerifyEmail = async (): Promise<void> => {
    if (!verificationToken.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }
    setLoading(true);
    try {
      const response = await ApiService.request<User>(
        "/auth/onboarding/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: verificationToken }),
        },
      );
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      Alert.alert("Success", "Email verified!");
      onComplete(response);
    } catch (error) {
      logError("Verification error:", error);
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to verify email",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    setLoading(true);
    try {
      await ApiService.request("/auth/onboarding/email", {
        method: "POST",
        body: JSON.stringify({ primary_email: email }),
      });
      Alert.alert("Success", "Verification code sent to " + email);
      startVerificationCountdown();
    } catch (error) {
      Alert.alert("Error", (error as Error).message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    displayName,
    setDisplayName,
    email,
    newEmail,
    setNewEmail,
    isAddingEmail,
    step,
    loading,
    verificationToken,
    setVerificationToken,
    timeRemaining,
    handleDisplayName,
    handleEmailSubmit,
    handleSelectDifferentEmail,
    handleCancelNewEmail,
    handleSkipEmail,
    handleVerifyEmail,
    handleResendCode,
    formatTime,
  };
}
