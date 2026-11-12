# Eleva Diary

A private bladder diary for iPhone and Android, by Eleva.care. People write down their bathroom visits, drinks and leaks, and can share the record with their doctor, nurse or physiotherapist as a PDF, CSV or JSON file.

Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. It never interprets entries, shows normal ranges or gives health advice.

## What the app does

- **Bathroom visits:** time, size (small, medium or large) or an exact amount in ml, urgency from 1 to 5, leak and pain, notes
- **Drinks:** time, type and amount
- **Leaks:** time, amount, urgency, activity and notes
- **Today:** the day's totals, an optional fluid target the user sets themselves (none by default), weekly and monthly charts of what was logged, and the medical disclaimer under them
- **History:** a calendar of the days with entries; any entry can be edited (with its edit history) or deleted
- **Export:** a PDF report in the usual paper-diary layout, a CSV in the user's language, or JSON, for a chosen date range
- **Backup:** a backup file the user saves and imports themselves (no cloud, no account)
- **Reminders:** optional local reminders, with quiet hours
- **Languages:** English, European Portuguese (pt-PT) and Spain Spanish (es-ES)

## Privacy

- Everything stays on the phone: no account, no analytics, no crash reporting, no network requests
- Export and backup files are written to the cache folder and removed at the next launch or export
- Settings > Clear All Data deletes the diary, goals, reminders and every file the app wrote
- Store answers: App Store "Data Not Collected"; Google Play Data safety "No data collected / No data shared"

Store listings, review notes and the release checklist are in `_docs/app-stores/`; the mapping of app behaviour to the legal texts is in `_docs/compliance/`. The legal pages are published at https://diary.eleva.care.

## Tech Stack

| Category                 | Technology                                     |
| ------------------------ | ---------------------------------------------- |
| **Framework**            | Expo SDK 57 with React Native 0.86             |
| **Styling**              | NativeWind v5 RC with Tailwind CSS 4           |
| **State Management**     | Zustand with AsyncStorage persistence          |
| **Navigation**           | Expo Router (stack, tabs and form sheets)      |
| **Animations**           | React Native Reanimated + Gesture Handler      |
| **Validation**           | Zod schemas for type-safe data                 |
| **Internationalization** | expo-localization + i18n-js                    |

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 11 (`corepack enable`, or see pnpm.io/installation)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/rodrigobarona/pee-diary.git
cd pee-diary

# Install dependencies
pnpm install

# Start the development server
pnpm start
```

### Running the App

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: a development build with `expo-dev-client` (`npx eas-cli@latest build --profile development`, or `npx expo run:ios` / `run:android` locally), then `pnpm start`. The dev client is left out of production builds.

### Tests and checks

```bash
pnpm test        # Jest
pnpm lint        # ESLint
pnpm exec tsc --noEmit
npx expo-doctor
```

### Store builds

```bash
npx eas-cli@latest build --profile production --platform all   # App Store and Google Play builds
npx eas-cli@latest submit --profile production --platform ios
npx eas-cli@latest submit --profile production --platform android  # needs secrets/play-service-account.json
```

Store screenshots: `e2e/walkthrough/run.sh` records the app on a simulator or emulator, and `e2e/walkthrough/store-screenshots.py` turns the captures into the sizes each store accepts (see `_docs/app-stores/assets-checklist.md`).

## Project Structure

```
app/                         # Expo Router screens
├── (onboarding)/welcome.tsx # First-run pages and Terms acceptance
├── (tabs)/(today)/          # Today: totals, charts
├── (tabs)/history/          # History: calendar and entries
├── (modals)/add/            # Log a bathroom visit, drink or leak
├── (modals)/entry/[id].tsx  # Edit or delete an entry
├── (modals)/terms-update.tsx
├── (formSheets)/            # Add menu, fluid target, export, language, reminder interval
└── settings.tsx

components/ui/               # Design system primitives
components/diary/            # Charts, pickers, calendar, timeline
lib/store/                   # Zustand store, chunked AsyncStorage, migrations
lib/utils/                   # Export, backup, reminders, dates
lib/i18n/                    # en, pt (pt-PT), es (es-ES)
plugins/                     # Expo config plugins (Android backup rules, storage size, Material 3 theme)
e2e/walkthrough/             # Maestro walkthrough and store screenshots
```

## Design System

Based on the **Eleva Care** brand identity:

| Color             | Hex       | Purpose                                 |
| ----------------- | --------- | --------------------------------------- |
| **Deep Teal**     | `#006D77` | Primary - Calm, trustworthy             |
| **Soft Coral**    | `#E29578` | Secondary - Warm, approachable          |
| **Pale Lavender** | `#E0FBFC` | Accent - Fresh, clean                   |
| **Error Red**     | `#EF4444` | Destructive actions, alerts             |

### Design Principles

- **Clarity**: No gamification, no warning colours on what the user logged
- **Accessibility first**: WCAG AA compliance, large tap targets
- **One-hand operation**: Optimized for quick, single-handed use
- **Low cognitive load**: Minimal steps to complete any action

## Performance Optimizations

Following React Native best practices for smooth 60fps interactions:

- **Zustand selectors** for granular state subscriptions
- **GestureDetector** for hardware-accelerated press animations
- **Memoized components** and hoisted Intl formatters
- **Native modals** and navigation transitions
- **Haptic feedback** for tactile confirmation

## Data Schema

All entries are validated with Zod schemas:

```typescript
// Urination Entry
{
  type: 'urination',
  timestamp: string,      // ISO datetime
  volume: 'small' | 'medium' | 'large',
  volumeMl?: number,      // exact amount, if measured
  urgency: 1 | 2 | 3 | 4 | 5,
  hadLeak: boolean,
  hadPain: boolean,
  notes?: string
}

// Fluid Entry
{
  type: 'fluid',
  timestamp: string,
  drinkType: 'water' | 'coffee' | 'tea' | 'juice' | 'alcohol' | 'other',
  amount: number,         // in ml
  notes?: string
}

// Leak Entry
{
  type: 'leak',
  timestamp: string,
  severity: 'drops' | 'moderate' | 'full',
  urgency: 1 | 2 | 3 | 4 | 5,
  activity?: 'coughing' | 'sneezing' | 'laughing' | 'exercise' | 'lifting' | 'standing' | 'walking' | 'sleeping' | 'other',
  notes?: string
}
```

## Medical Disclaimer

Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private - Eleva Care

## Acknowledgments

- [Expo](https://expo.dev) - Universal React applications
- [NativeWind](https://nativewind.dev) - TailwindCSS for React Native
- [Zustand](https://zustand-demo.pmnd.rs) - Lightweight state management
- [date-fns](https://date-fns.org) - Modern date utility library
