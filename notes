Determining the most optimal featres for setting up retail shop day to day activity tracker.
Selling
Stocking


current problem: sales records are partially captured.
shop attendant find themselves handing products to customers as they request and do math later on a calculator.
if there is more than one customer,this leads to cognitive overload. meaning even if the amount charged is correct recording sales after three customer or so depending of frequency will result in missed records.
Final reconsiliatoin of remaining stock reflectincorrectly on the system as opposd to the actual stock.

power and internet are unreliable
Assumptions
A normal pos cannot handle this due to multiple sessions running until closure. selection of items from a list may also lead to issues on sped of serving customers. there are no codes we can scan and even if there were,


possible solution-mvp prototype. 
web app that functions offline. once loaded stays on browser unless reloaded.no backend.
browser storage access to facilitate state recovery on reload or tab closure.
if possible use googlesheets as datasource get request note browser only no api to process.
if possible data submission to google form when there is internet.
Download functionality of db as an alrernate data management option
audio recording and file management.


Scene
user triggers a new session when customer walks in, 
the session starts ab audio recording.
user opens a tab for the cutomer and is able to distinguish between tabs for different users. that means he can toggle between customers as they request for items. he has two counters for each tab,one for actual products he hands the cstomer after request and another for request on items that dont exist. these are markers to help him review audio later to key records. adjascent to the counters there is a calculator for each tab where he keys in the amount and keeps going as each tab request. we can add a means for tagging actual product names to the calculation. its not a priority since user may not remember, however against each amount he keys, a background filter can bring up the actual items close to that amount. unit price and quantity separation inplay.
At closure of tab, the calculation is complete and a payment method is selected and logged against. if cash they can put amount user provides and system can compute balance. session stops recording when all tabs are closed. closure means purchase went through or enquiry from customer is over.


the user can review past sessions to update and review item selection 

Review points.
Technical feasibility
small mobile screen allowable functionality vs tablet vs larger screen. media queries
complexity to user
cognitive load reduction vs increase etc.

---

## TECHNICAL REVIEW & ANALYSIS

### Core Problem Summary
- Sales records missed due to cognitive overload when serving multiple customers
- Manual calculations after product handoff leads to incomplete transaction logs
- Stock reconciliation inaccurate (system vs actual stock mismatch)
- Unreliable power and internet infrastructure

### Proposed MVP Solution - Validated Architecture

**Session & Audio Recording Model:**
- One session can contain multiple customer tabs (typically 1-3, no hard limit)
- One continuous audio recording per session covering all customers
- Recording starts when first tab opens, stops when ALL tabs close
- Automatic chunking for long sessions (transparent to user, no interruption)
- Audio chunks auto-save progressively to prevent data loss
- Future use: Training data for speech recognition of product names/prices

**Tab Management:**
- Each customer gets their own tab with distinct visual identifier
- Tab tracks: creation time, counter states, calculator entries, closure timestamp
- Attendant toggles between tabs as customers request items
- No forced closures - attendant controls flow based on shop conditions

**Per-Tab Features:**
- Counter 1: Items handed to customer (available products)
- Counter 2: Items requested but unavailable
- Integrated calculator for running total
- Optional product name tagging to amounts (not priority)
- Background filter suggests products matching keyed amounts (based on unit price)
- Payment method selection at tab closure (cash with change calculation, mpesa, etc)

**Data Persistence & Recovery:**
- Browser storage (IndexedDB + localStorage) for state management
- Service Workers for offline functionality beyond just caching
- Session recovery if browser crashes mid-service
- All events timestamped for audio correlation

**Data Sync & Export:**
- Google Sheets as datasource (GET request, browser-only, no API processing)
- Google Forms submission when internet available
- Local download of database as backup/alternate management
- Export preserves hierarchy: session → tabs → audio chunks → events

### Technical Feasibility Assessment

**STRENGTHS:**
✓ Offline-first architecture addresses power/internet unreliability
✓ Single audio recording per session is resource-efficient
✓ Multi-tab design directly solves multi-customer problem
✓ Audio provides audit trail AND future ML training data
✓ No dependency on barcode scanners or item selection from lists (faster)
✓ Browser storage sufficient for chunked audio + transaction data
✓ Google integration provides low-tech sync option

**IMPLEMENTATION REQUIREMENTS:**
- Service Worker for true offline PWA functionality
- IndexedDB for structured data (sessions, tabs, transactions)
- MediaRecorder API with automatic chunking logic
- Media query breakpoints for phone/tablet/desktop layouts
- Timestamp synchronization between events and audio playback
- Session metadata linking audio chunks together

**DEVICE/SCREEN CONSIDERATIONS:**
- Phone: Cramped for multi-tab + dual counter + calculator interface
- Tablet: Optimal form factor for proposed UI
- Desktop: Feasible but unnecessary for mobile shop context
- RECOMMENDATION: Design for tablet-first, adapt down to large phones (6"+)

**RESOURCE CONSTRAINTS:**
- Audio storage: ~1MB/minute at 64kbps = ~100MB for 100 minutes (manageable)
- IndexedDB limit: 50MB+ typical, sufficient for transaction data
- Battery: Continuous recording drains battery - may need power bank
- Browser compatibility: MediaRecorder requires modern browser (Chrome/Edge/Safari)

### User Experience & Cognitive Load Analysis

**POTENTIAL LOAD REDUCTION:**
✓ No searching through product lists during transaction
✓ Audio backup reduces anxiety about forgotten entries
✓ Calculator per tab removes mental math burden
✓ Counters provide quick reference markers for review

**POTENTIAL LOAD INCREASE:**
⚠ Managing multiple tabs requires visual scanning
⚠ Remembering which tab belongs to which customer
⚠ Post-session audio review adds new workload
⚠ Timestamp correlation during review needs learning curve

**MITIGATION STRATEGIES:**
- Strong visual differentiation between tabs (color coding, customer numbers)
- Active tab indicator must be unmistakable
- Audio playback interface with speed control and timestamp jumps
- Practice mode for attendant training before live use

### Identified Gaps & Questions

**WORKFLOW GAPS:**
1. What happens if customer leaves without purchasing after items counted?
   - Tab closure options: Completed Purchase | Cancelled/Enquiry Only
   - Need to track conversion vs enquiries for business insights

2. Handling partial payments or split transactions
   - Mixed payment methods (part cash, part mpesa)?
   - Layaway/credit transactions?

3. Product returns/exchanges within same session or later
   - Reverse transaction flow needed?

4. Approaching storage limits - what's the user warning/action?
   - Auto-prompt to sync/export when threshold reached?

5. What if attendant forgets to start session/open tab?
   - Quick recovery mode to backdate transaction?

**TECHNICAL GAPS:**
1. Session recovery specifics if browser crashes
   - Auto-resume incomplete session on reload?
   - Or save as "interrupted" and start fresh?

2. Visual/audio alert system
   - Low battery warning
   - Storage approaching limit
   - Recording failure detection

3. Audio-to-event correlation mechanism
   - How does attendant jump to specific tab's activity in audio?
   - Click counter → timestamp → audio position linking

4. Chunking transition behavior
   - Seamless or brief pause notification?
   - Chunk size optimization (duration vs file size)

5. Google Sheets/Forms integration details
   - Data schema definition needed
   - Conflict resolution if offline edits clash with synced data
   - Authentication flow (Google account requirement?)

6. Price-to-product matching filter
   - Requires product master list with prices
   - Handling multiple products at same price point
   - What if prices change frequently?

**DATA MANAGEMENT GAPS:**
1. Stock reconciliation workflow not detailed
   - How does transaction data update inventory?
   - Manual review and adjustment process?
   - Handling of "unavailable item" counter data

2. End-of-day vs real-time reconciliation strategy

3. Multi-device scenario
   - Can multiple attendants use separate devices?
   - Data consolidation approach?

4. Historical data retention policy
   - How long to keep audio files?
   - Transaction data archival strategy

**UX/UI GAPS:**
1. Tab switching mechanism not specified
   - Swipe gestures? Button navigation? Dropdown?

2. Counter increment method
   - Tap buttons? Voice command? Gesture?

3. Calculator interaction while managing physical products
   - One-handed operation feasible?

4. Payment method selection UI
   - Quick buttons vs dropdown?

5. Session review interface design
   - Timeline view? List view? Audio-first?

### Recommendations Before Implementation

**PRIORITY 1 - CRITICAL:**
1. Define complete data schema (sessions, tabs, transactions, audio chunks)
2. Prototype multi-tab UI on target device (tablet recommended)
3. Test MediaRecorder chunking behavior and storage limits
4. Map out session states and transition logic
5. Design session recovery flow for crashes

**PRIORITY 2 - IMPORTANT:**
1. Specify Google Sheets/Forms integration schema and auth flow
2. Define all tab closure scenarios (purchase/cancelled/partial)
3. Design timestamp-to-audio correlation mechanism
4. Create visual mockups for phone vs tablet layouts
5. Plan storage warning and data export triggers

**PRIORITY 3 - NICE TO HAVE:**
1. Explore Web Speech API for future product recognition
2. Consider haptic feedback for counter increments
3. Night mode for low-light shop environments
4. Multi-language support if needed
5. Analytics dashboard for sales patterns

### Alternative Consideration

**Simpler Alternative: Sequential Queue Model**
- Single customer focus at a time
- Quick "park transaction" button to pause and start new customer
- Resume parked transactions from queue
- Same audio recording and calculator features
- Less visual complexity, potentially lower cognitive load

**Trade-off:** Doesn't match current attendant behavior of juggling multiple customers simultaneously. May force workflow change rather than support existing pattern.

**Verdict:** Multi-tab approach better fits observed behavior, but should A/B test against sequential model during pilot.

---

## CALCULATOR DESIGN SPECIFICATION

### Structured Input Model (RECOMMENDED)

**Layout per line item:**
```
[Unit Price] × [Qty] = [Line Total]  [Actual Charged] [Product hint]
   50       × 3   =     150              140          [Soap bars]
```

**Benefits of Separation:**
✓ Creates audit trail context (not just "34+40")
✓ Enables automatic discount detection
✓ Product matching works better with unit prices
✓ Quantity data useful for inventory tracking
✓ Easy to spot pricing errors during review

### Discount Detection Mechanisms

**Option 1: Automatic Variance Calculation**
- System compares: (Unit Price × Qty) vs Actual Charged
- If difference > threshold (e.g., 5%), flag as discount
- Calculate discount %: ((Expected - Actual) / Expected) × 100
- Capture: Discount amount, discount %, reason field (optional)

**Option 2: Quantity Threshold Detection**
- Product master list includes quantity-based pricing rules
  Example: Soap - 1pc=50, 3pcs=140 (save 10), 5pcs=220 (save 30)
- When Qty entered, system suggests tiered price
- Attendant confirms or overrides with actual charged
- Auto-tags transaction as "bulk discount applied"

**Option 3: Hybrid - Smart Suggestions**
- If (Unit Price × Qty) ≠ Actual Charged, system asks:
  "Discount applied? [Yes] [No] [Promo code: ___]"
- Builds discount pattern database over time
- Learns common discount scenarios for ML future use

**RECOMMENDATION: Option 3 (Hybrid)**
- Flexible for ad-hoc discounts (haggling, loyalty, damaged goods)
- Captures structured data without rigid rules
- Trains system on actual shop discount behavior

### Optimal Calculator Layout

**Version A - Horizontal Entry (Tablet-optimized):**
```
┌─────────────────────────────────────────────────┐
│ Line Items:                                     │
│ ┌────┬────┬──────┬─────────┬──────────────────┐│
│ │ UP │ Qty│ Calc │ Charged │ Product          ││
│ ├────┼────┼──────┼─────────┼──────────────────┤│
│ │ 50 │ 3  │ 150  │   140   │ [Soap suggested] ││
│ │ 30 │ 2  │  60  │    60   │ [Bread]          ││
│ └────┴────┴──────┴─────────┴──────────────────┘│
│                                                 │
│ [+ Add Item]  Subtotal: 200  Discounts: 10     │
│               Total: 200                        │
└─────────────────────────────────────────────────┘
```

**Version B - Vertical Entry (Mobile/speed-optimized):**
```
┌─────────────────────────┐
│ Item 1:                 │
│ Unit Price:   [50____]  │
│ Quantity:     [3_____]  │
│ = Calculated:  150      │
│ Charged:      [140___]  │  ← If different, discount detected
│ Product: [Soap bars__]  │
│ ✓ Add to cart           │
├─────────────────────────┤
│ Cart (2 items)          │
│ Soap bars: 140          │
│ Bread: 60               │
│ ─────────────           │
│ Total: 200              │
└─────────────────────────┘
```

**Version C - Quick-Entry Hybrid:**
```
┌──────────────────────────────────────┐
│ Quick Entry: 50 × 3 = 150  [@140]    │ ← Single line input
│ [Soap bars suggested - click to add] │
│                                      │
│ Cart:                                │
│ 1. Soap bars    50×3  150→140  -10  │
│ 2. Bread        30×2   60→60    -   │
│                                      │
│ Subtotal: 210  Discounts: 10         │
│ Total: 200                           │
└──────────────────────────────────────┘
```

### Layout Comparison

| Aspect | Version A (Table) | Version B (Vertical) | Version C (Quick) |
|--------|-------------------|----------------------|-------------------|
| Speed | Medium | Slow | **Fast** |
| Context visibility | **High** | Low | **High** |
| Screen space | Medium | **Low** | **Low** |
| Discount detection | **Automatic** | **Automatic** | **Automatic** |
| One-handed use | No | **Yes** | **Yes** |
| Error correction | Easy | Easy | **Easiest** |
| Data quality | **High** | **High** | Medium |

**RECOMMENDATION: Version C with expandable detail**
- Default: Quick single-line entry for speed
- Tap line item → expands to show full detail/edit
- Discount auto-detected on variance between calc and charged
- Product suggestions appear as attendant types
- Balance between speed and context trail

### Input Flow Example (Version C)

```
Step 1: Attendant enters "50×3"
→ System shows: "= 150"

Step 2: If charged = 150
→ Attendant presses Enter, item added to cart
→ Product suggestion: "Soap bars (50)?" - tap to tag

Step 3: If charged = 140 (different)
→ "[@140]" field appears (cursor auto-placed)
→ Attendant types 140, presses Enter
→ System detects: -10 discount (6.7%)
→ Prompts: "Reason? [Bulk] [Promo] [Damaged] [Skip]"
→ Item added with discount metadata

Step 4: Running total updates
→ Cart shows: "Soap ×3 @ 140 (-10)"
→ Attendant can tap to edit/remove
```

### Discount Data Capture Schema

```javascript
{
  lineItem: {
    unitPrice: 50,
    quantity: 3,
    calculatedTotal: 150,
    actualCharged: 140,
    discountAmount: 10,
    discountPercent: 6.7,
    discountReason: "bulk", // or "promo", "damaged", "loyalty", "other"
    discountCode: null, // for future promo code tracking
    productId: "soap-001", // if tagged
    productName: "Soap bars",
    timestamp: "2026-04-05T14:23:45"
  }
}
```

### Additional Calculator Features

**Auto-calculation modes:**
- Mode 1: Enter UP & Qty → Calc total (default)
- Mode 2: Enter Total & Qty → Calc unit price (reverse pricing)
- Mode 3: Enter Total only → Skip quantity (weighted items like sugar bulk)

**Smart behaviors:**
- Pressing = after "50×3" auto-advances to charged field if discount expected
- Pressing Enter after "50×3=150" adds item if no discount
- Last 5 products quick-access buttons (frequent items)
- Decimal support for fractional quantities (e.g., 2.5 kg)

**Accessibility:**
- Large touch targets (min 44×44px)
- Number pad integrated (no need for system keyboard)
- Swipe-to-delete cart items
- Undo last entry button

### Discount Pattern Learning (Future)

Over time, system builds knowledge:
- "Soap bars at qty=3 usually get 7% discount"
- "Customer X frequently gets loyalty discount"
- "Fridays have promo discounts on item Y"

Then proactively suggests:
- "Apply usual 3-pack discount?"
- "Loyalty customer detected - apply 10%?"

---

## BARCODE SCANNING INTEGRATION (FUTURE PHASE)

### Technical Feasibility - Browser-Only Implementation

**HTML5 APIs Available (Offline Capable):**
- `getUserMedia()` - Camera access
- JavaScript barcode libraries (client-side, no backend):
  - **QuaggaJS** / **@ericblade/quagga2** - 1D barcodes (EAN-13, UPC, Code128)
  - **ZXing** browser port - 1D & 2D (QR codes, DataMatrix)
  - ~80KB gzipped, offline decoding

**Hybrid Input Flow:**
- PATH A: Barcode scan → auto-fills product name + unit price → enter quantity
- PATH B: Manual entry (current flow) for non-barcoded items
- Optional enhancement, not required for core functionality

**Integration Points:**
- Scan button in calculator interface
- Product database with barcode column (synced from Google Sheets)
- Local barcode→product lookup (IndexedDB)
- Graceful fallback to manual entry

**Challenges:**
- Requires product database maintenance (barcodes + prices)
- Camera permissions needed
- Poor lighting / damaged barcodes → manual fallback
- Not all items have barcodes (loose goods, bulk items)

**Recommendation: Phase 2 Implementation**
- MVP works fully without camera
- Add barcode scanning after core features stable
- Test with shops that have mixed inventory (barcoded + loose items)

---

## IMPLEMENTATION PLAN

### PHASE 1: CORE MVP - Offline Session Management (PRIORITY)
**Goal:** Functional multi-tab calculator with audio recording, fully offline

#### Milestone 1.1: Project Setup & Infrastructure (Week 1)
**Deliverables:**
- [ ] Initialize project structure (HTML/CSS/JS or framework choice)
- [ ] Set up Service Worker for offline PWA functionality
- [ ] Configure IndexedDB schema for sessions, tabs, line items
- [ ] Implement localStorage fallback for basic state
- [ ] Create development environment (local server, build tools)
- [ ] Set up version control (git repository)

**Technical Tasks:**
- Define IndexedDB schema:
  ```javascript
  // sessions table
  { sessionId, startTime, endTime, status, audioChunks[] }
  
  // tabs table
  { tabId, sessionId, customerId, startTime, endTime, status }
  
  // lineItems table
  { itemId, tabId, unitPrice, quantity, calculatedTotal, 
    actualCharged, discountAmount, discountReason, 
    productName, timestamp }
  
  // counters table
  { counterId, tabId, availableCount, unavailableCount }
  ```
- Service Worker caching strategy
- Basic PWA manifest (installable app)

#### Milestone 1.2: Audio Recording System (Week 1-2)
**Deliverables:**
- [ ] Implement MediaRecorder API integration
- [ ] Session-level recording (starts with first tab, stops when all close)
- [ ] Automatic chunking for long sessions (seamless transitions)
- [ ] Progressive saving of audio chunks to IndexedDB
- [ ] Audio playback interface with timestamp controls
- [ ] Recording state indicators (recording/paused/stopped)

**Technical Tasks:**
- MediaRecorder configuration (codec: webm/opus, bitrate: 64kbps)
- Chunk size optimization (duration vs file size)
- Handle recording failures gracefully
- Browser compatibility testing (Chrome, Edge, Safari)
- Audio blob → IndexedDB storage
- Playback controls (play/pause, speed control, timestamp jump)

#### Milestone 1.3: Multi-Tab Interface (Week 2-3)
**Deliverables:**
- [ ] Tab creation/switching/closing UI
- [ ] Visual differentiation between tabs (color coding, customer numbers)
- [ ] Active tab indicator (unmistakable visual cue)
- [ ] Tab state persistence across browser reloads
- [ ] Maximum efficiency for 1-3 concurrent tabs
- [ ] Mobile/tablet responsive design (media queries)

**Technical Tasks:**
- Tab component architecture
- State management (active tab, tab list)
- Tab switching mechanism (swipe gestures + button navigation)
- Color palette for tab identification
- Session recovery on page reload
- Touch-optimized UI (44×44px minimum targets)

#### Milestone 1.4: Calculator Implementation - Version C (Week 3-4)
**Deliverables:**
- [ ] Quick-entry input: `50×3=150 [@140]` single-line format
- [ ] Automatic discount detection (calculated vs actual)
- [ ] Running cart display with line items
- [ ] Integrated number pad (no system keyboard needed)
- [ ] Product name suggestion/tagging (optional)
- [ ] Edit/delete line items functionality
- [ ] Running total calculation

**Technical Tasks:**
- Input parser for `UnitPrice×Quantity` format
- Auto-calculation engine
- Discount variance detection logic
- Cart state management per tab
- Number pad component (large touch targets)
- Product suggestion filter (based on unit price from local DB)
- Line item timestamp recording

#### Milestone 1.5: Counters & Session Controls (Week 4)
**Deliverables:**
- [ ] Available items counter (tap to increment)
- [ ] Unavailable items counter (tap to increment)
- [ ] Session start/stop controls
- [ ] Tab closure with payment method selection
- [ ] Cash payment with change calculation
- [ ] Counter timestamps for audio correlation

**Technical Tasks:**
- Counter components with large tap targets
- Increment/decrement logic with timestamp
- Payment method UI (Cash, M-Pesa, Credit, etc.)
- Change calculator
- Tab closure flow (Purchase/Cancelled/Enquiry)
- Counter → timestamp → audio position linking

#### Milestone 1.6: Session Review Interface (Week 5)
**Deliverables:**
- [ ] Past sessions list view
- [ ] Session detail view (tabs, line items, totals)
- [ ] Audio playback with session context
- [ ] Timeline view of session events
- [ ] Edit line items in past sessions
- [ ] Filter/search sessions by date/amount

**Technical Tasks:**
- Sessions list component (paginated/infinite scroll)
- Session detail rendering
- Audio player integration with session timeline
- Event timeline visualization
- Edit mode for historical data
- IndexedDB queries for session retrieval

#### Milestone 1.7: Testing & Refinement (Week 5-6)
**Deliverables:**
- [ ] Cross-browser testing (Chrome, Edge, Safari)
- [ ] Device testing (tablet primary, phone secondary)
- [ ] Offline functionality verification
- [ ] Audio recording stress testing (long sessions)
- [ ] Storage limit testing and warnings
- [ ] Crash recovery testing
- [ ] User acceptance testing with shop attendant

**Technical Tasks:**
- Test on target devices (actual tablets/phones)
- Simulate offline conditions
- Test audio chunking at various durations
- Test storage quota exceeded scenarios
- Test browser crash recovery
- Performance profiling
- Fix identified bugs

---

### PHASE 2: Data Transfer & Sync (PRIORITY AFTER PHASE 1)
**Goal:** Google Sheets integration for product database and transaction sync

#### Milestone 2.1: Google Sheets Product Database (Week 7)
**Deliverables:**
- [ ] Define product master sheet structure
- [ ] Implement CSV export URL fetching (public sheet, no auth required)
- [ ] Parse CSV and store products in IndexedDB
- [ ] Periodic sync when internet available
- [ ] Last sync timestamp indicator
- [ ] Manual refresh option

**Technical Tasks:**
- **Public Google Sheets approach (no authentication)**
  - Sheet structure:
    ```
    ProductID | Name | UnitPrice | Category | BulkPricing | Barcode
    soap-001  | Soap | 50        | toiletry | 3:140,5:220 | (future)
    ```
  - Convert share link to CSV export URL:
    `https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}`
  - Browser fetch API (no backend required)
  - Parse CSV to JSON
  - Store in IndexedDB products table
  - Check access before syncing
  - Handle network errors gracefully
- Sheet requirements:
  - Set to "Anyone with the link can view"
  - First row must be headers
  - Data starts from row 2
- Offline-first: Use cached data if no internet
- Sync conflict resolution: Server data wins for MVP
- Background sync when internet detected

#### Milestone 2.2: Google Forms Transaction Submission (Week 7-8)
**Deliverables:**
- [ ] Define Google Form structure with all transaction fields
- [ ] Get form entry IDs from pre-filled link
- [ ] Background sync queue for pending submissions
- [ ] Automatic submission when internet detected
- [ ] Manual export option (download JSON/CSV) as backup
- [ ] Submission status indicators
- [ ] Retry logic for failed submissions

**Technical Tasks:**
- **Google Forms submission (no authentication, no-cors mode)**
  - Form structure mapping:
    ```
    SessionID | TabID | Timestamp | ProductName | UnitPrice | 
    Quantity | Total | Discount | PaymentMethod | CustomerID
    ```
  - Get entry IDs process:
    1. Create Google Form with all fields
    2. Click "Get pre-filled link"
    3. Fill dummy data
    4. Extract entry.XXXXXX IDs from generated URL
  - Form submission via fetch API:
    ```javascript
    fetch(formUrl, {
      method: 'POST',
      mode: 'no-cors', // Required for cross-origin form submission
      body: new URLSearchParams({
        'entry.123456': value1,
        'entry.789012': value2
      })
    })
    ```
  - No response validation possible with no-cors (assume success)
  - Queue failed submissions in IndexedDB for retry
- Background Sync API (queue submissions offline)
- Network status detection (navigator.onLine)
- Export to JSON/CSV for manual download as fallback
- Submission retry with exponential backoff
- Submission history log in IndexedDB
- Visual indicator: pending/synced/failed status

**Configuration Setup:**
- Settings panel to input:
  - Google Sheet ID (product database)
  - Google Form ID (transaction submissions)
  - Sheet GID (tab number, default 0)
  - Sync frequency (manual, hourly, daily)
- Store config in localStorage
- Validate sheet/form access on setup

#### Milestone 2.3: Data Management & Reconciliation (Week 8)
**Deliverables:**
- [ ] Storage quota monitoring and warnings
- [ ] Data export functionality (full database download)
- [ ] Data import functionality (restore from backup)
- [ ] Audio file cleanup options (auto-delete after sync)
- [ ] Transaction history archival strategy
- [ ] End-of-day reconciliation report
- [ ] Sync status dashboard

**Technical Tasks:**
- Storage quota API integration
- Warning thresholds (80% → warn, 95% → force export)
- Export IndexedDB to JSON file (download)
- Import JSON to restore state
- Audio retention policy (configurable: 7/14/30 days)
- Auto-cleanup after successful form submission (optional)
- Reconciliation report generator:
  - Total sales by payment method
  - Discount summary
  - Unavailable items list (stock needs)
  - Conversion rate (purchases vs enquiries)
  - Product database last sync time
  - Pending form submissions count
  - Synced vs unsynced sessions
- Settings UI for:
  - Google Sheet ID input
  - Google Form ID input
  - Sync frequency
  - Audio retention period
  - Auto-cleanup preferences

#### Milestone 2.4: Sync Testing & Optimization (Week 9)
**Deliverables:**
- [ ] Test sync with intermittent internet
- [ ] Test large data exports
- [ ] Optimize sync performance
- [ ] Test data consistency across sync cycles
- [ ] User acceptance testing for data workflows
- [ ] Test Google Sheets access (public sheet validation)
- [ ] Test Google Forms submission with no-cors mode
- [ ] Verify form entry IDs mapping

**Testing Scenarios:**
- Public sheet not accessible (wrong ID, permissions changed)
- CSV parsing errors (malformed data, missing headers)
- Form submission failures (network errors, invalid entry IDs)
- Offline queue buildup and batch sync
- Concurrent product database updates
- Sheet structure changes (added/removed columns)
- Large product catalogs (1000+ items)
- Network interruption during sync
- Browser storage quota exceeded during sync

---

### PHASE 3: Barcode Scanning (FUTURE)
**Goal:** Optional camera-based barcode scanning for faster product entry

#### Milestone 3.1: Barcode Library Integration (Week 10+)
**Deliverables:**
- [ ] Integrate QuaggaJS/Quagga2 library
- [ ] Camera permission handling
- [ ] Barcode scan modal interface
- [ ] Barcode → product lookup from local DB
- [ ] Fallback to manual entry

#### Milestone 3.2: Product Database Enhancement (Week 10+)
**Deliverables:**
- [ ] Add barcode column to Google Sheets
- [ ] Barcode data import and indexing
- [ ] Handle unknown barcodes (manual price entry + save for later)

#### Milestone 3.3: UX Refinement & Testing (Week 11+)
**Deliverables:**
- [ ] Test scanning in various lighting conditions
- [ ] Optimize scan speed and accuracy
- [ ] User testing with mixed inventory (barcoded + manual)

---

### PHASE 4: Advanced Features (FUTURE)
**Goal:** Enhanced functionality based on user feedback

**Potential Features:**
- [ ] Speech recognition for product names (Web Speech API)
- [ ] Multi-device support (sync between attendants)
- [ ] Analytics dashboard (sales trends, popular products)
- [ ] Customer loyalty tracking
- [ ] Inventory management integration
- [ ] Promo code system
- [ ] Night mode / accessibility features
- [ ] Multi-language support
- [ ] Print receipt functionality

---

## TECHNICAL STACK RECOMMENDATION

### Core Technologies
- **Frontend:** Vanilla JavaScript (or React/Vue for state management)
- **Storage:** IndexedDB (Dexie.js wrapper for easier API)
- **Audio:** MediaRecorder API (native browser)
- **Offline:** Service Worker + Cache API
- **UI:** CSS Grid/Flexbox, responsive design
- **Build:** Vite or Webpack (for bundling, dev server)
- **Google Integration:** Public Sheets CSV export, Forms no-cors submission (no authentication)

### Browser Requirements
- **Minimum:** Chrome 80+, Edge 80+, Safari 14+ (for MediaRecorder support)
- **Recommended:** Latest stable browsers

### Device Requirements
- **Optimal:** 7-10" tablet with rear camera
- **Minimum:** 6"+ smartphone with 2GB RAM
- **Battery:** Power bank recommended for continuous use

### Google Sheets/Forms Setup
**Product Database (Google Sheets):**
- Create spreadsheet with product data
- Share: "Anyone with the link can view"
- Copy Sheet ID from URL
- Note GID (tab ID, usually 0 for first tab)
- No API key or authentication required

**Transaction Submission (Google Forms):**
- Create form with all transaction fields
- Get pre-filled link with dummy data
- Extract entry IDs (entry.123456789, etc.)
- No authentication required for submission
- Responses stored in linked Google Sheet

---

## DEVELOPMENT TIMELINE

**Phase 1 (Core MVP):** 6 weeks
- Weeks 1-2: Infrastructure + Audio
- Weeks 3-4: Multi-tab + Calculator
- Weeks 5-6: Review + Testing

**Phase 2 (Data Sync):** 3 weeks
- Weeks 7-8: Google Sheets/Forms integration
- Week 9: Testing + Optimization

**Phase 3 (Barcode):** 2-3 weeks (after Phase 2 complete)

**Phase 4 (Advanced):** Ongoing based on feedback

**Total MVP (Phase 1+2):** ~9 weeks
**Full Featured (Phase 1-3):** ~12 weeks

---

## SUCCESS METRICS

**Phase 1 (Core MVP):**
- ✓ Can record 30+ minute session without crashes
- ✓ Handle 3 concurrent customer tabs smoothly
- ✓ Audio playback syncs with transaction timestamps
- ✓ Works offline for full day (8+ hours)
- ✓ Storage handles 50+ sessions before warning

**Phase 2 (Data Sync):**
- ✓ Product database syncs in <10 seconds
- ✓ Transaction submissions succeed 95%+ of attempts
- ✓ Export/import completes in <30 seconds
- ✓ No data loss during sync failures

**User Acceptance:**
- ✓ Attendant can serve customers faster than before
- ✓ Sales record capture improves to 90%+ (vs current ~60%)
- ✓ Stock reconciliation accuracy improves
- ✓ Attendant adopts tool willingly (low learning curve)

---

## NEXT IMMEDIATE ACTIONS
1. Choose framework (Vanilla JS vs React/Vue)
2. Set up development environment
3. Create basic project structure
4. Start Milestone 1.1 (Project Setup & Infrastructure)
5. Design initial UI mockups for multi-tab calculator