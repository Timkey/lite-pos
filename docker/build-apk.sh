#!/bin/bash
# Build and export Android APK
# This script runs inside the container after initial setup

set -e

echo "🏗️ Building Android APK..."

# Ensure we're in the right directory
cd /workspace

# Check if android platform exists
if [ ! -d "android" ]; then
    echo "❌ Android platform not found. Run 'npx cap add android' first."
    exit 1
fi

# Sync web assets with native project
echo "📱 Syncing Capacitor..."
npx cap sync android

# Build the APK
echo "🔨 Building debug APK..."
cd android
./gradlew assembleDebug

# Copy APK to builds folder
echo "📦 Copying APK to builds folder..."
mkdir -p /workspace/builds
cp app/build/outputs/apk/debug/app-debug.apk /workspace/builds/business-tools-dashboard.apk

echo "✅ Build complete!"
echo "📍 APK location: /workspace/builds/business-tools-dashboard.apk"
echo "💾 APK size: $(du -h /workspace/builds/business-tools-dashboard.apk | cut -f1)"
