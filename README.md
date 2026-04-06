# Business Tools Dashboard

## Project Structure

This repository contains multiple business applications accessible from a central dashboard.

```
/
├── index.html                 # Landing page dashboard
├── shop-tracker/              # Shop Activity Tracker App
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── css/
│   ├── js/
│   └── assets/
├── notes                      # Project documentation
└── VALIDATION_STRATEGY.md
```

## Applications

### 1. Shop Tracker (Active)
**Path:** `/shop-tracker/`
**Database:** `ShopTrackerDB` (IndexedDB)
**Features:**
- Offline-first PWA
- Multi-customer tab management
- Audio recording with session sync
- Calculator with history
- Session validation and review
- Data export/import

**Access:** Navigate to `/shop-tracker/index.html` or click from dashboard

### Future Apps
- Analytics Dashboard
- Inventory Manager
- Customer Manager

## Data Separation

Each application uses its own isolated IndexedDB database:
- **Shop Tracker:** `ShopTrackerDB`
- **Future apps:** Will use unique database names (e.g., `AnalyticsDB`, `InventoryDB`)

This ensures:
- No data conflicts between applications
- Independent data management
- Easy backup/restore per application
- Browser storage quota management per app

## Development

### Running Locally
1. Serve from root directory: `python -m http.server 8000`
2. Access dashboard: `http://localhost:8000/`
3. Access Shop Tracker: `http://localhost:8000/shop-tracker/`

### Adding New Apps
1. Create new folder: `/new-app-name/`
2. Add app entry to `index.html` dashboard
3. Use unique IndexedDB database name
4. Configure service worker scope: `/new-app-name/`

## Browser Storage

Each app manages its own storage:
- **IndexedDB:** Application data
- **Service Worker Cache:** Offline resources
- **LocalStorage:** User preferences (if needed)

## PWA Configuration

Each app has its own:
- Service worker (`sw.js`)
- Manifest (`manifest.json`)
- Start URL and scope
- Icon assets

This allows each app to be installed independently as a PWA.

## Notes

- Existing Shop Tracker data is preserved during folder reorganization
- Service worker caches are app-specific
- Dashboard is lightweight (no heavy dependencies)
