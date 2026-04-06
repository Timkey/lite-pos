# Quick Start Guide

## Running the App Locally

### Option 1: Using Python (Simplest)

1. Open PowerShell in the `app` folder
2. Run:
```powershell
python -m http.server 8000
```
3. Open browser: `http://localhost:8000`

### Option 2: Using Node.js

1. Install http-server (one-time):
```powershell
npm install -g http-server
```
2. Run in app folder:
```powershell
http-server -p 8000
```
3. Open browser: `http://localhost:8000`

### Option 3: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## Testing the App

### 1. Start a Session
- Click "Start New Session" button
- Allow microphone access when prompted
- Recording indicator shows at top

### 2. Add Items to Cart
Try these in the calculator:
- Type: `50×3` then click "Add" (50 × 3 = 150)
- Type: `30×2=60` then click "Add"
- Type: `100×5=500 @450` then click "Add" (discount detected)

### 3. Use Number Pad
- Click number pad buttons instead of typing
- `×` for multiply
- `=` for equals
- `@` for actual charged amount
- `C` to clear
- `⌫` to backspace

### 4. Add Multiple Customer Tabs
- Click the `+` button in tab bar
- Switch between tabs by clicking them
- Each tab has independent cart and counters

### 5. Use Counters
- Click `+` button under "Available Items" when you hand item to customer
- Click `+` under "Unavailable Items" for out-of-stock requests
- Numbers update and timestamp for audio correlation

### 6. Complete Transaction
- Click "Complete Transaction" button
- Select payment method (Cash, M-Pesa, etc.)
- For Cash: Enter amount received, change calculated automatically
- Click "Confirm Payment"
- Tab closes

### 7. View History
- Click 📋 icon in header
- See past sessions with totals
- **Click session to view details** (NEW)
  - Session summary (date, time, total)
  - Audio playback controls
  - All customer tabs with items
  - Export options

### 8. Play Session Audio (NEW)
- In session detail view
- Click ▶ on any audio chunk
- Audio plays with progress bar
- Click ⏸ to pause
- Switch between chunks automatically

### 9. Export Session Data (NEW)
- In session detail view, click:
  - "Export as JSON" → Structured data
  - "Export as CSV" → Spreadsheet format
  - "Download Audio" → Audio files
- Files download to browser's download folder

### 10. Check Storage
Open browser console (F12) and type:
```javascript
shopApp.getStorageInfo()
```

### 11. Export All Data
In console:
```javascript
shopApp.exportData()
```

## Keyboard Shortcuts

- `Enter` in calculator input = Add item
- `Esc` = Close modals (when implemented)

## Testing Offline Mode

1. With app loaded, open DevTools (F12)
2. Go to "Network" tab
3. Select "Offline" from throttling dropdown
4. Try using the app - should work fully offline!

## Common Issues

**"Service Worker failed to register"**
- Must use `localhost` or `https://`
- Cannot run from `file://` protocol

**Audio not recording**
- Grant microphone permission
- Check browser console for errors
- Supported: Chrome, Edge, Safari, Firefox

**IndexedDB errors**
- Check if private/incognito mode (some browsers restrict)
- Clear site data and reload

## Browser Console Commands

```javascript
// Check app version
shopApp.version

// Get storage usage
shopApp.getStorageInfo()

// Export all data
shopApp.exportData()

// Clear all data (WARNING!)
shopApp.clearAllData()

// Access database directly
shopDB.getAll('sessions')
shopDB.getAll('tabs')
shopDB.getAll('lineItems')

// Access managers
sessionManager
tabManager
cartManager
audioRecorder
```

## Next Steps

1. **Test thoroughly** with different scenarios
2. **Test on actual tablet** (optimal device)
3. **Test on phone** (smaller screen)
4. **Test offline functionality**
5. **Test session recovery** (close browser, reopen)
6. **Test storage limits** (many sessions)

## Development Tasks Remaining

See `notes` file for full implementation plan.

**Immediate priorities:**
- [ ] Create placeholder icons (192x192, 512x512)
- [ ] Test on mobile devices
- [ ] Audio playback interface in history
- [ ] Product suggestion system
- [ ] Google Sheets integration
- [ ] Data export improvements

## Deployment

To deploy to production:

1. **Generate icons** using tool like https://realfavicongenerator.net/
2. **Update manifest.json** with correct URLs
3. **Deploy to static host** (Netlify, Vercel, GitHub Pages)
4. **Ensure HTTPS** (required for PWA features)
5. **Test on target devices**

---

**Ready to test!** 🚀

Start with Python server method - simplest and works everywhere.
