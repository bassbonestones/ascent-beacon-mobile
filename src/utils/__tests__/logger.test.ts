import { logError, logWarn, logInfo } from "../logger";

describe("logger", () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe("logError", () => {
    it("logs error message in dev mode", () => {
      logError("Test error");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test error", undefined);
    });

    it("logs error with error object", () => {
      const error = new Error("Something went wrong");
      logError("Failed", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed", error);
    });
  });

  describe("logWarn", () => {
    it("logs warning message in dev mode", () => {
      logWarn("Test warning");
      expect(consoleWarnSpy).toHaveBeenCalledWith("Test warning", undefined);
    });

    it("logs warning with data", () => {
      const data = { userId: "123" };
      logWarn("Warning occurred", data);
      expect(consoleWarnSpy).toHaveBeenCalledWith("Warning occurred", data);
    });
  });

  describe("logInfo", () => {
    it("logs info message in dev mode", () => {
      logInfo("Test info");
      expect(consoleLogSpy).toHaveBeenCalledWith("Test info", undefined);
    });

    it("logs info with data", () => {
      const data = { action: "login" };
      logInfo("User action", data);
      expect(consoleLogSpy).toHaveBeenCalledWith("User action", data);
    });
  });
});
