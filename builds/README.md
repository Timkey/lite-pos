# Build Outputs

This directory contains compiled mobile app files ready for installation.

## Current Builds

### Android
- **File**: `business-tools-dashboard.apk`
- **Size**: 3.6MB
- **Build**: Debug (unsigned)
- **Min Android**: 5.1 (API 22)
- **Target Android**: 13 (API 33)

### iOS  
- **File**: `business-tools-dashboard.ipa`
- **Build**: Development (ad-hoc)
- **Min iOS**: 13.0
- **Status**: Built via GitHub Actions

## Installation

### Android Device

1. **Enable Installation from Unknown Sources**:
   - Settings → Security → Unknown Sources (enable)
   - Or Settings → Apps → Special Access → Install Unknown Apps

2. **Download & Install**:
   - Download `business-tools-dashboard.apk`
   - Tap the file to install
   - Or via dashboard: Visit your-server/builds/business-tools-dashboard.apk

3. **Via ADB** (from computer):
   ```bash
   adb install business-tools-dashboard.apk
   ```

### iOS Device

1. **Download IPA**:
   - From GitHub Actions artifacts
   - Or from dashboard (if available)

2. **Install via**:
   - **TestFlight** (recommended for testers)
   - **Xcode**: Window → Devices → drag IPA to device
   - **3rd party tools**: Cydia Impactor, AltStore, etc.

⚠️ **Note**: iOS apps require signing. Development builds only work on registered devices.

## Download from Dashboard

Both apps are available at:
- **Web Dashboard**: http://your-server/
- **Direct Links**:
  - Android: http://your-server/builds/business-tools-dashboard.apk
  - iOS: http://your-server/builds/business-tools-dashboard.ipa

The dashboard automatically detects available builds and shows download buttons.

## Rebuild

### Android (Docker)
```bash
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash
./docker/build-apk.sh
```

### iOS (GitHub Actions)
```bash
git push  # Triggers automatic build
```

See [BUILD_GUIDE.md](../BUILD_GUIDE.md) for complete build instructions.
