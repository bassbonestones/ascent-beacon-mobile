import { Platform, StatusBar } from "react-native";
import Constants from "expo-constants";

/**
 * Top inset for full-screen headers when `useSafeAreaInsets().top` is 0 (seen with
 * `headerShown: false` stacks) while `Constants.statusBarHeight` still reflects the
 * status bar / notch / Dynamic Island region on iOS.
 */
export function combineTopInset(safeAreaTop: number): number {
  if (Platform.OS === "web") {
    return safeAreaTop;
  }
  if (Platform.OS === "ios") {
    const fromConstants =
      typeof Constants.statusBarHeight === "number" &&
      Constants.statusBarHeight > 0
        ? Constants.statusBarHeight
        : 0;
    return Math.max(safeAreaTop, fromConstants > 0 ? fromConstants : 47);
  }
  return Math.max(safeAreaTop, StatusBar.currentHeight ?? 0);
}
