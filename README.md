# MotoPulse 🏍️ • Smart Motorcycle Companion

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://opensource.org/licenses/Apache-2.0)
[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-jayaprackash.github.io%2FMotoPluse-red.svg?logo=googlechrome&logoColor=white)](https://jayaprackash.github.io/MotoPluse/)
[![Download APK](https://img.shields.io/badge/Download-MotoPulse.apk%20(v2.4)-success?logo=android&logoColor=white)](https://github.com/Jayaprackash/MotoPluse/raw/main/MotoPulse.apk)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-brightgreen.svg?logo=android&logoColor=white)](https://developer.android.com)
[![Platform: iOS](https://img.shields.io/badge/Platform-iOS%2014.0+-black.svg?logo=apple&logoColor=white)](https://apple.com/ios)
[![Offline First](https://img.shields.io/badge/Storage-100%25%20Offline-blue.svg)](https://github.com)
[![Privacy](https://img.shields.io/badge/Privacy-Zero%20Tracking-orange.svg)](https://github.com)

A high-performance, open-source motorcycle companion application built for motorcyclists. MotoPulse provides precision fuel telemetry, component health wear rings, manual service due intervals (Engine Oil, Chain, Brakes, Air Filter), encrypted local document storage with camera capture, and an MSF T-CLOCS pre-ride inspection checklist — with **zero mock data**, **zero cloud tracking**, and **100% offline local persistence**.

---

## 🌐 Live Web App & Mobile Installation

### 📱 iOS (iPhone & iPad Instant Install)
1. Open **Safari** on your iPhone or iPad.
2. Go to: **[https://jayaprackash.github.io/MotoPluse/](https://jayaprackash.github.io/MotoPluse/)**
3. Tap the **Share** button (the square with an arrow pointing up at the bottom).
4. Tap **"Add to Home Screen"** ➔ **Add**.
5. MotoPulse will now run like a native iOS app with full screen view, offline cache, and camera access.

### 🤖 Android (Direct APK Download)
Download and install directly without compiling from source:
👉 **[Download MotoPulse.apk (v2.4)](https://github.com/Jayaprackash/MotoPluse/raw/main/MotoPulse.apk)**

*(Or open [https://jayaprackash.github.io/MotoPluse/](https://jayaprackash.github.io/MotoPluse/) in Chrome and tap "Install App").*

---

## ✨ Features & Architecture


### 1. The Unified Dashboard View
- **Odometer Flank:** Displays current vehicle distance with an authentic mechanical drum tumbler counter (`KM`).
- **Mileage Flank:** Real-time calculated average fuel economy (`km/L` or `mpg`) with variance delta badges (`▲ +0.8 vs last fill`).
- **Glanceable Telemetry:** Usable fuel range estimation (`⛽ ~380 km`) and overall maintenance health score (`96%`).

### 2. Component Health Rings
- Animated circular progress gauges indicating remaining life before scheduled service:
  - 💧 **Engine Oil & Filter** (% life remaining, distance ran since last change, manual due target)
  - ⚙️ **Chain Cleaning & Lubrication** (with 500 km / 30-day interval alerts)
  - 🛡️ **Brake Pads & Fluid**
  - ⚡ **Spark Plugs & Electricals**
  - 🛞 **Tires & Suspension**
  - ➕ **Custom Components** (Fork Oil, Coolant, Drive Belt, etc.)

### 3. Rapid Action Sheet
- A fixed bottom interactive panel providing instant 1-tap thumb access to primary rider flows:
  - ⛽ **+ Add Fuel Entry** (with numerical pad, quick-stepper volume buttons `+1L`, `+2L`, `+5L`, `Full`, and live variance calculation)
  - 🔧 **+ Log Repair** (records workshop receipts, parts replaced tag pills, and manual target due dates)

### 4. Chronological Service History Timeline
- Vertical timeline connected by a continuous spine with category skimming icons (💧 fluids, ⚙️ chain, 🛡️ brakes, ⚡ electrical, 🛞 tires, 🔧 mechanical).

### 5. MSF T-CLOCS Pre-Ride Safety Walkaround
- 6-point pre-ride inspection checklist (Tires, Controls, Lights, Oil/Fluids, Chassis/Chain, Stands).

### 6. Encrypted Document Vault & Camera Capture
- Store your RC, Insurance Policy, Pollution Certificate (PUC), and Driver's License offline on device.
- In-app document camera capture with client-side image compression (~120–180 KB).
- Fullscreen document viewer and color-coded expiration countdowns (`Valid`, `30d left`, `Expired`).

### 7. 100% Offline & Data Sovereignty
- Zero server dependency, zero accounts, zero analytics trackers.
- 1-click JSON backup export (Schema v2) and transactional import with conflict resolution (Replace or Merge).

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML5, Modern CSS3 with Custom Properties, JavaScript (ES6+ modular engines)
- **Native Bridges:** [Capacitor](https://capacitorjs.com/) (iOS WKWebView & Android WebView runtimes)
- **Audio Engine:** Web Audio API (mechanical tactile sound effects)
- **Graphics:** HTML5 Canvas (smooth bezier fuel economy curves) & SVG (circular progress rings)
- **Local Database:** W3C LocalStorage / IndexedDB with client-side base64 compression

---

## 🚀 Getting Started for Developers

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- **For Android:** [Java Development Kit (JDK) 17](https://adoptium.net/) & [Android SDK](https://developer.android.com/studio)
- **For iOS:** macOS with [Xcode 15+](https://developer.apple.com/xcode/) & CocoaPods / Swift Package Manager

### 1. Clone the Repository
```bash
git clone https://github.com/Jayaprackash/MotoPluse.git
cd MotoPluse
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally in Browser
```bash
node server.js
```
Navigate to `http://localhost:8080`.

### 4. Build Android APK
```bash
# Sync web assets into Android project
npm run build
npx cap sync android

# Compile debug APK using Gradle
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Build iOS App (macOS & Xcode)
```bash
# Sync web assets into iOS project
npx cap sync ios

# Open project in Xcode
npx cap open ios

# Or compile via CLI
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -destination "generic/platform=iOS Simulator" clean build CODE_SIGNING_ALLOWED=NO
```

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting bugs, submitting features, and submitting pull requests.

---

## 📄 License

This project is licensed under the **Apache 2.0 License** — see the [LICENSE](LICENSE) file for details.
Free and open-source for motorcyclists worldwide. 🏍️💨
