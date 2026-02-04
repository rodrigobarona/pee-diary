# Pee Diary

A premium, privacy-first mobile application for tracking bladder health. Built for patients and healthcare providers, Pee Diary helps users log urination patterns, fluid intake, and leakage events to support medical diagnosis and bladder training programs.

## Why a Bladder Diary?

Healthcare professionals often recommend keeping a bladder diary to diagnose and treat conditions such as:

- **Overactive Bladder (OAB)** – Frequent urination and strong urges
- **Urinary Incontinence** – Involuntary leakage events
- **Nocturia** – Excessive nighttime urination
- **Urinary Tract Infections (UTIs)** – Monitoring patterns for recurrence
- **Pelvic Floor Disorders** – Supporting physical therapy programs

A complete voiding diary provides physicians with essential data for accurate diagnosis and personalized treatment plans.

## Target Audience

- **Patients with urinary symptoms** seeking to monitor and understand their bladder habits
- **Individuals undergoing bladder retraining** or pelvic floor therapy
- **People preparing for urology appointments** who need documented symptom history
- **Anyone concerned about bladder health** wanting to track patterns proactively

## Key Features

### Quick Logging (Under 10 Seconds)

- **Urination Events**: Volume (small/medium/large), urgency level (1-5 scale), pain indicator, leak occurrence
- **Fluid Intake**: Drink type (water, coffee, tea, juice, alcohol, other), amount in ml
- **Leakage Episodes**: Severity (drops/moderate/full), urgency level, optional notes

### Comprehensive Dashboard

- Daily progress tracking with visual progress bars
- Personalized daily goals for fluid intake and void frequency
- Time-of-day activity breakdown (morning, afternoon, evening, night)
- Streak tracking for consistent logging habits

### Insights & Analytics

- Weekly and monthly trend charts
- Average fluids and voids comparison vs. previous periods
- Goal achievement tracking
- Trend indicators (improving, declining, stable)

### Calendar History

- Visual calendar with entry indicators by type
- Filter entries by category (urination, fluids, leaks)
- Expandable time period sections
- Quick navigation to any past date

### Data Export

- **PDF Reports**: Professional, clinician-friendly format with clear timestamps and units
- **CSV Files**: Spreadsheet-compatible for detailed analysis
- **JSON Format**: Complete data backup for technical users
- Flexible date range selection (7 days, 30 days, custom range)

### Privacy & Data Control

- **Offline-First**: All data stored locally on your device
- **iCloud Sync** (iOS): Optional backup to your personal iCloud account
- **No Account Required**: Use immediately without registration
- **Full Data Ownership**: Export or delete your data anytime

### Multi-Language Support

- English
- Spanish (Español)
- Portuguese (Português)

## Tech Stack

| Category                 | Technology                                     |
| ------------------------ | ---------------------------------------------- |
| **Framework**            | Expo SDK 54 with React Native 0.81             |
| **Styling**              | NativeWind v4 (TailwindCSS for React Native)   |
| **State Management**     | Zustand with AsyncStorage persistence          |
| **Navigation**           | Expo Router with native tab navigation         |
| **Animations**           | React Native Reanimated + Gesture Handler      |
| **Lists**                | LegendList for high-performance virtualization |
| **Menus**                | Zeego for native dropdown menus                |
| **Validation**           | Zod schemas for type-safe data                 |
| **Internationalization** | expo-localization + i18n-js                    |
| **Cloud Backup**         | expo-icloud-storage (iOS)                      |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

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

### Running the App

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the QR code with Expo Go

## Project Structure

```
app/                        # Expo Router pages
├── (tabs)/                 # Bottom tab navigation
│   ├── index.tsx          # Home - Today's dashboard
│   ├── history.tsx        # History - Calendar view
│   ├── add.tsx            # Add button (FAB trigger)
│   └── settings.tsx       # Settings - Preferences
├── add/                    # Entry form modals
│   ├── urination.tsx      # Log urination
│   ├── fluid.tsx          # Log fluid intake
│   └── leak.tsx           # Log leakage
├── entry/
│   └── [id].tsx           # Entry detail/edit view
├── export.tsx             # Export screen
└── goals.tsx              # Goals configuration

components/
├── ui/                     # Design system primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── text.tsx
│   └── ...
└── diary/                  # App-specific components
    ├── calendar.tsx
    ├── progress-bar.tsx
    ├── weekly-chart.tsx
    └── ...

lib/
├── i18n/                   # Internationalization
│   ├── context.tsx
│   └── locales/
├── store/                  # Zustand state management
│   ├── diary-store.ts
│   └── types.ts
├── theme/                  # Color tokens and utilities
└── utils/                  # Helper functions
    ├── backup.ts
    ├── export.ts
    └── date.ts
```

## Design System

Based on the **Eleva Care** brand identity:

| Color             | Hex       | Purpose                                 |
| ----------------- | --------- | --------------------------------------- |
| **Deep Teal**     | `#006D77` | Primary - Calming, medical, trustworthy |
| **Soft Coral**    | `#E29578` | Secondary - Warm, approachable          |
| **Pale Lavender** | `#E0FBFC` | Accent - Fresh, clean                   |
| **Error Red**     | `#EF4444` | Destructive actions, alerts             |

### Design Principles

- **Medical-grade clarity**: No gamification or playful elements
- **Accessibility first**: WCAG AA compliance, large tap targets
- **One-hand operation**: Optimized for quick, single-handed use
- **Low cognitive load**: Minimal steps to complete any action

## Performance Optimizations

Following React Native best practices for smooth 60fps interactions:

- **LegendList** with `getItemType` for heterogeneous list rendering
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
  notes?: string
}
```

## Medical Disclaimer

Pee Diary is a **logging tool only** and does not provide medical advice, diagnosis, or treatment recommendations. Always consult a qualified healthcare provider for medical concerns. The data collected is intended to support conversations with your healthcare team.

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
