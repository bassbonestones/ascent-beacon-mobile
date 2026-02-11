import { Platform } from "react-native";

// API Configuration
// For physical devices, use local network IP instead of localhost
const DEV_API_URL =
  Platform.OS === "web" ? "http://localhost:8000" : "http://192.168.1.19:8000";

export const API_URL = __DEV__ ? DEV_API_URL : "https://api.ascentbeacon.app";

// Google OAuth Configuration
// For Expo, use Web client ID (works on all platforms in development)
export const GOOGLE_CLIENT_ID =
  "811836749818-cltmu11jnejul67ivndch68dqjka1a4e.apps.googleusercontent.com";
