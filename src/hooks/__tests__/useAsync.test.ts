import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useAsync, useLoadData } from "../useAsync";

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useAsync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct default state", () => {
    const asyncFn = jest.fn();
    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("should set loading true during execution", async () => {
    let resolvePromise: (value: string) => void;
    const asyncFn = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        }),
    );
    const { result } = renderHook(() => useAsync(asyncFn));

    let executePromise: Promise<string | null>;
    act(() => {
      executePromise = result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!("result");
      await executePromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it("should set data on successful execution", async () => {
    const asyncFn = jest.fn(() => Promise.resolve({ id: 1, name: "test" }));
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual({ id: 1, name: "test" });
    expect(result.current.error).toBeNull();
  });

  it("should set error on failed execution", async () => {
    const error = new Error("Test error");
    const asyncFn = jest.fn(() => Promise.reject(error));
    const { result } = renderHook(() =>
      useAsync(asyncFn, { showAlert: false }),
    );

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeNull();
  });

  it("should show alert on error when showAlert is true", async () => {
    const error = new Error("Test error message");
    const asyncFn = jest.fn(() => Promise.reject(error));
    const { result } = renderHook(() =>
      useAsync(asyncFn, { showAlert: true, errorTitle: "Custom Title" }),
    );

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // Expected
      }
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Custom Title",
      "Test error message",
    );
  });

  it("should not show alert when showAlert is false", async () => {
    const asyncFn = jest.fn(() => Promise.reject(new Error("Test error")));
    const { result } = renderHook(() =>
      useAsync(asyncFn, { showAlert: false }),
    );

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // Expected
      }
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("should call onSuccess callback on success", async () => {
    const onSuccess = jest.fn();
    const asyncFn = jest.fn(() => Promise.resolve("success"));
    const { result } = renderHook(() => useAsync(asyncFn, { onSuccess }));

    await act(async () => {
      await result.current.execute();
    });

    expect(onSuccess).toHaveBeenCalledWith("success");
  });

  it("should call onError callback on failure", async () => {
    const onError = jest.fn();
    const error = new Error("Test error");
    const asyncFn = jest.fn(() => Promise.reject(error));
    const { result } = renderHook(() =>
      useAsync(asyncFn, { onError, showAlert: false }),
    );

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // Expected
      }
    });

    expect(onError).toHaveBeenCalledWith(error);
  });

  it("should pass arguments to async function", async () => {
    const asyncFn = jest.fn((a: number, b: number) => Promise.resolve(a + b));
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute(1, 2);
    });

    expect(asyncFn).toHaveBeenCalledWith(1, 2);
    expect(result.current.data).toBe(3);
  });

  it("should reset state correctly", async () => {
    const asyncFn = jest.fn(() => Promise.resolve("data"));
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe("data");

    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });
});

describe("useLoadData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading, error, data, and reload", () => {
    const loadFn = jest.fn(() => Promise.resolve([]));
    const { result } = renderHook(() => useLoadData(loadFn));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
    expect(typeof result.current.reload).toBe("function");
  });

  it("should reload data when reload is called", async () => {
    const loadFn = jest.fn(() => Promise.resolve([1, 2, 3]));
    const { result } = renderHook(() => useLoadData(loadFn));

    await act(async () => {
      await result.current.reload();
    });

    expect(loadFn).toHaveBeenCalled();
    expect(result.current.data).toEqual([1, 2, 3]);
  });
});
