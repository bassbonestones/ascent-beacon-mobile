/**
 * Cross-platform alert utilities that work on iOS, Android, and Web.
 *
 * React Native's Alert.alert() doesn't work on web, so we provide
 * platform-aware wrappers that use window.alert/confirm on web.
 */
import { Alert, Platform } from "react-native";

type AlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: "default" | "cancel" | "destructive";
};

/**
 * Show a simple alert message (OK button only).
 * Uses window.alert on web, Alert.alert on native.
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Show a confirmation dialog with OK/Cancel.
 * Returns a promise that resolves to true if confirmed, false if cancelled.
 * Uses window.confirm on web, Alert.alert on native.
 */
export function showConfirm(title: string, message?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === "web") {
      const result = window.confirm(message ? `${title}\n\n${message}` : title);
      resolve(result);
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "OK", onPress: () => resolve(true) },
      ]);
    }
  });
}

/**
 * Show an alert with custom buttons.
 * On web, falls back to confirm for 2 buttons or alert for 1 button.
 * For complex multi-button scenarios on web, consider using a modal instead.
 */
export function showAlertWithButtons(
  title: string,
  message: string | undefined,
  buttons: AlertButton[],
): void {
  if (Platform.OS === "web") {
    // Web fallback: use confirm for 2 buttons, alert for 1
    if (buttons.length === 1) {
      window.alert(message ? `${title}\n\n${message}` : title);
      buttons[0].onPress?.();
    } else if (buttons.length === 2) {
      // Assume first is cancel, second is confirm
      const cancelBtn = buttons.find((b) => b.style === "cancel") || buttons[0];
      const confirmBtn =
        buttons.find((b) => b.style !== "cancel") || buttons[1];
      const result = window.confirm(message ? `${title}\n\n${message}` : title);
      if (result) {
        confirmBtn.onPress?.();
      } else {
        cancelBtn.onPress?.();
      }
    } else {
      // For 3+ buttons, just show alert and trigger first non-cancel button
      window.alert(message ? `${title}\n\n${message}` : title);
      const confirmBtn = buttons.find((b) => b.style !== "cancel");
      confirmBtn?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
