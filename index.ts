// RNGH must be first (React Navigation / touch pipeline). Reanimated immediately after.
// See https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
import "react-native-gesture-handler";
import "react-native-reanimated";

import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
