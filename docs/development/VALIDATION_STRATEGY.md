# Data Validation & Reconciliation Strategy

## Current State Analysis

### What's Being Tracked

**Per Tab:**
- `availableCount` - Items customer purchased (counter button)
- `unavailableCount` - Items customer asked for but unavailable (counter button)
- `lineItems[]` - Individual items added via calculator
- `total` - Calculated sum from lineItems
- `paymentMethod` - Cash/M-Pesa/Card/Credit
- `amountReceived` - Money given by customer (cash only)
- `change` - Change returned (cash only)

**Current Gaps:**
1. ❌ No validation: `availableCount` vs number of `lineItems`
2. ❌ No field for "actual agreed amount" (when customer negotiates different price)
3. ❌ No warning when counter ≠ calculator items
4. ❌ No way to capture "rushed handoff" incomplete logging
5. ❌ No indicator in review that data might be incomplete

---

## Problem Scenarios

### Scenario 1: Counter Mismatch
```
Available counter: 5 items
Calculator entries: 3 items
❌ Missing 2 item details
```

### Scenario 2: Amount Discrepancy
```
Calculated total: KES 450
Customer negotiated: KES 400 (gave discount not in system)
Amount received: KES 500
❌ No way to log the KES 50 discount handshake
```

### Scenario 3: Rushed Checkout
```
Customer in hurry → shopkeeper hits checkout quickly
Available: 7, Unavailable: 2
Calculator items: 0 (nothing logged!)
❌ Audio has conversation but no transaction details
```

---

## Recommended Solution

### 1. Add Reconciliation Fields to Tab

```javascript
// New fields in tab schema
{
  // Existing fields
  availableCount: 5,
  unavailableCount: 2,
  total: 450,  // calculated from lineItems
  
  // NEW reconciliation fields
  agreedTotal: 400,  // What customer actually pays (can differ from calculated)
  validationFlags: {
    counterMismatch: true,      // availableCount != lineItems.length
    amountMismatch: true,        // agreedTotal != total
    incompleteLogging: false,   // availableCount > 0 but lineItems.length == 0
    hasDiscrepancy: true        // any flag is true
  },
  reconciliationNotes: "Customer haggled, gave KES 50 discount"
}
```

### 2. Checkout Flow Enhancement

**Current flow:**
```
Select payment method → [Cash: enter amount] → Confirm
```

**Proposed flow:**
```
Select payment method → 
  ⚠️ [VALIDATION WARNINGS if any] →
  [Show calculated vs agreed amounts] →
  [Optional: Add notes] →
  Confirm
```

### 3. Visual Indicators

**Payment Modal Additions:**
```
┌─────────────────────────────────────┐
│ Complete Transaction                 │
├─────────────────────────────────────┤
│ Calculated Total:  KES 450.00       │
│ ⚠️ VALIDATION WARNINGS:              │
│   • 5 available but only 3 logged   │
│   • 2 items missing details          │
├─────────────────────────────────────┤
│ Agreed Amount: [____400____] KES    │
│ (Leave blank if same as calculated)  │
├─────────────────────────────────────┤
│ 📝 Quick Notes (optional):          │
│ [Customer haggled...]               │
├─────────────────────────────────────┤
│ Payment: [Cash] [M-Pesa] [Card]     │
│ Amount Received: [____500____]      │
│ Change: KES 100.00                  │
├─────────────────────────────────────┤
│ [Cancel]  [✓ Complete Transaction]  │
└─────────────────────────────────────┘
```

### 4. Review Interface Enhancements

**Session Review - Flag Incomplete Tabs:**
```
Customer 1  ✓ Complete
  5 items, KES 450, Cash
  
Customer 2  ⚠️ Validation Issues
  Available: 7  Logged: 3  (4 missing!)
  Total: KES 320  Agreed: KES 300
  Notes: "Customer in rush, quick checkout"
  
Customer 3  ⚠️ No Items Logged!
  Available: 2  Logged: 0
  ⚠️ CRITICAL: Counter used but no calculator entries
  Audio recording available for review
```

---

## Implementation Phases

### Phase A: Validation Detection (Week 1)
- [ ] Add `agreedTotal`, `validationFlags`, `reconciliationNotes` to tab schema
- [ ] Calculate validation flags on checkout
- [ ] Show warnings in payment modal
- [ ] Store flags in database

### Phase B: Enhanced Checkout UX (Week 1-2)
- [ ] Add "Agreed Amount" input field
- [ ] Add optional notes textarea
- [ ] Show validation warnings with details
- [ ] Color-code warnings (yellow = mismatch, red = critical)

### Phase C: Review Interface Updates (Week 2)
- [ ] Add warning badges to tab review cards
- [ ] Show detailed validation issues
- [ ] Highlight tabs with discrepancies
- [ ] Summary: "X tabs complete, Y tabs with issues"

### Phase D: Reporting & Analytics (Future)
- [ ] End-of-day report: flag all incomplete transactions
- [ ] Conversion rate: logged vs counter items
- [ ] Average discrepancy amount
- [ ] Training insights: which clerks need more practice

---

## Data Integrity Formula

```javascript
function calculateValidationFlags(tab, lineItems) {
  const totalLogged = lineItems.length;
  const expectedCount = tab.availableCount || 0;
  const calculatedTotal = lineItems.reduce((sum, item) => sum + item.actualCharged, 0);
  const agreedTotal = tab.agreedTotal || calculatedTotal;
  
  return {
    counterMismatch: expectedCount !== totalLogged,
    amountMismatch: Math.abs(calculatedTotal - agreedTotal) > 0.01,
    incompleteLogging: expectedCount > 0 && totalLogged === 0,
    criticalIssue: (expectedCount > 0 && totalLogged === 0) || 
                   (expectedCount - totalLogged > 3),
    missingItemCount: Math.max(0, expectedCount - totalLogged),
    amountDifference: agreedTotal - calculatedTotal,
    hasDiscrepancy: function() {
      return this.counterMismatch || this.amountMismatch || this.incompleteLogging;
    }
  };
}
```

---

## Benefits

### For Shopkeeper (Real-time)
- ✅ Awareness of incomplete logging during rush
- ✅ Ability to document discrepancies before customer leaves
- ✅ Flexibility to complete sale even with incomplete data
- ✅ Notes field for context ("customer in hurry", "gave discount")

### For Review (Post-sale)
- ✅ Clear visibility into data quality
- ✅ Audio timestamps to fill in missing items
- ✅ Pattern recognition (which situations cause incomplete logging)
- ✅ Training opportunities (improve process)

### For Business Intelligence
- ✅ Accurate conversion rates (enquiries → purchases)
- ✅ True discount amounts (negotiated + logged)
- ✅ Inventory accuracy (what was actually sold)
- ✅ Process efficiency metrics

---

## Edge Cases Handled

1. **Quick checkout, zero items logged**
   - Flag: `incompleteLogging: true`
   - Solution: Audio recording available, can fill in later

2. **Customer haggles price down**
   - Field: `agreedTotal` < `calculatedTotal`
   - Flag: `amountMismatch: true`
   - Notes: Document reason

3. **Partial logging (3 of 5 items)**
   - Flag: `counterMismatch: true`, `missingItemCount: 2`
   - Solution: Can add missing items from audio review

4. **Over-logging (5 items, counter shows 3)**
   - Flag: `counterMismatch: true`, `missingItemCount: -2`
   - Indicates: Counter button not pressed for 2 items

---

## Next Steps

**Recommended Priority:**
1. ⭐ **Implement validation flags** - Quick wins, no UI changes needed yet
2. ⭐ **Add agreed amount field** - Captures most critical missing data
3. **Update payment modal** - Show warnings, collect notes
4. **Enhance review interface** - Make issues visible

**Do you want me to implement Phase A (Validation Detection) first?**
