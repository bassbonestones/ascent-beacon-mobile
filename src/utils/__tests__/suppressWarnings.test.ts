/**
 * Tests for suppressWarnings utility.
 * Note: This module patches console methods on web platform.
 * Testing is limited because the module is auto-executed on import.
 */

describe("suppressWarnings", () => {
  it("module can be imported without errors", () => {
    // The module is already imported in the test environment
    // This test verifies it doesn't crash on import
    expect(() => require("../suppressWarnings")).not.toThrow();
  });

  it("console.log still works after import", () => {
    require("../suppressWarnings");
    
    // Should not throw
    const originalLog = console.log;
    expect(() => console.log("test message")).not.toThrow();
  });

  it("console.warn still works after import", () => {
    require("../suppressWarnings");
    
    // Should not throw
    expect(() => console.warn("test warning")).not.toThrow();
  });

  it("console.error still works after import", () => {
    require("../suppressWarnings");
    
    // Should not throw
    expect(() => console.error("test error")).not.toThrow();
  });
});
