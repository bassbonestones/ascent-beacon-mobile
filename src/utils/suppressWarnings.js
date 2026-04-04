/**
 * Suppress known deprecation warnings from react-native-web internals.
 * Must be imported before any React Native imports.
 */
import { Platform } from "react-native";

if (Platform.OS === "web") {
  const originalWarn = console.warn;
  const originalError = console.error;

  const suppressPatterns = [
    "props.pointerEvents is deprecated",
    "useNativeDriver",
    "Cross-Origin-Opener-Policy",
  ];

  const shouldSuppress = (message) =>
    typeof message === "string" &&
    suppressPatterns.some((pattern) => message.includes(pattern));

  console.warn = (...args) => {
    if (shouldSuppress(args[0])) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    if (shouldSuppress(args[0])) return;
    originalError.apply(console, args);
  };
}
