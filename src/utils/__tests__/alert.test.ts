import { Platform, Alert } from "react-native";
import { showAlert, showConfirm, showAlertWithButtons } from "../alert";

// Mock Platform.OS
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
  Alert: {
    alert: jest.fn(),
  },
}));

describe("alert utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("showAlert", () => {
    it("calls Alert.alert on native", () => {
      showAlert("Test Title", "Test Message");
      expect(Alert.alert).toHaveBeenCalledWith("Test Title", "Test Message");
    });

    it("calls Alert.alert with title only", () => {
      showAlert("Title Only");
      expect(Alert.alert).toHaveBeenCalledWith("Title Only", undefined);
    });
  });

  describe("showConfirm", () => {
    it("calls Alert.alert on native and resolves true when OK pressed", async () => {
      const promise = showConfirm("Confirm Title", "Confirm Message");

      // Get the buttons array from the Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      expect(alertCall[0]).toBe("Confirm Title");
      expect(alertCall[1]).toBe("Confirm Message");

      // Simulate pressing OK
      const buttons = alertCall[2];
      const okButton = buttons.find((b: { text: string }) => b.text === "OK");
      okButton.onPress();

      await expect(promise).resolves.toBe(true);
    });

    it("resolves false when Cancel pressed", async () => {
      const promise = showConfirm("Confirm", "Message");

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const cancelButton = buttons.find(
        (b: { text: string }) => b.text === "Cancel",
      );
      cancelButton.onPress();

      await expect(promise).resolves.toBe(false);
    });
  });

  describe("showAlertWithButtons", () => {
    it("calls Alert.alert with custom buttons on native", () => {
      const buttons = [
        { text: "Cancel", style: "cancel" as const, onPress: jest.fn() },
        { text: "Delete", style: "destructive" as const, onPress: jest.fn() },
      ];

      showAlertWithButtons("Title", "Message", buttons);

      expect(Alert.alert).toHaveBeenCalledWith("Title", "Message", buttons);
    });
  });
});

describe("alert utilities on web", () => {
  const originalPlatformOS = Platform.OS;

  beforeAll(() => {
    (Platform as { OS: string }).OS = "web";
    // @ts-expect-error - mock window.alert
    global.window = {
      alert: jest.fn(),
      confirm: jest.fn(() => true),
    };
  });

  afterAll(() => {
    (Platform as { OS: string }).OS = originalPlatformOS;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("showAlert uses window.alert on web", () => {
    showAlert("Web Title", "Web Message");
    expect(window.alert).toHaveBeenCalledWith("Web Title\n\nWeb Message");
  });

  it("showAlert uses window.alert with title only on web", () => {
    showAlert("Title Only");
    expect(window.alert).toHaveBeenCalledWith("Title Only");
  });

  it("showConfirm returns true when confirmed on web", async () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(true);
    const result = await showConfirm("Confirm?", "Are you sure?");
    expect(window.confirm).toHaveBeenCalledWith("Confirm?\n\nAre you sure?");
    expect(result).toBe(true);
  });

  it("showConfirm returns false when cancelled on web", async () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    const result = await showConfirm("Confirm?");
    expect(window.confirm).toHaveBeenCalledWith("Confirm?");
    expect(result).toBe(false);
  });

  it("showAlertWithButtons with 1 button uses window.alert on web", () => {
    const onPress = jest.fn();
    showAlertWithButtons("Title", "Message", [{ text: "OK", onPress }]);
    expect(window.alert).toHaveBeenCalledWith("Title\n\nMessage");
    expect(onPress).toHaveBeenCalled();
  });

  it("showAlertWithButtons with 2 buttons uses window.confirm on web", () => {
    const cancelPress = jest.fn();
    const confirmPress = jest.fn();
    (window.confirm as jest.Mock).mockReturnValueOnce(true);
    showAlertWithButtons("Title", "Message", [
      { text: "Cancel", style: "cancel", onPress: cancelPress },
      { text: "OK", onPress: confirmPress },
    ]);
    expect(window.confirm).toHaveBeenCalledWith("Title\n\nMessage");
    expect(confirmPress).toHaveBeenCalled();
    expect(cancelPress).not.toHaveBeenCalled();
  });

  it("showAlertWithButtons with 2 buttons calls cancel on reject", () => {
    const cancelPress = jest.fn();
    const confirmPress = jest.fn();
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    showAlertWithButtons("Title", "Message", [
      { text: "Cancel", style: "cancel", onPress: cancelPress },
      { text: "OK", onPress: confirmPress },
    ]);
    expect(cancelPress).toHaveBeenCalled();
    expect(confirmPress).not.toHaveBeenCalled();
  });

  it("showAlertWithButtons with 3+ buttons uses window.alert on web", () => {
    const onPress1 = jest.fn();
    const onPress2 = jest.fn();
    const onPress3 = jest.fn();
    showAlertWithButtons("Title", undefined, [
      { text: "Cancel", style: "cancel", onPress: onPress1 },
      { text: "Option 1", onPress: onPress2 },
      { text: "Option 2", onPress: onPress3 },
    ]);
    expect(window.alert).toHaveBeenCalledWith("Title");
    expect(onPress2).toHaveBeenCalled(); // First non-cancel button
  });
});
