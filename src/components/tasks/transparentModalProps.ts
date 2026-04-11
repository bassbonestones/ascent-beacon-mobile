import { Platform } from "react-native";

/**
 * Extra props for React Native `Modal` when using a translucent scrim so
 * iOS/Android/Web behave the same (iOS defaults to page sheet otherwise).
 */
export function transparentModalProps(): {
  transparent: true;
  presentationStyle?: "overFullScreen";
  statusBarTranslucent?: boolean;
} {
  return {
    transparent: true,
    ...(Platform.OS === "ios"
      ? { presentationStyle: "overFullScreen" as const }
      : {}),
    ...(Platform.OS === "android" ? { statusBarTranslucent: true } : {}),
  };
}
