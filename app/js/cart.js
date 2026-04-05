// Cart Manager
class CartManager {
  constructor() {
    this.currentTabId = null;
    this.items = [];
  }

  async loadCart(tabId) {
    this.currentTabId = tabId;
    this.items = await shopDB.getLineItemsByTab(tabId);
    this.render();
  }

  render() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total');

    // Clear container
    cartItems.innerHTML = '';

    if (this.items.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart">No items yet</div>';
      cartCount.textContent = '0 items';
      subtotalEl.textContent = '0.00';
      discountEl.textContent = '0.00';
      totalEl.textContent = '0.00';
      return;
    }

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;

    this.items.forEach(item => {
      subtotal += item.calculatedTotal;
      totalDiscount += item.discountAmount || 0;

      const itemEl = this.createItemElement(item);
      cartItems.appendChild(itemEl);
    });

    const grandTotal = subtotal - totalDiscount;

    // Update displays
    cartCount.textContent = `${this.items.length} item${this.items.length !== 1 ? 's' : ''}`;
    subtotalEl.textContent = subtotal.toFixed(2);
    discountEl.textContent = totalDiscount.toFixed(2);
    totalEl.textContent = grandTotal.toFixed(2);

    // Update tab total
    if (this.currentTabId) {
      shopDB.updateTab(this.currentTabId, { total: grandTotal });
    }
  }

  createItemElement(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';

    // Formula display
    let formula = '';
    if (item.quantity && item.quantity !== 1) {
      formula = `${item.unitPrice.toFixed(2)} × ${item.quantity}`;
    } else {
      formula = item.unitPrice.toFixed(2);
    }

    if (item.discountAmount && item.discountAmount > 0) {
      formula += ` = ${item.calculatedTotal.toFixed(2)}`;
    }

    const details = document.createElement('div');
    details.className = 'item-details';
    
    const formulaDiv = document.createElement('div');
    formulaDiv.className = 'item-formula';
    formulaDiv.textContent = formula;

    const productDiv = document.createElement('div');
    productDiv.className = 'item-product';
    productDiv.textContent = item.productName || 'Unnamed item';

    details.appendChild(formulaDiv);
    details.appendChild(productDiv);

    // Discount display
    if (item.discountAmount && item.discountAmount > 0) {
      const discountDiv = document.createElement('div');
      discountDiv.className = 'item-discount';
      discountDiv.textContent = `Discount: -${item.discountAmount.toFixed(2)} (${item.discountPercent.toFixed(1)}%)`;
      details.appendChild(discountDiv);
    }

    // Actions (total and delete)
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    if (item.discountAmount && item.discountAmount > 0) {
      const original = document.createElement('div');
      original.className = 'item-original';
      original.textContent = item.calculatedTotal.toFixed(2);
      actions.appendChild(original);
    }

    const total = document.createElement('div');
    total.className = 'item-total';
    total.textContent = item.actualCharged.toFixed(2);
    actions.appendChild(total);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'item-delete';
    deleteBtn.textContent = 'Remove';
    deleteBtn.onclick = () => this.removeItem(item.itemId);
    actions.appendChild(deleteBtn);

    itemEl.appendChild(details);
    itemEl.appendChild(actions);

    return itemEl;
  }

  async removeItem(itemId) {
    try {
      await shopDB.deleteLineItem(itemId);
      await this.loadCart(this.currentTabId);
      console.log('[Cart] Item removed:', itemId);
    } catch (error) {
      console.error('[Cart] Failed to remove item:', error);
    }
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.actualCharged, 0);
  }

  getTotalDiscount() {
    return this.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  }

  clear() {
    this.currentTabId = null;
    this.items = [];
    this.render();
  }
}

// Create global cart manager
const cartManager = new CartManager();
