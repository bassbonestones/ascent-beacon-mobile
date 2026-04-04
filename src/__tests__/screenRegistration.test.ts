/**
 * Screen Registration Test
 *
 * Ensures all screen files are properly registered in App.js.
 * This prevents the bug where a screen is created but never wired into navigation.
 *
 * If a new screen intentionally doesn't need registration (e.g., it's used as
 * a sub-component of another screen), add it to the EXCLUDED_SCREENS array below.
 */

import * as fs from "fs";
import * as path from "path";

// Screens that don't need direct registration in App.js
// Add a comment explaining why each is excluded
const EXCLUDED_SCREENS = [
  "HomeScreen.tsx", // Deprecated - replaced by DashboardScreen
  "ValuesManagement.tsx", // Sub-component used inside ValuesDiscovery
];

describe("Screen Registration", () => {
  const screensDir = path.join(__dirname, "../screens");
  const appJsPath = path.join(__dirname, "../../App.js");

  it("App.js should exist", () => {
    expect(fs.existsSync(appJsPath)).toBe(true);
  });

  it("all screen files should be registered in App.js", () => {
    const appJsContent = fs.readFileSync(appJsPath, "utf-8");

    // Get all screen files (ending in Screen.tsx or .tsx files that are screens)
    const screenFiles = fs.readdirSync(screensDir).filter((file) => {
      // Only .tsx files, not directories or test files
      if (!file.endsWith(".tsx")) return false;
      if (file.includes(".test.")) return false;
      return true;
    });

    const unregisteredScreens: string[] = [];

    for (const screenFile of screenFiles) {
      // Skip excluded screens
      if (EXCLUDED_SCREENS.includes(screenFile)) {
        continue;
      }

      // Get the import name (strip .tsx extension)
      const screenName = screenFile.replace(".tsx", "");

      // Check if imported in App.js
      // Match patterns like: import ScreenName from or import { ScreenName }
      const importPattern = new RegExp(
        `import\\s+(?:{[^}]*)?${screenName}(?:[^}]*})?\\s+from`,
      );
      const isImported = importPattern.test(appJsContent);

      if (!isImported) {
        unregisteredScreens.push(`${screenFile} - NOT IMPORTED`);
        continue;
      }

      // Check if registered in Stack.Navigator
      // Match patterns like: <Stack.Screen name="ScreenName" or component={ScreenName}
      const registrationPattern = new RegExp(
        `Stack\\.Screen[^>]*(?:name=["']${screenName}["']|component=\\{${screenName}\\})`,
      );
      const isRegistered = registrationPattern.test(appJsContent);

      // Also check for inline render pattern: <ScreenName
      const inlinePattern = new RegExp(`<${screenName}[\\s/>]`);
      const hasInlineRender = inlinePattern.test(appJsContent);

      if (!isRegistered && !hasInlineRender) {
        unregisteredScreens.push(`${screenFile} - IMPORTED but NOT REGISTERED`);
      }
    }

    if (unregisteredScreens.length > 0) {
      fail(
        `Found unregistered screens in App.js:\n${unregisteredScreens.join("\n")}\n\n` +
          `If a screen should NOT be registered (e.g., sub-component), add it to EXCLUDED_SCREENS in this test file.`,
      );
    }
  });

  it("EXCLUDED_SCREENS should only contain files that exist", () => {
    const screenFiles = fs.readdirSync(screensDir);

    for (const excluded of EXCLUDED_SCREENS) {
      if (!screenFiles.includes(excluded)) {
        fail(
          `EXCLUDED_SCREENS contains "${excluded}" but this file does not exist in src/screens/. ` +
            `Please remove it from the exclusion list.`,
        );
      }
    }
  });
});
