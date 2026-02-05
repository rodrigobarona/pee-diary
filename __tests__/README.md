# Testing Infrastructure

This project uses Jest with jest-expo for testing.

## Current Status

There is a known compatibility issue between jest-expo and Expo SDK 54's winter runtime that causes tests to fail. See [expo/expo#37261](https://github.com/expo/expo/issues/37261) for updates.

Once this is resolved, the testing infrastructure is ready:

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `__tests__/` - Test files
  - `lib/store/` - Store tests
- `jest.setup.js` - Test setup and mocks

## Writing Tests

Example test for a Zustand store:

```typescript
import { useDiaryStore } from "@/lib/store";
import { act } from "react";

describe("DiaryStore", () => {
  beforeEach(() => {
    act(() => {
      useDiaryStore.getState().clearAllEntries();
    });
  });

  it("should add an entry", () => {
    const { addUrinationEntry } = useDiaryStore.getState();

    act(() => {
      addUrinationEntry({
        volume: "medium",
        urgency: 3,
        hadLeak: false,
        hadPain: false,
      });
    });

    expect(useDiaryStore.getState().entries).toHaveLength(1);
  });
});
```

## Mocking

Common mocks are set up in `jest.setup.js`:

- `@react-native-async-storage/async-storage`
- `expo-localization`
- `expo-haptics`

Add additional mocks as needed for your tests.
