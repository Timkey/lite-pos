#!/bin/bash
# Prepare clean build directory for Capacitor
# Runs automatically when container starts

set -e

BUILD_DIR="/workspace/capacitor-build"
SOURCE_DIR="/workspace"

echo "🧹 Preparing clean build directory..."

# Remove old build directory if it exists
rm -rf "$BUILD_DIR"

# Create fresh build directory
mkdir -p "$BUILD_DIR"

# Copy only application files
echo "📦 Copying application files..."

# Copy root index.html (dashboard)
echo "  ✓ index.html"
cp "$SOURCE_DIR/index.html" "$BUILD_DIR/"

# Copy shop-tracker app (includes sw.js, manifest.json, all assets, CSS, JS)
echo "  ✓ shop-tracker/ (with service worker, manifest, assets)"
cp -r "$SOURCE_DIR/shop-tracker" "$BUILD_DIR/"

# Exclude documentation files from shop-tracker
echo "  ⚠ Removing documentation files from shop-tracker..."
rm -f "$BUILD_DIR/shop-tracker"/*.md

# Copy any assets at root level if they exist
if [ -d "$SOURCE_DIR/assets" ]; then
    echo "  ✓ root assets/"
    cp -r "$SOURCE_DIR/assets" "$BUILD_DIR/"
fi

echo "✅ Build directory ready at: $BUILD_DIR"
echo ""
echo "Contents:"
ls -la "$BUILD_DIR"
echo ""
echo "You can now run Capacitor commands from /workspace"
echo "Web directory is configured to: capacitor-build"
