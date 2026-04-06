# iOS Build via GitHub Actions (Cloud Build)

Since Xcode cannot run in Docker (Linux), use GitHub Actions with macOS runners for automated iOS builds.

## Setup

### 1. Create GitHub Actions Workflow

Create `.github/workflows/build-ios.yml`:

```yaml
name: Build iOS App

on:
  push:
    branches: [ capacitor-build-test, main ]
  workflow_dispatch:

jobs:
  build-ios:
    runs-on: macos-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Sync Capacitor
        run: npx cap sync ios
      
      - name: Install CocoaPods
        run: |
          cd ios/App
          pod install
      
      - name: Build iOS App
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath ./build/App.xcarchive \
            archive \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO
      
      - name: Export IPA
        run: |
          cd ios/App
          xcodebuild -exportArchive \
            -archivePath ./build/App.xcarchive \
            -exportPath ./build \
            -exportOptionsPlist ../../scripts/ExportOptions.plist
      
      - name: Upload IPA
        uses: actions/upload-artifact@v3
        with:
          name: business-tools-dashboard-ios
          path: ios/App/build/*.ipa
      
      - name: Copy to builds folder
        run: |
          mkdir -p builds
          cp ios/App/build/*.ipa builds/business-tools-dashboard.ipa
      
      - name: Commit IPA
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add builds/business-tools-dashboard.ipa
          git commit -m "Update iOS build" || echo "No changes"
          git push || echo "Nothing to push"
```

### 2. Alternative: Use EAS (Expo Application Services)

```bash
# Install EAS CLI in Docker
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash -c "npm install -g eas-cli"

# Login to EAS
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash -c "eas login"

# Configure EAS
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash -c "eas build:configure"

# Build iOS in cloud
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash -c "eas build --platform ios"
```

### 3. Alternative: Capacitor Cloud (Ionic Appflow)

- Sign up at https://ionic.io/appflow
- Connect your repository
- Configure iOS build
- Builds run in Ionic's cloud

## Why Docker Can't Build iOS

- **Xcode is macOS-only** - Apple's compiler only runs on macOS
- **Linux containers can't run Xcode** - Even on macOS Docker hosts
- **Cross-compilation doesn't work** - iOS requires Apple's toolchain

## Recommended Solution

**Use GitHub Actions** (free for public repos, 2000 min/month for private):

1. Push your code to GitHub
2. GitHub Actions runs on real macOS machines
3. Builds complete automatically
4. Download IPA from Actions artifacts or auto-commit to repository

## Current Docker Limitations

✅ **What Works in Docker:**
- Adding iOS platform: `npx cap add ios`
- Syncing web assets: `npx cap sync ios`  
- Managing dependencies
- Preparing iOS project structure

❌ **What Doesn't Work in Docker:**
- Compiling iOS app (needs Xcode)
- Running `xcodebuild` (macOS-only)
- CocoaPods native builds
- Signing and packaging

## Next Steps

Choose one option:
1. **GitHub Actions** - Free, automated, no local setup
2. **EAS** - Expo's cloud build service
3. **Install Xcode locally** - If you have the disk space (~15GB)
4. **Use cloud CI/CD** - CircleCI, Bitrise, Codemagic (paid options)
