# Pee Diary

A premium, modern mobile app for tracking urination, fluid intake, and leakage events. Built with Expo and React Native, following best practices for performance and user experience.

## Features

- **Quick Logging**: Track urination, fluid intake, and leaks in under 10 seconds
- **Multi-language Support**: English, Spanish, and Portuguese
- **Offline-First**: All data stored locally on device
- **Beautiful UI**: Premium design with smooth animations and haptic feedback
- **Export Data**: Export your diary as CSV for sharing with healthcare providers

## Tech Stack

- **Framework**: Expo SDK 54 with React Native 0.81
- **Styling**: NativeWind v4 (TailwindCSS for React Native)
- **UI Components**: react-native-reusables (shadcn/ui equivalent)
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: Expo Router with native tabs
- **Animations**: React Native Reanimated with GestureHandler
- **Lists**: LegendList for high-performance virtualized lists
- **Menus**: Zeego for native dropdown menus
- **Forms**: React Hook Form with Zod validation
- **i18n**: expo-localization + i18n-js

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/pee-diary.git
cd pee-diary

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan QR code with Expo Go app

## Project Structure

```
app/                    # Expo Router pages
  (tabs)/              # Bottom tab navigation
    index.tsx          # Home - Today's timeline
    history.tsx        # History - Calendar view
    settings.tsx       # Settings - Language, export, clear data
  add/                 # Entry form modals
    urination.tsx
    fluid.tsx
    leak.tsx

components/
  ui/                  # Design system (react-native-reusables style)
  diary/               # App-specific components

lib/
  i18n/                # Internationalization
  store/               # Zustand state management
  theme/               # Color tokens and utilities
  utils/               # Helper functions
```

## Design System

Based on the Eleva Care brand colors:

- **Primary**: Deep Teal (#006D77) - Calming, medical, trustworthy
- **Secondary**: Soft Coral (#E29578) - Warm, approachable
- **Accent**: Pale Lavender (#E0FBFC) - Fresh, clean

## Performance Optimizations

Following React Native best practices:

- LegendList with `getItemType` for heterogeneous lists
- Zustand selectors for granular state subscriptions
- GestureDetector for animated press states
- Hoisted Intl formatters for date/number formatting
- Memoized list items
- Native navigation and modals

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private - Eleva Care

## Acknowledgments

- [Expo](https://expo.dev)
- [NativeWind](https://nativewind.dev)
- [react-native-reusables](https://rnr-docs.vercel.app)
- [Zustand](https://zustand-demo.pmnd.rs)
