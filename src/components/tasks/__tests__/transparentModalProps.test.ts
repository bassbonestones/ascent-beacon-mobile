import { Platform } from "react-native";
import { transparentModalProps } from "../transparentModalProps";

describe("transparentModalProps", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it("always sets transparent true", () => {
    Platform.OS = "web";
    expect(transparentModalProps().transparent).toBe(true);
  });

  it("sets presentationStyle on iOS only", () => {
    Platform.OS = "ios";
    expect(transparentModalProps().presentationStyle).toBe("overFullScreen");
    Platform.OS = "android";
    expect(transparentModalProps().presentationStyle).toBeUndefined();
    Platform.OS = "web";
    expect(transparentModalProps().presentationStyle).toBeUndefined();
  });

  it("sets statusBarTranslucent on Android only", () => {
    Platform.OS = "android";
    expect(transparentModalProps().statusBarTranslucent).toBe(true);
    Platform.OS = "ios";
    expect(transparentModalProps().statusBarTranslucent).toBeUndefined();
  });
});
