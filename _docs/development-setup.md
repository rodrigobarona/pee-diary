# Development Setup Guide

Complete guide to set up the Eleva Diary development environment on macOS, including iOS and Android builds.

## Prerequisites

| Tool | Version | Purpose |
| --- | --- | --- |
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager (comes with Node.js) |
| **Xcode** | 16+ | iOS builds and simulator |
| **CocoaPods** | 1.14+ | iOS native dependency manager |
| **Android Studio** | 2025+ | Android builds and emulator |
| **Java JDK** | 17 | Required by Android Gradle builds |

## Installation

### 1. Clone and install dependencies

```bash
git clone https://github.com/AEGISdev/pee-diary.git
cd pee-diary
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```bash
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

### 3. Start the development server

```bash
npx expo start
```

- Press `i` to open the iOS Simulator
- Press `a` to open the Android Emulator
- Press `w` to open in the browser
- Scan the QR code with **Expo Go** on a physical device

---

## iOS Setup

### Install Xcode

1. Install **Xcode** from the Mac App Store
2. Open Xcode and accept the license agreement
3. Install **Command Line Tools**:

```bash
xcode-select --install
```

4. Open Xcode > **Settings > Platforms** and download the latest iOS Simulator runtime

### Install CocoaPods

CocoaPods manages native iOS dependencies. The recommended approach is via Homebrew:

```bash
brew install cocoapods
```

**Alternative** -- If you don't have Homebrew or admin rights:

```bash
gem install --user-install cocoapods
export PATH="$HOME/.gem/ruby/$(ruby -e 'puts RbConfig::CONFIG["ruby_version"]')/bin:$PATH"
```

> **Note**: Do NOT use `sudo gem install cocoapods` on modern macOS. The system Ruby (2.6) is too old for the latest CocoaPods. Homebrew installs its own modern Ruby automatically.

### Build and run on iOS Simulator

```bash
npx expo run:ios
```

This will:
1. Generate the native `ios/` project (first time only)
2. Run `pod install` to install native dependencies
3. Build the app with Xcode
4. Launch it on the iOS Simulator

The first build takes several minutes. Subsequent builds are much faster.

### Run on a physical iPhone (no paid license required)

You can test on your own device with a **free Apple ID** -- no $99/year Developer Program needed. The limitations are:

- Apps expire after **7 days** (re-install to renew)
- Maximum **3 apps** installed at a time
- No TestFlight or App Store distribution

**Steps:**

1. Connect your iPhone via USB to your Mac
2. Open Xcode > **Settings > Accounts** and sign in with your Apple ID
3. Open the workspace:

```bash
open ios/elevadiary.xcworkspace
```

4. In Xcode:
   - Select your **physical iPhone** as the build target (top toolbar)
   - Go to the **Signing & Capabilities** tab
   - Set **Team** to your Apple ID (shows as "Personal Team")
   - If the bundle identifier conflicts, make it unique (e.g., `care.eleva.eleva-diary.dev`)

5. On your iPhone: go to **Settings > General > VPN & Device Management** and tap **Trust** on the developer certificate

6. Build and run targeting your device:

```bash
npx expo run:ios --device
```

It will list connected devices and let you pick your iPhone.

### When you need the paid Apple Developer Program ($99/year)

- Publishing to the **App Store**
- **TestFlight** beta distribution
- Production push notification certificates
- Apps that don't expire every 7 days
- Enterprise/ad-hoc distribution

---

## Android Setup

### Install Android Studio

Using Homebrew (recommended):

```bash
brew install --cask android-studio
```

Or download directly from [developer.android.com/studio](https://developer.android.com/studio).

### Install Java JDK 17

Android Gradle builds require JDK 17:

```bash
brew install --cask zulu@17
```

### Configure environment variables

Add these to your `~/.zshrc` (or `~/.bashrc`):

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Java (Zulu JDK 17)
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

Then reload:

```bash
source ~/.zshrc
```

### Complete Android Studio setup

1. Open Android Studio:

```bash
open -a "Android Studio"
```

2. Go through the **Setup Wizard** -- choose "Standard" and accept all SDK licenses
3. The wizard downloads: Android SDK, Build Tools, Emulator, Platform Tools

### Create an Android Emulator

1. In Android Studio, go to **More Actions > Virtual Device Manager**
2. Click **Create Virtual Device**
3. Pick a phone model (e.g., **Pixel 8**)
4. Select a system image (e.g., **API 35**) and click **Download** if needed
5. Click **Finish**

### Build and run on Android Emulator

```bash
npx expo run:android
```

This will:
1. Generate the native `android/` project (first time only)
2. Build with Gradle
3. Install the app on the running emulator

The first build takes several minutes due to Gradle dependency downloads.

### Run on a physical Android device

1. Enable **Developer Options** on your phone: go to **Settings > About Phone** and tap **Build Number** 7 times
2. Enable **USB Debugging** in **Settings > Developer Options**
3. Connect via USB and accept the debugging prompt on your phone
4. Run:

```bash
npx expo run:android --device
```

---

## Expo Go (Quick Testing)

For JavaScript-only changes (no native module modifications), you can use **Expo Go** without building native projects:

```bash
npx expo start
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app (install from Play Store)

> **Limitation**: Expo Go doesn't support custom native modules. If you modify native code or add native dependencies, you need a development build (`npx expo run:ios` / `npx expo run:android`).

---

## Common Issues

### `pod install` fails with Ruby version errors

The system Ruby on macOS (2.6) is too old for modern CocoaPods. Use Homebrew:

```bash
brew install cocoapods
```

### Permission denied with Homebrew

If Homebrew was installed under a different user:

```bash
sudo chown -R $(whoami):staff /opt/homebrew
```

### Metro bundler port conflict

If port 8081 is already in use:

```bash
npx expo start --port 8082
```

### Clear build caches

When things go wrong, clean everything:

```bash
# Clear Metro cache
npx expo start --clear

# Clean iOS build
cd ios && pod deintegrate && pod install && cd ..

# Clean Android build
cd android && ./gradlew clean && cd ..

# Nuclear option -- regenerate native projects
rm -rf ios android
npx expo run:ios   # regenerates ios/
npx expo run:android  # regenerates android/
```

### Android emulator not detected

Make sure `ANDROID_HOME` is set correctly:

```bash
echo $ANDROID_HOME
# Should output: /Users/yourname/Library/Android/sdk

# List available emulators
emulator -list-avds
```

---

## Build for Distribution

### iOS (App Store / TestFlight)

Requires: Paid Apple Developer Program ($99/year)

```bash
# Using EAS Build (recommended)
npx eas build --platform ios

# Or local build
npx expo run:ios --configuration Release
```

### Android (Play Store)

```bash
# Using EAS Build (recommended)
npx eas build --platform android

# Or local build
npx expo run:android --variant release
```

See the [EAS Build documentation](https://docs.expo.dev/build/introduction/) for full CI/CD setup.
