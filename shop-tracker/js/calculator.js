// Calculator Manager
class Calculator {
  constructor() {
    this.currentInput = '';
    this.inputElement = document.getElementById('calc-input');
    this.shouldClearOnNextInput = false; // Flag to clear on next input
  }

  init() {
    // Number pad button handlers
    document.querySelectorAll('.num-btn').forEach(btn => {
      // Prevent focus shift when clicking number pad
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent button from taking focus
      });
      
      btn.addEventListener('click', () => {
        this.handleInput(btn.dataset.value);
      });
    });

    // Add item button - prevent focus shift
    const addBtn = document.getElementById('btn-add-item');
    addBtn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Keep focus on input field
    });
    addBtn.addEventListener('click', () => {
      this.addItem();
    });

    // Enter key to add item
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addItem();
      }
    });

    // Sync device keyboard input with currentInput state
    this.inputElement.addEventListener('input', (e) => {
      // If flag is set, clear before allowing new input from device keyboard
      if (this.shouldClearOnNextInput) {
        this.inputElement.value = e.data || ''; // Just the new character
        this.currentInput = this.inputElement.value;
        this.shouldClearOnNextInput = false;
      } else {
        this.currentInput = e.target.value;
      }
    });
  }

  handleInput(value) {
    // If flag is set, clear before adding new input
    if (this.shouldClearOnNextInput && value !== 'C' && value !== '⌫') {
      this.currentInput = '';
      this.shouldClearOnNextInput = false;
    }

    if (value === 'C') {
      // Clear
      this.currentInput = '';
      this.inputElement.value = '';
      this.shouldClearOnNextInput = false;
    } else if (value === '⌫') {
      // Backspace
      this.currentInput = this.currentInput.slice(0, -1);
      this.inputElement.value = this.currentInput;
      this.shouldClearOnNextInput = false;
    } else {
      // Append value
      this.currentInput += value;
      this.inputElement.value = this.currentInput;
    }

    // Keep focus without triggering keyboard close
    // Use setTimeout to ensure it happens after the click event
    setTimeout(() => {
      this.inputElement.focus();
    }, 10);
  }

  parseInput(input) {
    // Parse format: 50×3=150 @140
    // or: 50×3 (auto-calculate)
    // or: 150 (just total)
    // NEW: (2×3)+(5×2) for multi-item entry

    const result = {
      unitPrice: null,
      quantity: null,
      calculatedTotal: null,
      actualCharged: null,
      isValid: false,
      displayFormula: input // For history display
    };

    // Remove spaces
    input = input.replace(/\s+/g, '');

    // Check for actual charged amount (@140)
    const atSplit = input.split('@');
    if (atSplit.length === 2) {
      result.actualCharged = parseFloat(atSplit[1]);
      input = atSplit[0];
    }

    // Check for calculated total (=150)
    const equalSplit = input.split('=');
    if (equalSplit.length === 2) {
      result.calculatedTotal = parseFloat(equalSplit[1]);
      input = equalSplit[0];
    }

    // Check for addition operator (multiple items)
    if (input.includes('+')) {
      // Split by + and process each part
      const parts = input.split('+');
      let total = 0;
      const formulas = [];
      
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        
        // Check for multiplication in this part
        const multiplyMatch = trimmed.match(/^([\d.]+)[×x*]([\d.]+)$/);
        if (multiplyMatch) {
          const partTotal = parseFloat(multiplyMatch[1]) * parseFloat(multiplyMatch[2]);
          total += partTotal;
          formulas.push(`(${multiplyMatch[1]}×${multiplyMatch[2]})`);
        } else if (!isNaN(parseFloat(trimmed))) {
          total += parseFloat(trimmed);
          formulas.push(trimmed);
        }
      }
      
      if (total > 0) {
        result.calculatedTotal = result.calculatedTotal || total;
        result.actualCharged = result.actualCharged || result.calculatedTotal;
        result.quantity = parts.length; // Count of items
        result.unitPrice = total / parts.length; // Average
        result.displayFormula = formulas.join('+');
        result.isValid = true;
      }
      
      return result;
    }

    // Check for unit price × quantity
    const multiplyMatch = input.match(/^([\d.]+)[×x*]([\d.]+)$/);
    if (multiplyMatch) {
      result.unitPrice = parseFloat(multiplyMatch[1]);
      result.quantity = parseFloat(multiplyMatch[2]);
      result.displayFormula = `${result.unitPrice}×${result.quantity}`;
      
      // Auto-calculate if not provided
      if (!result.calculatedTotal) {
        result.calculatedTotal = result.unitPrice * result.quantity;
      }
      
      result.isValid = true;
    } else if (!isNaN(parseFloat(input))) {
      // Just a total amount
      result.calculatedTotal = parseFloat(input);
      result.quantity = 1;
      result.unitPrice = result.calculatedTotal;
      result.isValid = true;
    }

    // If no actual charged, use calculated
    if (result.actualCharged === null) {
      result.actualCharged = result.calculatedTotal;
    }

    // Calculate discount
    if (result.calculatedTotal && result.actualCharged) {
      const diff = result.calculatedTotal - result.actualCharged;
      if (Math.abs(diff) > 0.01) {
        result.discountAmount = diff;
        result.discountPercent = (diff / result.calculatedTotal) * 100;
      }
    }

    return result;
  }

  async addItem() {
    const input = this.inputElement.value.trim();
    if (!input) return;

    const parsed = this.parseInput(input);
    
    if (!parsed.isValid) {
      alert('Invalid format. Use: 50×3 or 50×3=150 or 50×3=150 @140');
      return;
    }

    const tabId = tabManager.activeTab;
    if (!tabId) {
      alert('No active tab');
      return;
    }

    try {
      // Add to database
      const item = await shopDB.addLineItem(tabId, {
        unitPrice: parsed.unitPrice,
        quantity: parsed.quantity,
        calculatedTotal: parsed.calculatedTotal,
        actualCharged: parsed.actualCharged,
        discountAmount: parsed.discountAmount || 0,
        discountPercent: parsed.discountPercent || 0,
        productName: null // Can be tagged later
      });

      // Log event for audio sync
      const tab = await shopDB.get('tabs', tabId);
      if (tab) {
        await shopDB.logEvent(
          tab.sessionId,
          tabId,
          'item_added',
          {
            itemId: item.itemId,
            unitPrice: parsed.unitPrice,
            quantity: parsed.quantity,
            actualCharged: parsed.actualCharged
          }
        );
      }

      // Reload cart
      await cartManager.loadCart(tabId);

      // Set flag to clear on next input
      this.shouldClearOnNextInput = true;
      
      // Visual feedback: briefly highlight success
      this.inputElement.classList.add('success-flash');
      setTimeout(() => {
        this.inputElement.classList.remove('success-flash');
      }, 300);

      console.log('[Calculator] Item added:', parsed);
    } catch (error) {
      console.error('[Calculator] Failed to add item:', error);
      alert('Failed to add item');
    }
  }

  clear() {
    this.currentInput = '';
    this.inputElement.value = '';
  }
}

// Create global calculator instance
const calculator = new Calculator();
