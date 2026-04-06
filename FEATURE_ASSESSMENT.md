# Post-Completion Feature Assessment

## Current System Capabilities

### Existing Data Structure
- **Sessions**: Track entire work sessions with start/end times, status, total sales
- **Tabs**: Individual customer transactions within a session
- **LineItems**: Individual products with pricing, quantity, discounts
- **Products**: Product catalog (currently defined but unused)
- **AudioChunks**: Recording chunks for session playback
- **Events**: Timeline events for counter clicks, navigation, etc.

### Current Review System
Located in `shop-tracker/js/review.js`:
- Session history list with filtering (date range, customer search, pagination)
- Detailed session view with:
  - Summary stats (total sales, duration, status)
  - Audio playback capabilities
  - Event timeline visualization
  - Per-tab transaction details
  - Export functionality
- Read-only display of completed sessions

---

## Phase 1: Post-Completion Editing

### 1.1 Edit Unnamed Items
**Objective**: Allow users to assign product names to "Unnamed item" entries after transaction completion

**Current State**: 
- LineItems have `productName` field (defaults to "Unnamed item")
- No editing capability in review mode

**Implementation Plan**:
```javascript
// Add to LineItem schema
{
  itemId: string,
  tabId: string,
  productId: string | null,  // Link to products table
  productName: string,        // "Unnamed item" or actual name
  unitPrice: number,
  quantity: number,
  calculatedTotal: number,
  actualCharged: number,
  discountAmount: number,
  timestamp: string,
  lastModified: string,       // NEW: Track edit history
  modifiedBy: string          // NEW: Optional user tracking
}
```

**UI Changes Needed**:
1. Add "Edit" button to each line item in review modal
2. Inline editing or popup modal for product name assignment
3. Dropdown/autocomplete from products catalog
4. Save button with confirmation
5. Visual indicator for edited items

**Database Methods to Add**:
```javascript
// db.js
async updateLineItem(itemId, updates) {
  const item = await this.get('lineItems', itemId);
  return this.update('lineItems', itemId, {
    ...updates,
    lastModified: new Date().toISOString()
  });
}

async getLineItemEditHistory(itemId) {
  // Future: Track edit history in separate table
}
```

---

### 1.2 Update M-Pesa Transaction IDs
**Objective**: Add M-Pesa transaction codes to completed transactions

**Current State**:
- Tabs have `paymentMethod`, `amountReceived`, `change` fields
- M-Pesa transactions marked with `validationFlags: ['mpesa_no_code']` if code missing
- No post-completion editing

**Implementation Plan**:
```javascript
// Add to Tab schema
{
  tabId: string,
  sessionId: string,
  customerId: string,
  startTime: string,
  endTime: string,
  status: 'open' | 'completed' | 'cancelled',
  total: number,
  paymentMethod: 'cash' | 'mpesa' | 'credit' | 'mixed',
  amountReceived: number,
  change: number,
  mpesaTransactionCode: string | null,     // EXISTING
  mpesaPhoneNumber: string | null,         // NEW: Track M-Pesa phone
  creditPhoneNumber: string | null,        // EXISTING
  mixedPayments: array | null,             // EXISTING
  validationFlags: array,
  lastModified: string,                    // NEW: Track edits
  reconciliationNotes: string              // EXISTING
}
```

**UI Changes Needed**:
1. "Add M-Pesa Code" button in payment info section of review modal
2. Modal/form to enter transaction code
3. Validation (format check, duplicate detection)
4. Clear validation flag after code added
5. Visual indicator (green checkmark) when code present

**Validation Logic**:
```javascript
function validateMpesaCode(code) {
  // M-Pesa codes typically: 10-12 alphanumeric characters
  // Format: RXXXXXXXXXX (starts with R)
  const regex = /^[A-Z0-9]{10,12}$/i;
  return regex.test(code);
}

async function checkDuplicateMpesaCode(code, excludeTabId) {
  // Search all tabs for duplicate transaction code
  const allTabs = await shopDB.getAll('tabs');
  return allTabs.some(tab => 
    tab.tabId !== excludeTabId && 
    tab.mpesaTransactionCode === code
  );
}
```

---

### 1.3 Edit Other Transaction Details
**Additional Fields to Enable Editing**:
- Reconciliation notes (already exists, just need edit UI)
- Credit phone number corrections
- Mixed payment split adjustments
- Agreed total corrections (with audit trail)

---

## Phase 2: Product Catalog Integration (Google Sheets)

### 2.1 Product Data Structure
**Products Table Schema** (already exists, needs activation):
```javascript
{
  productId: string,           // e.g., "prod_soap_bars"
  name: string,                // "Soap Bars (Pack of 3)"
  category: string,            // "Hygiene", "Food", "Beverages"
  defaultUnitPrice: number,    // Base price from Google Sheets
  currentUnitPrice: number,    // App-adjusted price (overrides default)
  barcode: string | null,      // For future scanner integration
  sku: string | null,          // Stock Keeping Unit
  description: string,
  lastSyncTime: string,        // When synced from Google Sheets
  lastPriceUpdate: string,     // When price was modified in app
  isActive: boolean,           // Enable/disable products
  imageUrl: string | null      // Optional product image
}
```

### 2.2 Google Sheets Integration

**Architecture**:
```
Google Sheets (Source of Truth for product catalog)
      ↓
  Apps Script Web App (API endpoint)
      ↓
  Shop Tracker App (Periodic sync + manual refresh)
      ↓
  IndexedDB Products Table (Local cache)
```

**Google Sheets Structure**:
| Product ID | Name | Category | Default Price | Description | Active |
|------------|------|----------|---------------|-------------|--------|
| prod_001 | Soap Bars (3pk) | Hygiene | 50 | Antibacterial soap | TRUE |
| prod_002 | Bread Loaf | Food | 45 | White bread | TRUE |
| prod_003 | Soda 500ml | Beverage | 30 | Carbonated drink | TRUE |

**Sync Implementation**:
```javascript
// New file: shop-tracker/js/sync.js
class ProductSyncManager {
  constructor() {
    this.syncUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.lastSyncTime = localStorage.getItem('lastProductSync');
  }

  async syncProducts() {
    try {
      const response = await fetch(this.syncUrl);
      const products = await response.json();
      
      // Update local database
      for (const product of products) {
        const existing = await shopDB.get('products', product.productId);
        
        if (existing) {
          // Preserve app-modified prices
          await shopDB.update('products', product.productId, {
            ...product,
            currentUnitPrice: existing.currentUnitPrice || product.defaultUnitPrice,
            lastSyncTime: new Date().toISOString()
          });
        } else {
          // New product
          await shopDB.add('products', {
            ...product,
            currentUnitPrice: product.defaultUnitPrice,
            lastSyncTime: new Date().toISOString()
          });
        }
      }
      
      localStorage.setItem('lastProductSync', new Date().toISOString());
      console.log('[Sync] Products synced:', products.length);
      return true;
    } catch (error) {
      console.error('[Sync] Failed to sync products:', error);
      return false;
    }
  }

  async updateProductPrice(productId, newPrice) {
    // Override default price with app-specific price
    return shopDB.update('products', productId, {
      currentUnitPrice: newPrice,
      lastPriceUpdate: new Date().toISOString()
    });
  }
}
```

**Google Apps Script** (API endpoint):
```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const products = data.slice(1)
    .filter(row => row[5] === true) // Only active products
    .map(row => ({
      productId: row[0],
      name: row[1],
      category: row[2],
      defaultUnitPrice: row[3],
      description: row[4],
      isActive: row[5]
    }));
  
  return ContentService.createTextOutput(JSON.stringify(products))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 2.3 Calculator Product Selection

**UI Enhancement**:
```html
<!-- Updated calculator input with product picker -->
<div class="input-line">
  <button class="btn-product-picker" id="btn-product-picker">🛒</button>
  <input type="text" id="calc-input" placeholder="Select product or enter 50×3=150 @140">
  <button id="btn-add-item" class="btn-add-item">Add</button>
</div>

<!-- Product picker modal -->
<div id="product-picker-modal" class="modal hidden">
  <div class="modal-content">
    <h3>Select Product</h3>
    <input type="text" id="product-search" placeholder="Search products...">
    <div class="product-grid">
      <!-- Product cards generated from catalog -->
    </div>
  </div>
</div>
```

**Product Selection Flow**:
1. User clicks 🛒 button
2. Modal opens with product grid/list
3. Search/filter by category or name
4. Click product → auto-fills calculator with: `[price]×[qty]`
5. User adjusts quantity or applies discount
6. Add to cart with product name already linked

**Calculator Enhancement**:
```javascript
class Calculator {
  async selectProduct(productId) {
    const product = await shopDB.get('products', productId);
    if (!product) return;
    
    // Auto-fill calculator with product price
    this.inputElement.value = `${product.currentUnitPrice}×1`;
    this.currentInput = this.inputElement.value;
    
    // Store selected product for next add
    this.selectedProduct = {
      productId: product.productId,
      productName: product.name
    };
    
    // Close picker modal
    document.getElementById('product-picker-modal').classList.add('hidden');
    
    // Focus input for quantity adjustment
    this.inputElement.focus();
  }

  async addItem() {
    const parsed = this.parseInput(this.currentInput);
    
    // Use selected product or fall back to "Unnamed item"
    const productData = this.selectedProduct || {
      productId: null,
      productName: 'Unnamed item'
    };
    
    await shopDB.addLineItem(tabManager.activeTab, {
      productId: productData.productId,
      productName: productData.productName,
      unitPrice: parsed.unitPrice,
      quantity: parsed.quantity,
      // ... rest of data
    });
    
    // Clear selected product
    this.selectedProduct = null;
  }
}
```

---

## Phase 3: Enhanced Review & Reporting

### 3.1 Bulk Editing
- Select multiple unnamed items → assign same product name
- Batch update M-Pesa codes from CSV import
- Multi-tab reconciliation

### 3.2 Advanced Filtering
- Filter by product category
- Filter by payment method
- Filter by validation status (missing codes, etc.)
- Search by M-Pesa transaction code

### 3.3 Export Enhancements
- Export with product categories
- M-Pesa reconciliation report
- Product-wise sales summary
- Unnamed items report (for follow-up)

---

## Implementation Priority

### High Priority (Immediate Value)
1. **Edit unnamed items** - Most common post-completion need
2. **Add M-Pesa transaction codes** - Critical for reconciliation
3. **Basic product catalog sync** - Foundation for future features

### Medium Priority
4. **Product picker in calculator** - Improves data quality upfront
5. **Price override functionality** - Flexibility for promotions
6. **Bulk editing tools** - Efficiency for large sessions

### Low Priority (Future Enhancements)
7. **Barcode scanner integration**
8. **Image uploads for products**
9. **Inventory tracking**
10. **Advanced analytics dashboard**

---

## Technical Considerations

### Database Migration
- Increment `ShopDB.version` to 3
- Add new indexes for efficient queries
- Preserve existing data during upgrade

### Offline-First Design
- All edits work offline
- Sync to Google Sheets when online (future)
- Conflict resolution strategy needed

### Audit Trail
- Track all post-completion edits
- Store original values for rollback
- Optional: separate `editHistory` table

### Performance
- Product catalog: Cache in IndexedDB, sync periodically
- Review modal: Lazy load large sessions
- Search: Use IndexedDB indexes for fast queries

### Security
- Google Sheets API: Use Apps Script for authentication
- No sensitive data in URLs
- Validate all user input (XSS prevention)

---

## Next Steps

1. **Decide priority**: Which feature to implement first?
2. **Design UI mockups**: Sketch edit interfaces
3. **Database migration**: Plan schema updates
4. **Google Sheets setup**: Create template sheet structure
5. **Incremental rollout**: Test with small datasets first

Would you like me to proceed with implementing any specific feature from this assessment?
