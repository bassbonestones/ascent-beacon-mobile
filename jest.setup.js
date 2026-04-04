/**
 * Jest setup file for React Native Testing Library
 */

import "@testing-library/react-native/extend-expect";

// Silence the warning: Animated: `useNativeDriver` is not supported
// Disabled: path varies by RN version
// jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      apiUrl: "http://localhost:8000",
    },
  },
}));

// Mock @react-navigation/native
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Global test timeout
jest.setTimeout(10000);
