module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4: `babel-preset-expo` injects `react-native-worklets/plugin` when
    // `react-native-worklets` is installed. Do NOT also add `react-native-reanimated/plugin`
    // here — it is the same plugin (re-export) and running it twice breaks worklets/JSI.
  };
};
