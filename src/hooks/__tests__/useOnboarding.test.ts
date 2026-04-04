/**
 * Tests for useOnboarding hook
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import useOnboarding from "../useOnboarding";
import type { User } from "../../types";

// Mock the API service
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    request: jest.fn(),
  },
}));

import ApiService from "../../services/api";

const mockedApiService = ApiService as jest.Mocked<typeof ApiService>;

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useOnboarding", () => {
  const mockUser: User = {
    id: "user-1",
    display_name: null,
    primary_email: "test@example.com",
    is_email_verified: false,
    created_at: new Date().toISOString(),
  };
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with display-name step", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      expect(result.current.step).toBe("display-name");
    });

    it("should initialize email from user.primary_email", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      expect(result.current.email).toBe("test@example.com");
    });

    it("should initialize with empty display name", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      expect(result.current.displayName).toBe("");
    });

    it("should initialize loading as false", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      expect(result.current.loading).toBe(false);
    });
  });

  describe("handleDisplayName", () => {
    it("should show alert for empty display name", async () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      await act(async () => {
        await result.current.handleDisplayName();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter a display name",
      );
    });

    it("should call API and complete if email already verified", async () => {
      const verifiedUser: User = { ...mockUser, is_email_verified: true };
      mockedApiService.request.mockResolvedValueOnce(verifiedUser);

      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setDisplayName("John Doe");
      });

      await act(async () => {
        await result.current.handleDisplayName();
      });

      expect(mockedApiService.request).toHaveBeenCalledWith(
        "/auth/onboarding/display-name",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ display_name: "John Doe" }),
        }),
      );
      expect(mockOnComplete).toHaveBeenCalledWith(verifiedUser);
    });

    it("should move to email step if email not verified", async () => {
      mockedApiService.request.mockResolvedValueOnce({
        ...mockUser,
        is_email_verified: false,
      });

      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setDisplayName("John Doe");
      });

      await act(async () => {
        await result.current.handleDisplayName();
      });

      expect(result.current.step).toBe("email");
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it("should show alert on API error", async () => {
      mockedApiService.request.mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setDisplayName("John Doe");
      });

      await act(async () => {
        await result.current.handleDisplayName();
      });

      expect(Alert.alert).toHaveBeenCalledWith("Error", "Network error");
    });

    it("should set loading during API call", async () => {
      let resolvePromise: (value: User) => void;
      mockedApiService.request.mockImplementationOnce(
        () =>
          new Promise<User>((r) => {
            resolvePromise = r;
          }),
      );

      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setDisplayName("John Doe");
      });

      let handlePromise: Promise<void>;
      act(() => {
        handlePromise = result.current.handleDisplayName();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({ ...mockUser, is_email_verified: true });
        await handlePromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("handleEmailSubmit", () => {
    it("should show alert for empty email", async () => {
      // User with no email
      const noEmailUser: User = { ...mockUser, primary_email: "" };
      const { result } = renderHook(() =>
        useOnboarding(noEmailUser, mockOnComplete),
      );

      await act(async () => {
        await result.current.handleEmailSubmit();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter an email",
      );
    });

    it("should complete if using existing verified email", async () => {
      const updatedUser: User = { ...mockUser, is_email_verified: true };
      mockedApiService.request.mockResolvedValueOnce(updatedUser);

      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      await act(async () => {
        await result.current.handleEmailSubmit();
      });

      expect(mockOnComplete).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe("handleSelectDifferentEmail", () => {
    it("should enable adding email mode", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.handleSelectDifferentEmail();
      });

      expect(result.current.isAddingEmail).toBe(true);
    });
  });

  describe("handleCancelNewEmail", () => {
    it("should disable adding email mode and reset email", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.handleSelectDifferentEmail();
        result.current.setNewEmail("new@example.com");
      });

      act(() => {
        result.current.handleCancelNewEmail();
      });

      expect(result.current.isAddingEmail).toBe(false);
      expect(result.current.newEmail).toBe("");
      expect(result.current.email).toBe("test@example.com");
    });
  });

  describe("handleSkipEmail", () => {
    it("should complete with current user", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.handleSkipEmail();
      });

      expect(mockOnComplete).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("handleVerifyEmail", () => {
    it("should show alert for empty verification token", async () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      await act(async () => {
        await result.current.handleVerifyEmail();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter the verification code",
      );
    });

    it("should call API and complete on success", async () => {
      const verifiedUser: User = { ...mockUser, is_email_verified: true };
      mockedApiService.request.mockResolvedValueOnce(verifiedUser);

      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setVerificationToken("123456");
      });

      await act(async () => {
        await result.current.handleVerifyEmail();
      });

      expect(Alert.alert).toHaveBeenCalledWith("Success", "Email verified!");
      expect(mockOnComplete).toHaveBeenCalledWith(verifiedUser);
    });

    it("should show alert on verification error", async () => {
      mockedApiService.request.mockRejectedValueOnce(new Error("Invalid code"));

      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setVerificationToken("wrong");
      });

      await act(async () => {
        await result.current.handleVerifyEmail();
      });

      expect(Alert.alert).toHaveBeenCalledWith("Error", "Invalid code");
    });
  });

  describe("state setters", () => {
    it("should update displayName", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setDisplayName("New Name");
      });

      expect(result.current.displayName).toBe("New Name");
    });

    it("should update verificationToken", () => {
      const { result } = renderHook(() =>
        useOnboarding(mockUser, mockOnComplete),
      );

      act(() => {
        result.current.setVerificationToken("123456");
      });

      expect(result.current.verificationToken).toBe("123456");
    });
  });
});
