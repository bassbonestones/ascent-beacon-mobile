import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import useLoginAuth from "../useLoginAuth";
import api from "../../services/api";
import type { User } from "../../types";

// Mock expo modules
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

const mockPromptAsync = jest.fn();
jest.mock("expo-auth-session/providers/google", () => ({
  useIdTokenAuthRequest: jest.fn(() => [null, null, mockPromptAsync]),
}));

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    loginWithGoogle: jest.fn(),
    devLogin: jest.fn(),
    requestMagicLink: jest.fn(),
    verifyMagicLink: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

jest.mock("../../config", () => ({
  GOOGLE_CLIENT_ID: "test-client-id",
}));

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("useLoginAuth", () => {
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with empty email", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));
      expect(result.current.email).toBe("");
    });

    it("should initialize loading as false", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));
      expect(result.current.loading).toBe(false);
    });

    it("should initialize showVerifyScreen as false", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));
      expect(result.current.showVerifyScreen).toBe(false);
    });

    it("should initialize countdown at 300", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));
      expect(result.current.countdown).toBe(300);
    });

    it("should initialize showEmailInput as false", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));
      expect(result.current.showEmailInput).toBe(false);
    });

    it("should initialize showTermsModal as false", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));
      expect(result.current.showTermsModal).toBe(false);
    });
  });

  describe("handleEmailRequest", () => {
    it("should show email input if not visible", async () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      expect(result.current.showEmailInput).toBe(false);

      await act(async () => {
        await result.current.handleEmailRequest();
      });

      expect(result.current.showEmailInput).toBe(true);
    });

    it("should show alert for empty email", async () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      // First show email input
      await act(async () => {
        await result.current.handleEmailRequest();
      });

      // Then try to submit empty email
      await act(async () => {
        await result.current.handleEmailRequest();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Email Required",
        "Please enter your email address",
      );
    });

    it("should call API and show verify screen on success", async () => {
      mockedApi.requestMagicLink.mockResolvedValueOnce({
        message: "Email sent",
      });
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      // Show email input
      await act(async () => {
        await result.current.handleEmailRequest();
      });

      // Set email
      act(() => {
        result.current.setEmail("test@example.com");
      });

      // Submit
      await act(async () => {
        await result.current.handleEmailRequest();
      });

      expect(mockedApi.requestMagicLink).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(result.current.showVerifyScreen).toBe(true);
    });

    it("should show alert on API error", async () => {
      mockedApi.requestMagicLink.mockRejectedValueOnce(
        new Error("Network error"),
      );
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      // Show email input and set email
      await act(async () => {
        await result.current.handleEmailRequest();
      });
      act(() => {
        result.current.setEmail("test@example.com");
      });

      // Submit
      await act(async () => {
        await result.current.handleEmailRequest();
      });

      expect(Alert.alert).toHaveBeenCalledWith("Error", "Network error");
    });
  });

  describe("handleResendMagicLink", () => {
    it("should call API and reset countdown", async () => {
      mockedApi.requestMagicLink.mockResolvedValueOnce({
        message: "Email sent",
      });
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      act(() => {
        result.current.setEmail("test@example.com");
      });

      await act(async () => {
        await result.current.handleResendMagicLink();
      });

      expect(mockedApi.requestMagicLink).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(result.current.countdown).toBe(300);
      expect(Alert.alert).toHaveBeenCalledWith(
        "Email Sent",
        "Check your inbox for the magic link",
      );
    });

    it("should show alert on error", async () => {
      mockedApi.requestMagicLink.mockRejectedValueOnce(new Error("Failed"));
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      act(() => {
        result.current.setEmail("test@example.com");
      });

      await act(async () => {
        await result.current.handleResendMagicLink();
      });

      expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed");
    });
  });

  describe("handleCancelVerify", () => {
    it("should reset verification state", async () => {
      mockedApi.requestMagicLink.mockResolvedValueOnce({
        message: "Email sent",
      });
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      // Set up verify screen state
      await act(async () => {
        await result.current.handleEmailRequest();
      });
      act(() => {
        result.current.setEmail("test@example.com");
      });
      await act(async () => {
        await result.current.handleEmailRequest();
      });

      expect(result.current.showVerifyScreen).toBe(true);

      // Cancel
      act(() => {
        result.current.handleCancelVerify();
      });

      expect(result.current.showVerifyScreen).toBe(false);
      expect(result.current.email).toBe("");
      expect(result.current.verificationCode).toBe("");
      expect(result.current.countdown).toBe(300);
    });
  });

  describe("handleVerifyCode", () => {
    it("should show alert for empty code", async () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      await act(async () => {
        await result.current.handleVerifyCode();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Code Required",
        "Please enter the 6-digit code",
      );
    });

    it("should call API and login on success", async () => {
      const mockUser: User = {
        id: "user-1",
        display_name: "Test User",
        primary_email: "test@example.com",
        is_email_verified: true,
        created_at: new Date().toISOString(),
      };
      mockedApi.verifyMagicLink.mockResolvedValueOnce(mockUser);
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      act(() => {
        result.current.setEmail("test@example.com");
        result.current.setVerificationCode("123456");
      });

      await act(async () => {
        await result.current.handleVerifyCode();
      });

      expect(mockedApi.verifyMagicLink).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
      );
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUser);
    });

    it("should show alert on verification failure", async () => {
      mockedApi.verifyMagicLink.mockRejectedValueOnce(
        new Error("Invalid code"),
      );
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      act(() => {
        result.current.setEmail("test@example.com");
        result.current.setVerificationCode("000000");
      });

      await act(async () => {
        await result.current.handleVerifyCode();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Verification Failed",
        "Invalid code",
      );
    });
  });

  describe("formatTime", () => {
    it("should format seconds correctly", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      expect(result.current.formatTime(300)).toBe("5:00");
      expect(result.current.formatTime(65)).toBe("1:05");
      expect(result.current.formatTime(5)).toBe("0:05");
      expect(result.current.formatTime(0)).toBe("0:00");
    });
  });

  describe("countdown timer", () => {
    it("should decrement countdown when verify screen is shown", async () => {
      mockedApi.requestMagicLink.mockResolvedValueOnce({
        message: "Email sent",
      });
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      // Set up verify state
      await act(async () => {
        await result.current.handleEmailRequest();
      });
      act(() => {
        result.current.setEmail("test@example.com");
      });
      await act(async () => {
        await result.current.handleEmailRequest();
      });

      expect(result.current.showVerifyScreen).toBe(true);
      const initialCountdown = result.current.countdown;

      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.countdown).toBe(initialCountdown - 1);
    });
  });

  describe("setters", () => {
    it("should update email", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      act(() => {
        result.current.setEmail("new@email.com");
      });

      expect(result.current.email).toBe("new@email.com");
    });

    it("should update verificationCode", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      act(() => {
        result.current.setVerificationCode("123456");
      });

      expect(result.current.verificationCode).toBe("123456");
    });

    it("should update showTermsModal", () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      act(() => {
        result.current.setShowTermsModal(true);
      });

      expect(result.current.showTermsModal).toBe(true);
    });
  });

  describe("handleTitleTap (dev login)", () => {
    beforeEach(() => {
      // Mock Date.now for tap timing
      jest.spyOn(Date, "now").mockReturnValue(1000);
    });

    afterEach(() => {
      jest.spyOn(Date, "now").mockRestore();
    });

    it("should trigger dev login after 3 rapid taps", async () => {
      const mockUser: User = {
        id: "dev-user",
        display_name: "Dev User",
        primary_email: "dev@test.com",
        is_email_verified: true,
        created_at: new Date().toISOString(),
      };
      mockedApi.devLogin.mockResolvedValueOnce(mockUser);
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      // Tap 3 times rapidly
      await act(async () => {
        await result.current.handleTitleTap();
      });

      jest.spyOn(Date, "now").mockReturnValue(1100); // 100ms later
      await act(async () => {
        await result.current.handleTitleTap();
      });

      jest.spyOn(Date, "now").mockReturnValue(1200); // 200ms later
      await act(async () => {
        await result.current.handleTitleTap();
      });

      expect(mockedApi.devLogin).toHaveBeenCalled();
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUser);
    });

    it("should reset tap count if taps are too slow", async () => {
      const { result } = renderHook(() => useLoginAuth(mockOnLoginSuccess));

      // First tap
      await act(async () => {
        await result.current.handleTitleTap();
      });

      // Wait too long (>500ms)
      jest.spyOn(Date, "now").mockReturnValue(1600);

      // Second tap (should reset count to 1)
      await act(async () => {
        await result.current.handleTitleTap();
      });

      // Third tap (only tap 2 after reset)
      jest.spyOn(Date, "now").mockReturnValue(1700);
      await act(async () => {
        await result.current.handleTitleTap();
      });

      expect(mockedApi.devLogin).not.toHaveBeenCalled();
    });
  });
});
