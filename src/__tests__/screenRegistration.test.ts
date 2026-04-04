/**
 * Screen Registration Test
 *
 * Ensures all screen files are properly registered in App.tsx.
 * This prevents the bug where a screen is created but never wired into navigation.
 *
 * If a new screen intentionally doesn't need registration (e.g., it's used as
 * a sub-component of another screen), add it to the EXCLUDED_SCREENS array below.
 */

// @ts-expect-error - Node.js imports only work in Jest environment
import * as fs from "fs";
// @ts-expect-error - Node.js imports only work in Jest environment
import * as path from "path";

// Screens that don't need direct registration in App.tsx
// Add a comment explaining why each is excluded
const EXCLUDED_SCREENS = [
  "HomeScreen.tsx", // Deprecated - replaced by DashboardScreen
  "ValuesManagement.tsx", // Sub-component used inside ValuesDiscovery
];

describe("Screen Registration", () => {
  // @ts-expect-error - __dirname only available in Jest/Node environment
  const screensDir = path.join(__dirname, "../screens");
  // @ts-expect-error - __dirname only available in Jest/Node environment
  const appTsxPath = path.join(__dirname, "../../App.tsx");

  it("App.tsx should exist", () => {
    expect(fs.existsSync(appTsxPath)).toBe(true);
  });

  it("all screen files should be registered in App.tsx", () => {
    const appTsxContent = fs.readFileSync(appTsxPath, "utf-8");

    // Get all screen files (ending in Screen.tsx or .tsx files that are screens)
    const screenFiles = fs.readdirSync(screensDir).filter((file: string) => {
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

      // Check if imported in App.tsx
      // Match patterns like: import ScreenName from or import { ScreenName }
      const importPattern = new RegExp(
        `import\\s+(?:{[^}]*)?${screenName}(?:[^}]*})?\\s+from`,
      );
      const isImported = importPattern.test(appTsxContent);

      if (!isImported) {
        unregisteredScreens.push(`${screenFile} - NOT IMPORTED`);
        continue;
      }

      // Check if registered in Stack.Navigator
      // Match patterns like: <Stack.Screen name="ScreenName" or component={ScreenName}
      const registrationPattern = new RegExp(
        `Stack\\.Screen[^>]*(?:name=["']${screenName}["']|component=\\{${screenName}\\})`,
      );
      const isRegistered = registrationPattern.test(appTsxContent);

      // Also check for inline render pattern: <ScreenName
      const inlinePattern = new RegExp(`<${screenName}[\\s/>]`);
      const hasInlineRender = inlinePattern.test(appTsxContent);

      if (!isRegistered && !hasInlineRender) {
        unregisteredScreens.push(`${screenFile} - IMPORTED but NOT REGISTERED`);
      }
    }

    if (unregisteredScreens.length > 0) {
      fail(
        `Found unregistered screens in App.tsx:\n${unregisteredScreens.join("\n")}\n\n` +
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
