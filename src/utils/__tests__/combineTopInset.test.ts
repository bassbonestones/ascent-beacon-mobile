import { Platform } from "react-native";
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
});
