import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useFetchOnFocus } from "../useFetchOnFocus";

// Mock useFocusEffect
const mockFocusCallback = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback.mockImplementation(callback);
    // Simulate initial focus
    callback();
  },
}));

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useFetchOnFocus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct default state", async () => {
    const fetchFn = jest.fn(() => Promise.resolve("data"));
    const { result } = renderHook(() =>
      useFetchOnFocus(fetchFn, { loadOnMount: false, reloadOnFocus: false }),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should use initialData when provided", async () => {
    const fetchFn = jest.fn(() => Promise.resolve("new data"));
    const { result } = renderHook(() =>
      useFetchOnFocus(fetchFn, {
        loadOnMount: false,
        reloadOnFocus: false,
        initialData: "initial",
      }),
    );

    expect(result.current.data).toBe("initial");
  });

  it("should fetch data on mount when loadOnMount is true", async () => {
    const fetchFn = jest.fn(() => Promise.resolve("fetched data"));
    const { result } = renderHook(() =>
      useFetchOnFocus(fetchFn, { reloadOnFocus: false }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchFn).toHaveBeenCalled();
    expect(result.current.data).toBe("fetched data");
  });

  it("should not fetch on mount when loadOnMount is false", async () => {
    const fetchFn = jest.fn(() => Promise.resolve("data"));
    renderHook(() =>
      useFetchOnFocus(fetchFn, { loadOnMount: false, reloadOnFocus: false }),
    );

    // Give time for potential fetch
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("should set loading state during fetch", async () => {
    let resolvePromise: (value: string) => void;
    const fetchFn = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useFetchOnFocus(fetchFn, { reloadOnFocus: false }),
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!("data");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle errors and set error state", async () => {
    const error = new Error("Fetch failed");
    const fetchFn = jest.fn(() => Promise.reject(error));
    const { result } = renderHook(() =>
      useFetchOnFocus(fetchFn, {
        showAlert: false,
        reloadOnFocus: false,
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeNull();
  });

  it("should show alert on error when showAlert is true", async () => {
    const fetchFn = jest.fn(() => Promise.reject(new Error("Test error")));
    renderHook(() =>
      useFetchOnFocus(fetchFn, {
        showAlert: true,
        errorTitle: "Custom Error",
        reloadOnFocus: false,
      }),
    );

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Custom Error", "Test error");
    });
  });

  it("should not show alert when showAlert is false", async () => {
    const fetchFn = jest.fn(() => Promise.reject(new Error("Test error")));
    renderHook(() =>
      useFetchOnFocus(fetchFn, {
        showAlert: false,
        reloadOnFocus: false,
      }),
    );

    await waitFor(() => {});
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("should reload data when reload is called", async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    const { result } = renderHook(() =>
      useFetchOnFocus(fetchFn, { reloadOnFocus: false }),
    );

    await waitFor(() => {
      expect(result.current.data).toBe("first");
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.data).toBe("second");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("should return correct types", async () => {
    const fetchFn = jest.fn(() => Promise.resolve({ items: [1, 2, 3] }));
    const { result } = renderHook(() =>
      useFetchOnFocus(fetchFn, { reloadOnFocus: false }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.reload).toBe("function");
    expect(result.current.data).toEqual({ items: [1, 2, 3] });
  });
});
