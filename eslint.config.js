// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // CRITICAL: Prevent crashes from && with falsy values in React Native
    // See: vercel-react-native-skills/rules/rendering-no-falsy-and.md
    rules: {
      'react/jsx-no-leaked-render': [
        'error',
        { validStrategies: ['ternary', 'coerce'] },
      ],
    },
  },
]);
