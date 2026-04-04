/**
 * Suppress known deprecation warnings from react-native-web internals.
 * Must be imported before any React Native imports.
 */
import { Platform } from "react-native";

if (Platform.OS === "web") {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  const suppressPatterns = [
    "props.pointerEvents is deprecated",
    "useNativeDriver",
    "Cross-Origin-Opener-Policy",
    // Shadow style deprecation warnings - we use native shadow props for cross-platform compatibility
    '"textShadow*" style props are deprecated',
    '"shadow*" style props are deprecated',
  ];

  const shouldSuppress = (message: unknown): boolean =>
    typeof message === "string" &&
    suppressPatterns.some((pattern) => message.includes(pattern));

  console.log = (...args: unknown[]): void => {
    if (shouldSuppress(args[0])) return;
    originalLog.apply(console, args);
  };

  console.warn = (...args: unknown[]): void => {
    if (shouldSuppress(args[0])) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args: unknown[]): void => {
    if (shouldSuppress(args[0])) return;
    originalError.apply(console, args);
  };
}
