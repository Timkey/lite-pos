#!/bin/bash
# Build APK using Docker build-time copy (no mounts needed)

set -e

echo "🏗️ Building Android APK (no mount required)..."

# Build Docker image with project files copied in
docker build -f Dockerfile.build -t capacitor-builder .

# Run the build
docker run --name capacitor-build-temp capacitor-builder

# Extract the APK
echo "📦 Extracting APK..."
mkdir -p builds
docker cp capacitor-build-temp:/build/android/app/build/outputs/apk/debug/app-debug.apk ./builds/business-tools-dashboard.apk

# Cleanup
docker rm capacitor-build-temp

echo "✅ Build complete!"
echo "📍 APK: builds/business-tools-dashboard.apk"
ls -lh builds/business-tools-dashboard.apk
