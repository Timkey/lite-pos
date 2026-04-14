# Capacitor Build Issues - Analysis & Fixes

**Date**: April 11, 2026  
**Context**: Updated from master with new offline service workers

---

## 🔴 CRITICAL ISSUES

### 1. Android - No Audio Access ❌

**Problem**: Android app cannot access microphone for audio recording

**Root Cause**: Missing `RECORD_AUDIO` permission in AndroidManifest.xml

**Current State**:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<!-- ❌ MISSING: RECORD_AUDIO permission -->
```

**Required Fix**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
</manifest>
```

**Additional Requirements**:
- Runtime permission request in MainActivity.java (Android 6.0+)
- Audio feature declaration in manifest

**Files to Update**:
- `android/app/src/main/AndroidManifest.xml`
- Potentially add Capacitor Audio plugin if not using Web API

---

### 2. iOS Build Failing ❌

**Problem**: GitHub Actions pipeline failing to build iOS app

**Pipeline Info**:
- **File**: `.github/workflows/build-ios.yml`
- **Triggers**: Push to `main` or `capacitor-build-test` branches, manual dispatch
- **Runner**: `macos-latest`

**Potential Issues**:

#### A. Code Signing (Most Likely)
```yaml
CODE_SIGN_IDENTITY=""
CODE_SIGNING_REQUIRED=NO
CODE_SIGNING_ALLOWED=NO
```
- Unsigned builds may fail on export
- `ExportOptions.plist` path may be incorrect

#### B. Missing Permissions in Info.plist
```xml
<!-- ❌ MISSING from ios/App/App/Info.plist -->
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to record session audio</string>
```

#### C. CocoaPods Dependencies
```yaml
- name: Install CocoaPods dependencies
  run: |
    cd ios/App
    pod install
```
- May fail if pod dependencies incompatible
- Check for Podfile.lock conflicts

#### D. Xcode Version Mismatch
- `macos-latest` runner Xcode version may not match local development
- Could cause build failures

**Debug Steps**:
1. Check GitHub Actions logs for specific error
2. Verify `scripts/ExportOptions.plist` exists
3. Check CocoaPods install output
4. Verify workspace file generation

---

### 3. Service Workers Impact on Capacitor Build 🟡

**Question**: Do service workers affect Capacitor builds through Docker?

**Analysis**:

#### Service Workers in Build:
```javascript
// shop-tracker/sw.js - Now uses relative paths
const baseUrls = [
  './',
  './index.html',
  './css/main.css',
  // ... etc
];
```

**Impact Assessment**:

✅ **GOOD NEWS**: Service workers WON'T break Capacitor builds because:

1. **Relative Paths**: Using `./` instead of `/shop-tracker/` means they work in:
   - Web deployment (GitHub Pages: `/lite-pos/shop-tracker/`)
   - Capacitor app (file:// protocol: `capacitor://localhost/`)
   - Docker build process (copied as-is)

2. **Service Worker Scope**: Each SW is scoped to its directory
   - shop-tracker: `capacitor://localhost/shop-tracker/`
   - analytics: `capacitor://localhost/analytics/`
   - Works same as web

3. **Capacitor Compatibility**: 
   - Service workers supported in WKWebView (iOS) and WebView (Android)
   - No special config needed in capacitor.config.json

⚠️ **POTENTIAL ISSUES**:

1. **Cache Storage Limits**:
   - Mobile devices have smaller storage quotas
   - May need to reduce cached files for Capacitor

2. **File Protocol**:
   - Service workers use `capacitor://` instead of `https://`
   - Should work, but test thoroughly

3. **Background Sync**:
   - Won't work in Capacitor (requires real HTTPS)
   - Fallback to manual sync needed

#### Docker Build Process:

**File**: `prepare-build.sh` (runs in Docker)
```bash
# Copies shop-tracker with ALL files including sw.js
cp -r "$SOURCE_DIR/shop-tracker" "$BUILD_DIR/"
```

**Capacitor Config**:
```json
{
  "webDir": "capacitor-build"  // Points to Docker-prepared files
}
```

**Flow**:
1. Docker container runs `prepare-build.sh`
2. Copies shop-tracker (with sw.js) to capacitor-build/
3. `npx cap sync` copies capacitor-build/ → android/app/src/main/assets/
4. Service workers included in app bundle ✅

**Conclusion**: Service workers are **SAFE** for Capacitor builds. They're copied as static files and will work in the WebView.

---

## 🔧 REQUIRED FIXES

### Priority 1: Android Audio Permissions

**File**: `android/app/src/main/AndroidManifest.xml`

Add after `<uses-permission android:name="android.permission.INTERNET" />`:

```xml
<!-- Audio Recording Permissions -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Declare audio feature (optional but recommended) -->
<uses-feature 
    android:name="android.hardware.microphone" 
    android:required="true" />
```

### Priority 2: iOS Audio Permissions

**File**: `ios/App/App/Info.plist`

Add before closing `</dict>`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Business Tools needs microphone access to record session audio for quality assurance and customer service.</string>
```

### Priority 3: Fix iOS Build Pipeline

**Check**:
1. Verify `scripts/ExportOptions.plist` exists:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

2. Update workflow to better handle export failures:
```yaml
- name: Export IPA
  run: |
    cd ios/App
    mkdir -p ./build
    xcodebuild -exportArchive \
      -archivePath ./build/App.xcarchive \
      -exportPath ./build \
      -exportOptionsPlist ../../scripts/ExportOptions.plist 2>&1 | tee export.log
    if [ ! -f ./build/*.ipa ]; then
      echo "Export failed, checking logs..."
      cat export.log
      exit 1
    fi
```

---

## 📋 TESTING CHECKLIST

### Android:
- [ ] Add RECORD_AUDIO permission to manifest
- [ ] Rebuild Android app
- [ ] Test microphone access on device
- [ ] Verify audio recording in shop-tracker
- [ ] Check service worker caching works
- [ ] Test offline functionality

### iOS:
- [ ] Add NSMicrophoneUsageDescription to Info.plist
- [ ] Fix ExportOptions.plist path
- [ ] Test local iOS build
- [ ] Fix GitHub Actions pipeline
- [ ] Test microphone permission prompt
- [ ] Verify audio recording works
- [ ] Test service worker offline mode

### Service Workers:
- [ ] Verify relative paths work in Capacitor
- [ ] Test cache storage on mobile
- [ ] Confirm offline mode works
- [ ] Check cache size limits
- [ ] Test on both iOS and Android

---

## 🔍 DEBUGGING GITHUB PIPELINE

**To check pipeline status**:
```bash
# View recent workflow runs
gh run list --workflow=build-ios.yml --limit 5

# View specific run details
gh run view <run-id>

# Download logs
gh run download <run-id>
```

**Common Failure Points**:
1. **CocoaPods install** - Check Podfile.lock
2. **Xcode build** - Check for Swift/Objective-C errors  
3. **Archive creation** - Check signing configuration
4. **IPA export** - Check ExportOptions.plist

**Pipeline Trigger**:
- Pushes to `main` or `capacitor-build-test`
- Manual via GitHub Actions UI
- NOT triggered by `[skip ci]` commits

---

## 📝 NOTES

1. **Service Worker Versions**: All synced to `20260411-1aa8fe9` via pre-commit hook
2. **Relative Paths**: Critical for both GitHub Pages and Capacitor compatibility
3. **Audio API**: Uses Web API (`navigator.mediaDevices.getUserMedia`)
   - Requires HTTPS or localhost (web)
   - Works in Capacitor WebView with permissions
4. **Docker Build**: Dockerfile is currently empty - needs implementation if using containerized builds

---

## ✅ ACTION ITEMS

1. **Immediate**:
   - [ ] Add Android audio permissions
   - [ ] Add iOS microphone usage description
   - [ ] Create/verify ExportOptions.plist

2. **Short-term**:
   - [ ] Debug iOS pipeline failure (check logs)
   - [ ] Test audio recording on both platforms
   - [ ] Verify service workers work in Capacitor

3. **Long-term**:
   - [ ] Implement Docker build if needed
   - [ ] Add automated testing for audio permissions
   - [ ] Monitor cache storage usage on mobile
   - [ ] Consider Capacitor Audio plugin for native features
