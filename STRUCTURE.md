# Recon Repository Structure

```
Recon/
│
├── README.md                          # Main project documentation
├── index.html                         # Dashboard landing page
├── db-inspector.html                  # Database inspection tool
├── update-sw-version.ps1             # PowerShell versioning script
│
├── .git/                             # Git repository
├── .gitattributes                    # Git line ending config
├── .gitignore                        # Git ignore rules
│
├── analytics/                        # Analytics Dashboard App
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── analytics.js              # Quality analysis engine
│       ├── app.js                    # Dashboard rendering
│       └── db-reader.js              # IndexedDB interface
│
├── shop-tracker/                     # Shop Tracker PWA
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js                         # Service worker
│   ├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── calculator.css
│   │   ├── responsive.css
│   │   ├── review.css
│   │   └── tabs.css
│   └── js/
│       ├── app.js
│       ├── audio.js
│       ├── calculator.js
│       ├── cart.js
│       ├── db.js
│       ├── review.js
│       ├── session.js
│       ├── tabs.js
│       └── ui.js
│
├── docs/                             # 📚 Documentation Hub
│   ├── README.md                     # Documentation index
│   ├── ORGANIZATION_SUMMARY.md       # This reorganization summary
│   │
│   ├── analytics/                    # Analytics Feature Documentation
│   │   ├── ANALYTICS_ENHANCEMENT_PROPOSAL.md        # Original proposal
│   │   ├── REAL_DATA_ANALYSIS.md                   # Real data findings
│   │   ├── ANALYTICS_ENHANCEMENT_IMPLEMENTATION.md # Implementation details
│   │   ├── ANALYTICS_BEFORE_AFTER.md               # Visual comparison
│   │   └── QUALITY_METRICS_GUIDE.md                # User guide
│   │
│   ├── development/                  # Development Guides
│   │   ├── MIGRATION.md              # Migration procedures
│   │   ├── MOBILE_TESTING.md         # Mobile app testing
│   │   ├── SW_VERSIONING.md          # Service worker versioning
│   │   ├── VALIDATION_STRATEGY.md    # Testing strategy
│   │   └── NOTES.md                  # Development notes
│   │
│   └── guides/                       # User Guides (reserved)
│
├── scripts/                          # 🐍 Python Scripts
│   ├── README.md                     # Scripts documentation
│   └── analyze_backup.py             # Backup data analysis
│
├── android/                          # Android build (Capacitor)
├── ios/                              # iOS build (Capacitor)
├── capacitor-build/                  # Capacitor config
│
├── node_modules/                     # NPM dependencies
└── package-lock.json                 # NPM lock file
```

## Directory Purposes

### Root Level
- **Landing pages & tools** - Main entry points
- **Config files** - Git, package.json, etc.

### `/analytics`
- Analytics Dashboard web application
- Session quality analysis
- Reads from ShopTrackerDB

### `/shop-tracker`
- Main shop tracking PWA
- Offline-first with service worker
- Audio recording and session management

### `/docs`
- **All project documentation**
- Organized by topic (analytics, development, guides)
- Searchable and well-indexed

### `/scripts`
- Python analysis scripts
- Backup data processing
- Quality metrics calculation

### `/android` & `/ios`
- Native mobile builds via Capacitor
- Platform-specific assets and configs

## File Counts

| Directory | Files |
|-----------|-------|
| Root (.md) | 1 (README.md only) |
| docs/analytics/ | 5 documentation files |
| docs/development/ | 5 guide files |
| docs/ (total) | 12 files (including READMEs) |
| scripts/ | 2 files (README + Python) |
| analytics/ | 4 JS files |
| shop-tracker/ | 9 JS files |

## Key Documentation Paths

| Document | Path |
|----------|------|
| Main README | `/README.md` |
| Docs Index | `/docs/README.md` |
| Quality Guide | `/docs/analytics/QUALITY_METRICS_GUIDE.md` |
| Scripts Guide | `/scripts/README.md` |
| Organization Summary | `/docs/ORGANIZATION_SUMMARY.md` |

## Navigation

From root:
```bash
# View documentation index
cat docs/README.md

# View scripts usage
cat scripts/README.md

# View quality metrics guide
cat docs/analytics/QUALITY_METRICS_GUIDE.md
```

## Maintenance

Keep this structure updated when:
- Adding new apps → Update main README
- Adding new docs → Add to appropriate docs/ subfolder and update docs/README.md
- Adding new scripts → Add to scripts/ and update scripts/README.md
