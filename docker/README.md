# Docker Setup for Capacitor Builds

This folder contains all Docker-related files for building Android APKs using Capacitor.

## Files

- `Dockerfile` - Container image with Android SDK, Java, Node.js, and Capacitor
- `docker-compose.yml` - Container orchestration
- `prepare-build.sh` - Script that creates clean build directory (auto-runs on startup)
- `build-apk.sh` - Script to build the Android APK

## Quick Start

### Initial Setup

```bash
# From the project root directory
cd /path/to/Recon

# Start the container (Colima must be running with /Volumes/mnt mounted)
docker-compose -f docker/docker-compose.yml up -d

# Enter the container
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash

# First time only: Install dependencies and add Android platform
npm install
npx cap add android
```

### Building the APK

```bash
# Make the build script executable and run it
chmod +x docker/build-apk.sh
./docker/build-apk.sh
```

The APK will be output to: `builds/business-tools-dashboard.apk`

### Subsequent Builds

After making changes to your source files:

```bash
# Option 1: Restart container (refreshes build directory automatically)
docker-compose -f docker/docker-compose.yml restart

# Enter container and rebuild
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash
./docker/build-apk.sh
```

```bash
# Option 2: Manual refresh without restart
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash
/usr/local/bin/prepare-build.sh
./docker/build-apk.sh
```

## How It Works

1. **Automated Preparation**: When the container starts, `prepare-build.sh` automatically:
   - Creates `capacitor-build/` directory
   - Copies `index.html` and `shop-tracker/` (including service worker, manifest, assets)
   - Excludes all `.md` documentation files
   - Excludes Docker files and build scripts

2. **Clean Build Directory**: Only application files needed for the mobile app are copied:
   ```
   capacitor-build/
   ├── index.html          # Dashboard launcher
   └── shop-tracker/       # Main app
       ├── sw.js          # Service worker ✓
       ├── manifest.json  # PWA manifest ✓
       ├── index.html
       ├── assets/
       ├── css/
       └── js/
   ```

3. **Build Output**: The APK is placed in `builds/` folder which is:
   - Accessible from your host machine
   - Available for download from the dashboard at `/builds/business-tools-dashboard.apk`

## Colima Configuration

**Important**: Colima must have `/Volumes/mnt` mounted. Check your `~/.colima/default/colima.yaml`:

```yaml
mounts:
  - location: /Volumes/mnt
    writable: true
```

If not configured, add it and restart Colima:
```bash
colima restart
```

## Troubleshooting

### Container won't start
- Ensure Colima is running: `colima status`
- Check mounts are configured: `cat ~/.colima/default/colima.yaml`
- Restart Colima: `colima restart`

### Build fails
```bash
# Clean and rebuild
docker-compose -f docker/docker-compose.yml exec capacitor-dev bash
cd android && ./gradlew clean
cd .. && ./docker/build-apk.sh
```

### APK not appearing
- Check: `ls -la builds/`
- Verify the build script completed successfully
- Check container logs: `docker-compose -f docker/docker-compose.yml logs`

## Container Management

```bash
# Start
docker-compose -f docker/docker-compose.yml up -d

# Stop
docker-compose -f docker/docker-compose.yml down

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Rebuild image
docker-compose -f docker/docker-compose.yml build --no-cache
```
