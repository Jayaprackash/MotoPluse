# MotoPulse 🏍️ • Smart Motorcycle Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-brightgreen.svg)](https://developer.android.com)
[![Offline First](https://img.shields.io/badge/Storage-100%25%20Offline-blue.svg)](https://github.com)
[![Privacy](https://img.shields.io/badge/Privacy-Zero%20Tracking-orange.svg)](https://github.com)

A high-performance, open-source motorcycle companion application built for motorcyclists. MotoPulse provides precision fuel telemetry, component health wear rings, manual service due intervals (Engine Oil, Chain, Brakes, Air Filter), encrypted local document storage with camera capture, and an MSF T-CLOCS pre-ride inspection checklist — with **zero mock data**, **zero cloud tracking**, and **100% offline local persistence**.

---

## ✨ Features & Architecture

### 1. Dual High-Performance Themes
- **⚪ White & Scarlet Red (Light Mode):** Pure `#FFFFFF` background with crisp hairline dividers, deep charcoal typography (`#111315`), and vibrant Scarlet Red (`#D90B1F`) buttons and active states. Built for direct outdoor sunlight and tank bag mounts.
- **⚫ Black & Scarlet Red (Dark Mode):** Deep stealth black (`#0B0C0E`), sleek `#131519` container cards, and glowing Scarlet Red (`#D90B1F`) accents for garage environments and night riding.
- **1-Tap Quick Switch:** Toggle instantly via the header button (`⚫` / `⚪`) or sync automatically with your system sunrise/sunset.

### 2. The Unified Dashboard View
- **Odometer Flank:** Displays current vehicle distance with an authentic mechanical drum tumbler counter (`KM`).
- **Mileage Flank:** Real-time calculated average fuel economy (`km/L` or `mpg`) with variance delta badges (`▲ +0.8 vs last fill`).
- **Glanceable Telemetry:** Usable fuel range estimation (`⛽ ~380 km`) and overall maintenance health score (`96%`).

### 3. Component Health Rings
- Animated circular progress gauges indicating remaining life before scheduled service:
  - 💧 **Engine Oil & Filter** (% life remaining, distance ran since last change, manual due target)
  - ⚙️ **Chain Cleaning & Lubrication** (with 500 km / 30-day interval alerts)
  - 🛡️ **Brake Pads & Fluid**
  - ⚡ **Spark Plugs & Electricals**
  - 🛞 **Tires & Suspension**
  - ➕ **Custom Components** (Fork Oil, Coolant, Drive Belt, etc.)

### 4. Rapid Action Sheet
- A fixed bottom interactive panel providing instant 1-tap thumb access to primary rider flows:
  - ⛽ **+ Add Fuel Entry** (with numerical pad, quick-stepper volume buttons `+1L`, `+2L`, `+5L`, `Full`, and live variance calculation)
  - 🔧 **+ Log Repair** (records workshop receipts, parts replaced tag pills, and manual target due dates)

### 5. Chronological Service History Timeline
- Vertical timeline connected by a continuous spine with category skimming icons (💧 fluids, ⚙️ chain, 🛡️ brakes, ⚡ electrical, 🛞 tires, 🔧 mechanical).

### 6. MSF T-CLOCS Pre-Ride Safety Walkaround
- 6-point pre-ride inspection checklist (Tires, Controls, Lights, Oil/Fluids, Chassis/Chain, Stands).

### 7. Encrypted Document Vault & Camera Capture
- Store your RC, Insurance Policy, Pollution Certificate (PUC), and Driver's License offline on device.
- In-app document camera capture with client-side image compression (~120–180 KB).
- Fullscreen document viewer and color-coded expiration countdowns (`Valid`, `30d left`, `Expired`).

### 8. 100% Offline & Data Sovereignty
- Zero server dependency, zero accounts, zero analytics trackers.
- 1-click JSON backup export (Schema v2) and transactional import with conflict resolution (Replace or Merge).

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML5, Modern CSS3 with Custom Properties, JavaScript (ES6+ modular engines)
- **Native Bridge:** [Capacitor](https://capacitorjs.com/) (Android WebView runtime)
- **Audio Engine:** Web Audio API (mechanical tactile sound effects)
- **Graphics:** HTML5 Canvas (smooth bezier fuel economy curves) & SVG (circular progress rings)
- **Local Database:** W3C LocalStorage / IndexedDB with client-side base64 compression

---

## 🚀 Getting Started for Developers

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Java Development Kit (JDK) 17](https://adoptium.net/)
- [Android SDK](https://developer.android.com/studio) (API level 33+)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/MotoPulse.git
cd MotoPulse
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
# 1. Sync web assets into Android project
npm run build
npx cap sync android

# 2. Compile debug APK using Gradle
cd android
./gradlew assembleDebug
```
The compiled `.apk` will be output to:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📦 Download Pre-built APK

You can download the compiled Android APK directly from the [Releases](https://github.com) tab or from the root directory:
👉 **`MotoPulse.apk`**

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting bugs, submitting features, and submitting pull requests.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
Free and open-source for motorcyclists worldwide. 🏍️💨
