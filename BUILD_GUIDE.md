# Mobile App Build System

Complete setup for building Android and iOS apps from your Business Tools Dashboard using Docker and cloud builds.

## 🚀 Quick Start

### Android Build (via Docker)
```bash
# Start container
docker-compose -f docker/docker-compose.yml up -d

# Build APK
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash
./docker/build-apk.sh

# APK output: builds/business-tools-dashboard.apk (3.6MB)
```

### iOS Build (via GitHub Actions)
```bash
# Commit your changes
git add .
git commit -m "Update app"
git push

# GitHub Actions automatically builds iOS
# Check: Actions tab → Build iOS App workflow
# Download: Actions artifacts or builds/business-tools-dashboard.ipa
```

## 📁 Project Structure

```
Recon/
├── docker/                      # Docker build system
│   ├── Dockerfile              # Android SDK, Java, Node.js
│   ├── docker-compose.yml      # Container config
│   ├── prepare-build.sh        # Auto-prep script
│   ├── build-apk.sh           # Android build
│   ├── README.md              # Docker docs
│   └── iOS-CLOUD-BUILD.md     # iOS build options
├── .github/workflows/
│   └── build-ios.yml          # GitHub Actions iOS build
├── scripts/
│   ├── build-ios.sh           # Local iOS build (requires Xcode)
│   └── ExportOptions.plist    # iOS export config
├── builds/                     # Build outputs
│   ├── business-tools-dashboard.apk
│   └── business-tools-dashboard.ipa
├── capacitor-build/            # Auto-generated clean copy
├── android/                    # Android native project
├── ios/                        # iOS native project
├── index.html                  # Dashboard with download links
├── shop-tracker/              # Your PWA app
├── capacitor.config.json      # Capacitor configuration
└── package.json               # Dependencies & scripts
```

## 🛠️ Available Commands

```bash
# Docker
npm run docker:up               # Start container
npm run docker:down             # Stop container
npm run docker:bash             # Enter container shell

# Building
npm run build:android           # Build Android APK
npm run build:ios               # Info about iOS builds

# Capacitor sync
npm run cap:sync                # Sync both platforms
npm run cap:sync:android        # Sync Android only
npm run cap:sync:ios            # Sync iOS only
```

## 📱 Platform Details

### ✅ Android (Fully Working in Docker)
- **Build time**: ~8 minutes (first time), ~2 minutes (subsequent)
- **Output**: `builds/business-tools-dashboard.apk` (3.6MB)
- **Installation**: Enable "Unknown Sources", install APK
- **Minimum**: Android 5.1 (API 22)
- **Target**: Android 13 (API 33)

### ✅ iOS (Cloud Build via GitHub Actions)
- **Build time**: ~10-15 minutes
- **Output**: `builds/business-tools-dashboard.ipa`
- **Distribution**: Ad-hoc or Development
- **Minimum**: iOS 13.0
- **Limitations**: Cannot build in Docker (requires macOS/Xcode)

## 🌐 Dashboard Download Feature

The [index.html](index.html) dashboard automatically detects available builds:

- Checks for `builds/business-tools-dashboard.apk`
- Checks for `builds/business-tools-dashboard.ipa`
- Shows download buttons when files exist
- Updates dynamically

## 📖 Documentation

- [CAPACITOR_DOCKER.md](CAPACITOR_DOCKER.md) - Main Docker setup guide
- [docker/README.md](docker/README.md) - Docker commands reference
- [docker/iOS-CLOUD-BUILD.md](docker/iOS-CLOUD-BUILD.md) - iOS build options
- [iOS-BUILD.md](iOS-BUILD.md) - Local iOS build (requires Xcode)

## 🔄 Build Process

### Android (Automated)
1. Container starts → `prepare-build.sh` creates clean copy
2. Copies only: `index.html`, `shop-tracker/` (with service worker)
3. Excludes: All `.md` docs, Docker files
4. `build-apk.sh` → Gradle builds APK
5. Output to `builds/` folder

### iOS (GitHub Actions)
1. Push code to GitHub
2. Workflow triggers on `capacitor-build-test` or `main` branch
3. macOS runner installs dependencies
4. Builds iOS app with Xcode
5. Exports IPA and commits to repository
6. Available in Actions artifacts + `builds/` folder

## 🚨 Troubleshooting

### Android build fails
```bash
# Clean and rebuild
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash
cd android && ./gradlew clean
cd .. && ./docker/build-apk.sh
```

### iOS won't sync
```bash
# File locking issues - restart container
docker-compose -f docker/docker-compose.yml restart
```

### Colima mount issues
```bash
# Ensure /Volumes/mnt is mounted
colima restart
```

## 🎯 Next Steps

1. **Test Android APK**: Download from `builds/` and install on device
2. **Enable GitHub Actions**: Push to GitHub to trigger iOS build
3. **Customize**: Update app name, icons, splash screens
4. **Sign for production**: Add keystore (Android) and certificates (iOS)

## 🔗 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/ios/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
