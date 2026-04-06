#!/bin/bash
# Build iOS .ipa file
# NOTE: This script must run on macOS with Xcode installed (not in Docker)

set -e

echo "🍎 Building iOS .ipa..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: iOS builds require macOS with Xcode installed"
    echo "This script cannot run in a Docker container"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode is not installed"
    echo "Please install Xcode from the Mac App Store"
    exit 1
fi

# Ensure we're in the right directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Check if ios platform exists
if [ ! -d "ios" ]; then
    echo "❌ iOS platform not found. Run 'npx cap add ios' first."
    exit 1
fi

# Sync web assets with native project using Docker
echo "📱 Syncing Capacitor (via Docker)..."
docker-compose -f docker/docker-compose.yml exec -T capacitor-dev npx cap sync ios

# Build the app
echo "🔨 Building iOS app..."
cd ios/App

# Clean build folder
xcodebuild clean \
    -workspace App.xcworkspace \
    -scheme App \
    -configuration Release

# Build archive
echo "📦 Creating archive..."
xcodebuild archive \
    -workspace App.xcworkspace \
    -scheme App \
    -configuration Release \
    -archivePath "./build/App.xcarchive" \
    -allowProvisioningUpdates \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

# Export IPA
echo "📤 Exporting IPA..."
xcodebuild -exportArchive \
    -archivePath "./build/App.xcarchive" \
    -exportPath "./build" \
    -exportOptionsPlist "../../scripts/ExportOptions.plist"

# Copy IPA to builds folder
echo "💾 Copying IPA to builds folder..."
cd ../..
mkdir -p builds
cp ios/App/build/*.ipa builds/business-tools-dashboard.ipa

echo "✅ Build complete!"
echo "📍 IPA location: builds/business-tools-dashboard.ipa"
echo "💾 IPA size: $(du -h builds/business-tools-dashboard.ipa | cut -f1)"
