# Testing Checklist

## Pre-Testing Setup

- [ ] Start local server: `python -m http.server 8000`
- [ ] Open in browser: `http://localhost:8000`
- [ ] Open DevTools (F12) for console monitoring
- [ ] Grant microphone permission when prompted

---

## Test 1: Basic Session Flow

### Start Session
- [ ] Click "Start New Session" button
- [ ] Verify tab appears in tab bar
- [ ] Verify "Customer 1" label shows
- [ ] Verify recording indicator appears at top
- [ ] Verify recording time starts counting
- [ ] Check console for "[Audio] Recording started" message

### Add Items
- [ ] Type `50×3` in calculator input
- [ ] Click "Add" button
- [ ] Verify item appears in cart: "50.00 × 3"
- [ ] Verify total shows 150.00
- [ ] Type `30×2=60` and add
- [ ] Verify cart now shows 2 items
- [ ] Verify cart total is 210.00

### Test Discount Detection
- [ ] Type `100×5=500 @450`
- [ ] Add to cart
- [ ] Verify discount shows: "Discount: -50.00 (10.0%)"
- [ ] Verify cart total updates correctly
- [ ] Verify original price shown with strikethrough

### Use Number Pad
- [ ] Click number pad buttons: 2 5 × 4
- [ ] Verify input shows "25×4"
- [ ] Click = button
- [ ] Verify input shows "25×4="
- [ ] Click Add
- [ ] Verify item added to cart

### Use Counters
- [ ] Click + button under "Available Items" 3 times
- [ ] Verify counter shows 3
- [ ] Click + button under "Unavailable Items" 2 times
- [ ] Verify counter shows 2

### Complete Transaction
- [ ] Click "Complete Transaction" button
- [ ] Verify payment modal appears
- [ ] Verify total amount displayed correctly
- [ ] Click "Cash" payment button
- [ ] Verify cash section appears
- [ ] Enter amount received (e.g., 500)
- [ ] Verify change calculated automatically
- [ ] Click "Confirm Payment"
- [ ] Verify tab closes
- [ ] Verify session ends (recording stops)
- [ ] Verify UI returns to "No Active Session" screen

---

## Test 2: Multi-Tab Functionality

### Create Multiple Tabs
- [ ] Start new session
- [ ] Click + button to add second tab
- [ ] Verify "Customer 2" tab appears
- [ ] Verify different color indicator
- [ ] Add third tab
- [ ] Verify "Customer 3" appears
- [ ] Verify each tab has unique color

### Switch Between Tabs
- [ ] Click on Customer 1 tab
- [ ] Verify tab highlights (active state)
- [ ] Add item to cart: `10×1`
- [ ] Click on Customer 2 tab
- [ ] Verify cart is empty (different customer)
- [ ] Add different item: `20×1`
- [ ] Switch back to Customer 1
- [ ] Verify original item still in cart

### Independent Counters
- [ ] In Customer 1 tab, increment Available to 5
- [ ] Switch to Customer 2 tab
- [ ] Verify counter shows 0
- [ ] Increment to 3
- [ ] Switch back to Customer 1
- [ ] Verify counter still shows 5

### Close Individual Tabs
- [ ] Click × on Customer 2 tab
- [ ] Complete payment or cancel
- [ ] Verify tab closes
- [ ] Verify Customer 1 and 3 still open
- [ ] Verify recording still active
- [ ] Close Customer 3
- [ ] Verify Customer 1 becomes active
- [ ] Close Customer 1
- [ ] Verify session ends

---

## Test 3: Session Recovery

### Create Session with Data
- [ ] Start new session
- [ ] Add 2 tabs with items in each cart
- [ ] Increment some counters
- [ ] **Close browser tab** (not the tab in app!)
- [ ] Reopen `http://localhost:8000`

### Verify Recovery
- [ ] Dialog appears: "Previous session found. Continue?"
- [ ] Click "OK" to continue
- [ ] Verify tabs restored
- [ ] Verify cart items still present
- [ ] Verify counters show correct values
- [ ] Verify recording restarts
- [ ] Complete and close all tabs

### Test Reject Recovery
- [ ] Start session, add items
- [ ] Close browser tab
- [ ] Reopen app
- [ ] Click "Cancel" on recovery dialog
- [ ] Verify session ended
- [ ] Verify clean state (no active session)

---

## Test 4: Calculator Formats

### Test Different Input Formats
- [ ] Start session with one tab
- [ ] Test: `50×3` → Should calculate 150
- [ ] Test: `50×3=150` → Should show 150
- [ ] Test: `50×3=150 @140` → Should detect 10 discount
- [ ] Test: `30×2.5` → Should calculate 75 (decimal quantity)
- [ ] Test: `150` → Should add as single item
- [ ] Test: `25.5×4` → Should calculate 102 (decimal price)
- [ ] Verify all items appear correctly in cart

### Test Number Pad Operations
- [ ] Click C (clear) → Input should clear
- [ ] Type some numbers, click ⌫ → Last char deleted
- [ ] Use × operator
- [ ] Use = operator
- [ ] Use @ operator
- [ ] Verify all operators work

---

## Test 5: Session Review & Audio Playback (NEW)

### View Session Detail
- [ ] Complete 2-3 sessions with items and audio
- [ ] Click 📋 to open history
- [ ] Click on a session to view details
- [ ] Verify detail view appears with:
  - [ ] Session header (date, time, duration)
  - [ ] Total sales amount
  - [ ] Audio player section
  - [ ] All customer tabs listed
  - [ ] Export buttons

### Audio Playback
- [ ] Verify audio chunks listed (Chunk 1, Chunk 2, etc.)
- [ ] Verify chunk metadata shows (time, size)
- [ ] Click ▶ on first chunk
- [ ] Verify audio starts playing
- [ ] Verify button changes to ⏸
- [ ] Verify progress bar appears and updates
- [ ] Click ⏸ to pause
- [ ] Verify audio pauses
- [ ] Click ▶ again to resume
- [ ] Let audio play to end
- [ ] Verify button resets to ▶
- [ ] Verify progress bar resets

### Play Multiple Chunks
- [ ] Play first chunk
- [ ] While playing, click ▶ on second chunk
- [ ] Verify first chunk stops
- [ ] Verify second chunk starts playing
- [ ] Verify only one audio plays at a time

### Tab Review Details
- [ ] Verify each customer tab shows:
  - [ ] Customer name with color indicator
  - [ ] Status badge (completed/cancelled)
  - [ ] Start and end times
  - [ ] Item count
  - [ ] Available/Unavailable counters
  - [ ] Payment method
  - [ ] All line items with formulas
  - [ ] Discount information
  - [ ] Total amount

### Export Session Data
- [ ] Click "Export as JSON"
- [ ] Verify JSON file downloads
- [ ] Open file and verify contains session data
- [ ] Click "Export as CSV"
- [ ] Verify CSV file downloads
- [ ] Open in spreadsheet app (Excel, Sheets)
- [ ] Verify data formatted correctly

### Download Audio
- [ ] Click "Download Audio"
- [ ] Verify audio files download (one per chunk)
- [ ] Verify files are WebM format
- [ ] Open in media player (VLC, browser)
- [ ] Verify audio plays correctly

### Navigation
- [ ] Click "← Back to History"
- [ ] Verify returns to session list
- [ ] Verify audio stops playing if was active
- [ ] Click another session
- [ ] Verify new detail view loads
- [ ] Close history modal with X button
- [ ] Reopen and verify still works

### Edge Cases
- [ ] View session with no audio chunks
- [ ] View session with empty tabs (no items)
- [ ] View cancelled transaction tabs
- [ ] Export session with no items
- [ ] Try to play non-existent audio chunk

---

## Test 6: History & Data

### Create Multiple Sessions
- [ ] Complete 3-4 full sessions with transactions
- [ ] Vary number of tabs per session
- [ ] Vary items and discounts

### View History
- [ ] Click 📋 icon in header
- [ ] Verify history modal appears
- [ ] Verify sessions listed newest first
- [ ] Verify each session shows:
  - [ ] Date and time
  - [ ] Total sales amount
  - [ ] Number of customers
  - [ ] Number of items
  - [ ] Status (completed)

### Export Data
- [ ] Open browser console (F12)
- [ ] Type: `shopApp.exportData()`
- [ ] Press Enter
- [ ] Verify file downloads
- [ ] Open file in text editor
- [ ] Verify JSON contains sessions, tabs, lineItems

### Check Storage
- [ ] In console: `shopApp.getStorageInfo()`
- [ ] Verify returns object with usage/quota
- [ ] Note percentage used

---

## Test 7: Offline Functionality

### Enable Offline Mode
- [ ] With app loaded, open DevTools (F12)
- [ ] Go to "Network" tab
- [ ] Change throttling to "Offline"
- [ ] Reload page
- [ ] Verify app still loads

### Test Offline Operations
- [ ] Start new session (should work)
- [ ] Add tabs (should work)
- [ ] Add items to cart (should work)
- [ ] Increment counters (should work)
- [ ] Complete transactions (should work)
- [ ] View history (should work)
- [ ] Verify all data persists

### Return Online
- [ ] Change throttling back to "No throttling"
- [ ] Verify app continues working
- [ ] Verify no data lost

---

## Test 8: Edge Cases

### Empty States
- [ ] View history with no sessions → Shows "No session history"
- [ ] View cart with no items → Shows "No items yet"
- [ ] Try to checkout with empty cart → Should handle gracefully

### Invalid Inputs
- [ ] Try adding item with empty input → Should show alert
- [ ] Try invalid format: `abc` → Should show alert
- [ ] Try negative numbers: `-50×3` → Test behavior

### Payment Edge Cases
- [ ] Try to confirm payment without selecting method → Shows alert
- [ ] For cash: Try to pay less than total → Shows alert
- [ ] Cancel transaction → Tab closes without payment data

### Audio Edge Cases
- [ ] Deny microphone permission → Check error handling
- [ ] Let session run 10+ minutes → Verify chunking works
- [ ] Check console for chunk save messages

### Storage Limits
- [ ] Create many sessions (20+) with audio
- [ ] Check storage: `shopApp.getStorageInfo()`
- [ ] Verify warning if over 80% (future feature)

---

## Test 9: Mobile/Tablet Testing

### Tablet (Recommended)
- [ ] Access from tablet browser
- [ ] Test touch interactions
- [ ] Verify number pad buttons large enough
- [ ] Verify counters easy to tap
- [ ] Test tab switching with swipe
- [ ] Verify layout looks good

### Phone (Optional)
- [ ] Access from phone
- [ ] Verify responsive layout
- [ ] Check if UI elements too cramped
- [ ] Test in portrait mode
- [ ] Test in landscape mode

### Install as PWA
- [ ] Look for install prompt in browser
- [ ] Install app to home screen
- [ ] Launch from home screen
- [ ] Verify works as standalone app
- [ ] Verify icon appears correctly

---

## Test 10: Performance

### Speed Tests
- [ ] Time to add 10 items quickly → Should be instant
- [ ] Switch between tabs 10 times → Should be smooth
- [ ] Load cart with 50+ items → Should handle well
- [ ] View history with 20+ sessions → Should load quickly

### Memory Tests
- [ ] Open DevTools → Performance Monitor
- [ ] Run app for extended session
- [ ] Monitor memory usage
- [ ] Check for memory leaks (continuous growth)

---

## Test 11: Data Integrity

### Verify Data Consistency
- [ ] Add items to cart
- [ ] Note total amount
- [ ] Complete payment
- [ ] View in history
- [ ] Verify amount matches
- [ ] Check console database:
  ```javascript
  shopDB.getAll('sessions').then(console.log)
  shopDB.getAll('tabs').then(console.log)
  shopDB.getAll('lineItems').then(console.log)
  ```

### Verify Audio Storage
- [ ] Complete a session
- [ ] Check audio chunks:
  ```javascript
  shopDB.getAll('audioChunks').then(console.log)
  ```
- [ ] Verify chunks saved
- [ ] Verify blob sizes reasonable

---

## Post-Testing

### Cleanup
- [ ] Clear all test data: `shopApp.clearAllData()`
- [ ] Verify clean state
- [ ] Ready for production testing

### Issues Found
Document any issues discovered:

**Issue 1:**
- Description:
- Steps to reproduce:
- Expected behavior:
- Actual behavior:

**Issue 2:**
- ...

---

## Success Criteria

✅ All core features working  
✅ No console errors during normal use  
✅ Data persists across reloads  
✅ Offline mode fully functional  
✅ Session recovery works  
✅ Multi-tab switching smooth  
✅ Calculator handles all formats  
✅ Payment processing completes  
✅ History displays correctly  
✅ Audio records and saves  

---

**Testing Complete!** 🎉

If all tests pass, the app is ready for:
1. Real user testing with shop attendants
2. Phase 2 development (Google Sheets integration)
3. Production deployment
