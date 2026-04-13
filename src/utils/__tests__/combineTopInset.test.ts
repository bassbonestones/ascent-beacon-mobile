import { Platform, StatusBar } from "react-native";
import Constants from "expo-constants";
import { combineTopInset } from "../combineTopInset";

describe("combineTopInset", () => {
  const orig = Platform.OS;

  afterEach(() => {
    Platform.OS = orig;
  });

  it("returns safe value on web", () => {
    Platform.OS = "web";
    expect(combineTopInset(0)).toBe(0);
    expect(combineTopInset(12)).toBe(12);
  });

  it("returns max of safe area and ios fallback when constants missing", () => {
    Platform.OS = "ios";
    Object.defineProperty(Constants, "statusBarHeight", {
      value: 0,
      configurable: true,
    });
    expect(combineTopInset(10)).toBe(47);
    expect(combineTopInset(56)).toBe(56);
  });

  it("returns max of safe area and android status bar height", () => {
    Platform.OS = "android";
    Object.defineProperty(StatusBar, "currentHeight", {
      value: 24,
      configurable: true,
    });
    expect(combineTopInset(10)).toBe(24);
    expect(combineTopInset(30)).toBe(30);
  });
});
