# Shop Activity Tracker - Offline PWA

A Progressive Web App for retail shops to track daily sales activities with offline support, multi-customer tab management, and audio recording.

## Features

### Phase 1 - Core MVP ✅
- **Offline-first PWA** - Works without internet connection
- **Multi-tab customer management** - Serve multiple customers simultaneously
- **Audio session recording** - Automatic recording with chunking
- **Smart calculator** - Quick entry format: `50×3=150 @140`
- **Discount detection** - Automatic variance calculation
- **Session recovery** - Resume interrupted sessions on reload
- **IndexedDB storage** - Persistent local database
- **Session review** - View past sessions with audio playback
- **Data export** - JSON, CSV, and audio download per session

### Phase 2 - Data Transfer (Coming Soon)
- Google Sheets product database sync
- Google Forms transaction submission
- Export/import functionality
- Storage management

### Phase 3 - Barcode Scanning (Future)
- Camera-based barcode scanning
- Product lookup from database

## Quick Start

1. **Install Dependencies**
   - No dependencies! Pure HTML/CSS/JavaScript

2. **Run Locally**
   ```powershell
   # Navigate to app directory
   cd app
   
   # Start a local server (Python)
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

3. **Open in Browser**
   - Navigate to `http://localhost:8000`
   - Chrome, Edge, or Safari recommended

4. **Install as PWA**
   - Click browser install prompt
   - Or use browser menu: "Install Shop Tracker"

## Usage

### Starting a Session
1. Click "Start New Session" to create first customer tab
2. Audio recording begins automatically
3. Add more tabs with the "+" button

### Adding Items
Use the calculator with these formats:
- `50×3` - Unit price × quantity (auto-calculates)
- `50×3=150` - With calculated total
- `50×3=150 @140` - With actual charged amount (discount detected)
- `150` - Just total amount

### Managing Customers
- Click tabs to switch between customers
- Use counters to track available/unavailable items
- View running cart with totals

### Completing Transaction
1. Click "Complete Transaction"
2. Select payment method (Cash, M-Pesa, Card, Credit)
3. For cash: Enter amount received, change calculated automatically
4. Confirm payment to close tab

### Ending Session
- Session ends automatically when all tabs are closed
- Audio recording stops
- Data saved to IndexedDB

### Reviewing Past Sessions
1. Click 📋 icon to view history
2. Click any session to view details
3. **Session detail view shows:**
   - Session summary (date, time, duration, total sales)
   - Audio recordings with playback controls
   - All customer tabs with items and totals
   - Counter statistics per tab
   - Payment method used
4. **Play audio recordings:**
   - Click ▶ button on any audio chunk
   - Progress bar shows playback position
   - Click ⏸ to pause
5. **Export session data:**
   - Export as JSON (structured data)
   - Export as CSV (spreadsheet-compatible)
   - Download audio files (WebM format)

## Calculator Input Examples

| Input | Meaning |
|-------|---------|
| `50×3` | 3 items @ 50 each = 150 |
| `50×3=150` | Same, with explicit total |
| `50×3=150 @140` | Customer charged 140 (10 discount) |
| `30×2.5` | 2.5 units @ 30 = 75 |
| `150` | Single item, total 150 |

## Data Management

### Export Data
```javascript
// Open browser console (F12)
shopApp.exportData()
```
Downloads JSON file with all sessions, tabs, and items.

### Import Data
```javascript
// In console
const input = document.createElement('input');
input.type = 'file';
input.onchange = e => shopApp.importData(e.target.files[0]);
input.click();
```

### Check Storage
```javascript
shopApp.getStorageInfo()
```

### Clear All Data
```javascript
shopApp.clearAllData()
```

## Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| PWA | ✅ | ✅ | ✅ | ⚠️ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |

**Recommended:** Chrome or Edge on Android tablets

## File Structure

```
app/
├── index.html              # Main HTML
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   ├── main.css           # Core styles
│   ├── tabs.css           # Tab styles
│   ├── calculator.css     # Calculator styles
│   └── responsive.css     # Responsive design
├── js/
│   ├── db.js              # IndexedDB layer
│   ├── audio.js           # Audio recording
│   ├── session.js         # Session management
│   ├── tabs.js            # Tab management
│   ├── calculator.js      # Calculator logic
│   ├── cart.js            # Cart management
│   ├── ui.js              # UI interactions
│   └── app.js             # Main app entry
└── assets/
    └── (icons)
```

## Development Roadmap

**Phase 1 (Weeks 1-6)** - ✅ Complete
- Core offline functionality
- Multi-tab interface
- Audio recording
- Calculator with discount detection

**Phase 2 (Weeks 7-9)** - In Progress
- Google Sheets integration
- Data sync functionality
- Export/import features

**Phase 3 (Weeks 10-12)** - Future
- Barcode scanning
- Product database
- Enhanced product matching

## Technical Details

### Storage Schema

**Sessions Table**
```javascript
{
  sessionId: string,
  startTime: ISO date,
  endTime: ISO date,
  status: 'active' | 'completed',
  audioChunks: string[]
}
```

**Tabs Table**
```javascript
{
  tabId: string,
  sessionId: string,
  customerId: string,
  startTime: ISO date,
  endTime: ISO date,
  status: 'open' | 'completed' | 'cancelled',
  availableCount: number,
  unavailableCount: number,
  paymentMethod: string,
  total: number
}
```

**Line Items Table**
```javascript
{
  itemId: string,
  tabId: string,
  unitPrice: number,
  quantity: number,
  calculatedTotal: number,
  actualCharged: number,
  discountAmount: number,
  discountPercent: number,
  productName: string,
  timestamp: ISO date
}
```

### Audio Recording
- Format: WebM with Opus codec
- Bitrate: 64 kbps
- Automatic chunking: Every 5 minutes
- Progressive saving to IndexedDB
- Estimated size: ~1 MB per minute

## Troubleshooting

**Audio not recording**
- Check microphone permissions
- Ensure HTTPS or localhost
- Try different browser

**App not working offline**
- Ensure Service Worker registered
- Check browser console for errors
- Reload page to update cache

**Storage quota exceeded**
- Export and clear old sessions
- Delete audio chunks from old sessions
- Use `shopApp.getStorageInfo()` to check usage

## License

MIT License - Free to use and modify

## Support

For issues or questions, check browser console (F12) for error messages.

---

Built with ❤️ for retail shop attendants
