# Capacitor Docker Development Setup

This setup allows you to develop with Capacitor in a containerized environment for **Android builds**. iOS builds require macOS with Xcode and use GitHub Actions for cloud builds.

## Platform Support

| Platform | Docker Support | Build Method |
|----------|---------------|--------------|
| Android  | ✅ Full       | Docker container with Android SDK |
| iOS      | ⚠️ Preparation only | GitHub Actions (cloud build) |

## Prerequisites

- Docker
- Docker Compose  
- Colima (on macOS) with `/Volumes/mnt` mounted

## Quick Start

### 1. Build and start the container

```bash
docker-compose -f docker-compose.capacitor.yml up -d
```

The container will automatically:
- Start up
- Run the `prepare-build.sh` script
- Copy only application files (index.html, shop-tracker/) to `capacitor-build/` directory
- Exclude all documentation, Docker files, and other non-app files

### 2. Enter the container

```bash
docker-compose -f docker-compose.capacitor.yml exec capacitor-dev bash
```

### 3. Initialize Capacitor (first time only)

The `capacitor.config.json` is already configured. Just add the Android platform:

```bash
# Add Android platform
npx cap add android

# Sync (copies capacitor-build/ to native projects)
npx cap sync
```

### 4. Build the Android app

```bash
cd android
./gradlew assembleDebug

# The APK will be in: android/app/build/outputs/apk/debug/app-debug.apk
```

## How It Works

**Automated Build Preparation:**
- Every time the container starts, `prepare-build.sh` runs automatically
- Creates a clean `capacitor-build/` directory
- Copies only: `index.html` and `shop-tracker/` folder
- Excludes: All `.md` files, Docker files, scripts, notes, etc.

**Your source structure stays clean:**
```
Recon/                          # Your source (stays as-is)
├── index.html
├── shop-tracker/
├── CAPACITOR_DOCKER.md         # Not copied
├── README.md                   # Not copied
├── Dockerfile.capacitor        # Not copied
└── ...

capacitor-build/                # Auto-generated clean copy
├── index.html                  # ✓ Copied
└── shop-tracker/               # ✓ Copied
```

**Capacitor uses the clean copy:**
- `capacitor.config.json` points to `capacitor-build/` as webDir
- All Capacitor commands work with the clean directory
- No documentation or build files leak into the mobile app

## Working with the Business Tools Dashboard

Your project structure supports multiple apps:
- **Dashboard** (`index.html`) - Main launcher
- **shop-tracker/** - Active app
- Future apps ready to add

The automated build process handles everything - just work on your source files normally.

### Making Changes to Your Apps

1. Edit files in your source directory (outside container)
2. Restart the container to refresh the build:
   ```bash
   docker-compose -f docker-compose.capacitor.yml restart
   ```
3. Inside container, sync changes:
   ```bash
   npx cap sync
   ```

### Manual Build Refresh

If you need to refresh without restarting the container:

```bash
# Inside container
/usr/local/bin/prepare-build.sh
npx cap sync
```

## Useful Commands

### Build Android APK
```bash
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash
./docker/build-apk.sh
```

### Build iOS (via GitHub Actions)
```bash
# Commit and push your changes
git add .
git commit -m "Update app"
git push

# GitHub Actions will automatically build iOS
# Download IPA from Actions artifacts or check builds/ folder after workflow completes
```

See [docker/iOS-CLOUD-BUILD.md](docker/iOS-CLOUD-BUILD.md) for detailed iOS build options.

## Extracting the APK

From your host machine:

```bash
# Copy the APK from container to host
docker cp shop-tracker-capacitor:/workspace/android/app/build/outputs/apk/debug/app-debug.apk ./shop-tracker-debug.apk
```

## Stopping the container

```bash
docker-compose -f docker-compose.capacitor.yml down
```

## Notes

- The container includes Android SDK and Java 17
- Node modules and Gradle cache are persisted in Docker volumes
- Your source code is mounted, so changes sync automatically
- For iOS builds, you'll need Xcode on a macOS host
- The container runs as root for simplicity in development

## Troubleshooting

### Gradle daemon issues
```bash
./gradlew --stop
```

### Clear build cache
```bash
cd android && ./gradlew clean
```

### Rebuild container
```bash
docker-compose -f docker-compose.capacitor.yml down
docker-compose -f docker-compose.capacitor.yml build --no-cache
docker-compose -f docker-compose.capacitor.yml up -d
```
