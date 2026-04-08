/**
 * Tests for useTimezone hook.
 */
import { renderHook, act } from "@testing-library/react-native";
import { useTimezone } from "../useTimezone";
import { useTime } from "../../context/TimeContext";

jest.mock("../../context/TimeContext");

const mockedUseTime = jest.mocked(useTime);

describe("useTimezone", () => {
  const mockSetTimezone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns undefined timezone when no override is set", () => {
    mockedUseTime.mockReturnValue({
      overrideTimezone: null,
      setTimezone: mockSetTimezone,
    } as any);

    const { result } = renderHook(() => useTimezone());

    expect(result.current.timezone).toBeUndefined();
    expect(result.current.hasOverride).toBe(false);
  });

  it("returns timezone when override is set", () => {
    mockedUseTime.mockReturnValue({
      overrideTimezone: "America/Los_Angeles",
      setTimezone: mockSetTimezone,
    } as any);

    const { result } = renderHook(() => useTimezone());

    expect(result.current.timezone).toBe("America/Los_Angeles");
    expect(result.current.hasOverride).toBe(true);
  });

  it("provides setTimezone function", () => {
    mockedUseTime.mockReturnValue({
      overrideTimezone: null,
      setTimezone: mockSetTimezone,
    } as any);

    const { result } = renderHook(() => useTimezone());

    result.current.setTimezone("Europe/London");
    expect(mockSetTimezone).toHaveBeenCalledWith("Europe/London");
  });

  it("can reset timezone by passing null", () => {
    mockedUseTime.mockReturnValue({
      overrideTimezone: "Asia/Tokyo",
      setTimezone: mockSetTimezone,
    } as any);

    const { result } = renderHook(() => useTimezone());

    result.current.setTimezone(null);
    expect(mockSetTimezone).toHaveBeenCalledWith(null);
  });
});
