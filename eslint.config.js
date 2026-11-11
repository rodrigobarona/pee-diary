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
      // New in the SDK 57 lint preset. The existing hydration and
      // load-on-mount effects trip it; they are reported, not blocking,
      // until each one is reworked on its own.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['jest.setup.js', '__tests__/**'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
]);
