# Contributing to MotoPulse 🏍️

Thank you for your interest in contributing to **MotoPulse**! We welcome all contributions from the motorcycle and developer community.

---

## 🛠️ Development Setup

### Prerequisites
1. **Node.js** (v18+)
2. **JDK 17** (Java Development Kit 17)
3. **Android SDK** (API Level 33+)

### Quickstart
1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/MotoPulse.git
   cd MotoPulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the local preview server:**
   ```bash
   node server.js
   ```
   Open `http://localhost:8080` in your web browser.

4. **Sync with Android & Build APK:**
   ```bash
   npm run build
   # Or manually:
   # Copy assets to www/
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   ```

---

## 📋 Contribution Guidelines

1. **Issues**: Check existing issues before opening a new one. Provide reproducible steps and device details for bug reports.
2. **Feature Requests**: Open an issue describing the motorcyclist use case and rationale.
3. **Pull Requests**:
   - Create a feature branch: `git checkout -b feature/your-feature-name`
   - Keep commits focused and provide clear commit messages.
   - Test locally on both Dark and White themes.
   - Open a PR against the `main` branch.

---

## 📜 Code of Conduct
Please be respectful, helpful, and collaborative. We are building tools for motorcyclists worldwide!
