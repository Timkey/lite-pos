# iOS Build Setup

## Current Status

✅ iOS platform added to Capacitor project  
❌ Full iOS build requires Xcode (not just Command Line Tools)

## Requirements for iOS Builds

iOS apps **cannot be built in Docker**. You need:

1. **macOS** with full **Xcode** installed (not just Command Line Tools)
2. **Apple Developer Account** (free or paid)
3. **CocoaPods** installed: `sudo gem install cocoapods`

## Installation Steps

### 1. Install Xcode

Download from Mac App Store or:
```bash
xcode-select --install
```

Then install full Xcode from App Store.

### 2. Set Xcode as Active Developer Directory

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### 3. Install CocoaPods

```bash
sudo gem install cocoapods
cd ios/App
pod install
```

## Building the iOS App

### Option 1: Using Xcode (Recommended)

```bash
# Sync web assets
docker-compose -f docker/docker-compose.yml exec capacitor-dev npx cap sync ios

# Open in Xcode
open ios/App/App.xcworkspace

# In Xcode:
# 1. Select a team in Signing & Capabilities
# 2. Product > Archive
# 3. Distribute App > Development
# 4. Export .ipa file
```

### Option 2: Using Command Line (requires setup)

```bash
# After Xcode is properly installed
chmod +x scripts/build-ios.sh
./scripts/build-ios.sh
```

## Current Limitation

Your Mac currently has only Command Line Tools installed, not full Xcode. To build iOS apps:

1. Install Xcode from Mac App Store
2. Accept Xcode license: `sudo xcodebuild -license accept`
3. Run the build script or use Xcode GUI

## Alternative: Cloud Build

If you don't want to install Xcode locally, consider:

- **Expo Application Services (EAS)**
- **AppCenter** (Microsoft)
- **Codemagic**
- **GitHub Actions** with macOS runners

These services can build iOS apps in the cloud without local Xcode installation.

## File Locations

- iOS project: `ios/App/`
- Workspace: `ios/App/App.xcworkspace` (use this, not .xcodeproj)
- Build output: `builds/business-tools-dashboard.ipa` (after building)
