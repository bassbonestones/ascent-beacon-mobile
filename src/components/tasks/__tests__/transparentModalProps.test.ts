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
  });

  it("does not set presentationStyle on android", () => {
    Platform.OS = "android";
    expect(transparentModalProps().presentationStyle).toBeUndefined();
  });

  it("does not set presentationStyle on web", () => {
    Platform.OS = "web";
    expect(transparentModalProps().presentationStyle).toBeUndefined();
  });

  it("sets statusBarTranslucent on Android", () => {
    Platform.OS = "android";
    expect(transparentModalProps().statusBarTranslucent).toBe(true);
  });

  it("does not set statusBarTranslucent on iOS", () => {
    Platform.OS = "ios";
    expect(transparentModalProps().statusBarTranslucent).toBeUndefined();
  });

  it("does not set statusBarTranslucent on web", () => {
    Platform.OS = "web";
    expect(transparentModalProps().statusBarTranslucent).toBeUndefined();
  });
});
