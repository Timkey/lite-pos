// UI Manager - Handle modals and UI interactions
class UIManager {
  constructor() {
    this.paymentModal = document.getElementById('payment-modal');
    this.historyModal = document.getElementById('history-modal');
    this.currentTabForPayment = null;
    this.selectedPaymentMethod = null;
  }

  init() {
    // New tab button
    document.getElementById('btn-new-tab').addEventListener('click', async () => {
      await tabManager.createTab();
    });

    // Add tab button
    document.getElementById('btn-add-tab').addEventListener('click', async () => {
      await tabManager.createTab();
    });

    // Checkout button
    document.getElementById('btn-checkout').addEventListener('click', () => {
      this.showPaymentModal(tabManager.activeTab);
    });

    // Counter buttons
    document.querySelectorAll('.counter-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const counterType = btn.dataset.counter;
        if (tabManager.activeTab) {
          await tabManager.updateCounter(tabManager.activeTab, counterType, 1);
        }
      });
    });

    // Payment modal handlers
    this.initPaymentModal();

    // History modal handlers
    this.initHistoryModal();

    // Settings button (placeholder)
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showSettings();
    });

    // History button
    document.getElementById('btn-history').addEventListener('click', () => {
      this.showHistory();
    });
  }

  initPaymentModal() {
    const modal = this.paymentModal;
    
    // Close button
    document.getElementById('modal-close').addEventListener('click', () => {
      this.hidePaymentModal();
    });

    // Payment method buttons
    document.querySelectorAll('.payment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active from all
        document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        this.selectedPaymentMethod = btn.dataset.method;

        // Show cash section if cash selected
        const cashSection = document.getElementById('cash-section');
        if (this.selectedPaymentMethod === 'cash') {
          cashSection.classList.remove('hidden');
          document.getElementById('amount-received').focus();
        } else {
          cashSection.classList.add('hidden');
        }
      });
    });

    // Amount received input - calculate change
    document.getElementById('amount-received').addEventListener('input', (e) => {
      const total = parseFloat(document.getElementById('payment-total').textContent);
      const received = parseFloat(e.target.value) || 0;
      const change = received - total;
      document.getElementById('change-amount').textContent = change.toFixed(2);
    });

    // Confirm payment button
    document.getElementById('btn-confirm-payment').addEventListener('click', async () => {
      await this.confirmPayment();
    });

    // Cancel payment button
    document.getElementById('btn-cancel-payment').addEventListener('click', () => {
      this.hidePaymentModal();
    });

    // Cancel transaction button (enquiry only)
    document.getElementById('btn-cancel-transaction').addEventListener('click', async () => {
      await this.cancelTransaction();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hidePaymentModal();
      }
    });
  }

  async showPaymentModal(tabId) {
    this.currentTabForPayment = tabId;
    const total = cartManager.getTotal();
    
    document.getElementById('payment-total').textContent = `KES ${total.toFixed(2)}`;
    document.getElementById('amount-received').value = '';
    document.getElementById('change-amount').textContent = '0.00';
    document.getElementById('agreed-amount').value = '';
    document.getElementById('reconciliation-notes').value = '';
    document.getElementById('cash-section').classList.add('hidden');
    
    // Reset payment method selection
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    this.selectedPaymentMethod = null;

    // Calculate and show validation warnings
    await this.showValidationWarnings(tabId);

    this.paymentModal.classList.remove('hidden');
  }

  async showValidationWarnings(tabId) {
    const validation = await shopDB.calculateValidationFlags(tabId);
    const warningsContainer = document.getElementById('validation-warnings');
    const warningsList = document.getElementById('validation-list');
    
    warningsList.innerHTML = '';
    
    if (!validation || !validation.hasDiscrepancy) {
      warningsContainer.classList.add('hidden');
      return;
    }

    // Show warnings
    warningsContainer.classList.remove('hidden');
    
    if (validation.counterMismatch) {
      const li = document.createElement('li');
      if (validation.missingItemCount > 0) {
        li.textContent = `${validation.expectedCount} items available but only ${validation.actualCount} logged (${validation.missingItemCount} missing details)`;
        li.className = validation.missingItemCount > 3 ? 'warning-critical' : 'warning-moderate';
      } else {
        li.textContent = `${validation.actualCount} items logged but counter shows ${validation.expectedCount}`;
        li.className = 'warning-moderate';
      }
      warningsList.appendChild(li);
    }
    
    if (validation.incompleteLogging) {
      const li = document.createElement('li');
      li.textContent = `CRITICAL: ${validation.expectedCount} items in counter but ZERO items logged!`;
      li.className = 'warning-critical';
      warningsList.appendChild(li);
    }
  }

  hidePaymentModal() {
    this.paymentModal.classList.add('hidden');
    this.currentTabForPayment = null;
    this.selectedPaymentMethod = null;
  }

  async confirmPayment() {
    if (!this.selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    const tabId = this.currentTabForPayment;
    const tab = await shopDB.get('tabs', tabId);

    const total = parseFloat(document.getElementById('payment-total').textContent.replace('KES ', ''));
    const agreedAmountInput = document.getElementById('agreed-amount').value;
    const agreedTotal = agreedAmountInput ? parseFloat(agreedAmountInput) : null;
    const reconciliationNotes = document.getElementById('reconciliation-notes').value.trim() || null;
    
    let paymentData = {
      method: this.selectedPaymentMethod,
      amount: agreedTotal !== null ? agreedTotal : total,
      agreedTotal: agreedTotal,
      reconciliationNotes: reconciliationNotes
    };

    if (this.selectedPaymentMethod === 'cash') {
      const received = parseFloat(document.getElementById('amount-received').value);
      const amountToPay = agreedTotal !== null ? agreedTotal : total;
      if (!received || received < amountToPay) {
        alert(`Amount received must be equal to or greater than ${amountToPay.toFixed(2)}`);
        return;
      }
      paymentData.amountReceived = received;
      paymentData.change = received - amountToPay;
    }

    // Calculate and store validation flags
    const validation = await shopDB.calculateValidationFlags(tabId);
    paymentData.validationFlags = validation;

    // Log checkout event for audio sync
    if (tab) {
      await shopDB.logEvent(
        tab.sessionId,
        tabId,
        'checkout',
        {
          paymentMethod: this.selectedPaymentMethod,
          total: total,
          agreedTotal: agreedTotal,
          hasDiscrepancy: validation?.hasDiscrepancy || false,
          ...paymentData
        }
      );
    }

    // Close the tab with payment data
    await tabManager.closeTab(this.currentTabForPayment, paymentData);
    this.hidePaymentModal();
    
    console.log('[Payment] Completed:', paymentData);
  }

  async cancelTransaction() {
    if (confirm('Cancel this transaction? (Customer enquiry only)')) {
      await tabManager.closeTab(this.currentTabForPayment, null);
      this.hidePaymentModal();
    }
  }

  initHistoryModal() {
    // Close button
    document.getElementById('history-close').addEventListener('click', () => {
      this.hideHistory();
    });

    // Click outside to close
    this.historyModal.addEventListener('click', (e) => {
      if (e.target === this.historyModal) {
        this.hideHistory();
      }
    });
  }

  async showHistory() {
    const sessions = await shopDB.getAll('sessions');
    const historyList = document.getElementById('history-list');
    
    historyList.innerHTML = '';

    if (sessions.length === 0) {
      historyList.innerHTML = '<div class="empty-state"><p>No session history</p></div>';
    } else {
      // Sort by start time (newest first)
      sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      for (const session of sessions) {
        const summary = await sessionManager.getSessionSummary(session.sessionId);
        const itemEl = this.createHistoryItem(summary);
        historyList.appendChild(itemEl);
      }
    }

    this.historyModal.classList.remove('hidden');
  }

  createHistoryItem(summary) {
    const { session, totalSales, totalDiscounts, itemCount, tabCount, completedTabs } = summary;
    
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const startDate = new Date(session.startTime);
    const endDate = session.endTime ? new Date(session.endTime) : null;
    
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <strong>${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}</strong>
        <span style="color: var(--primary); font-weight: 700;">$${totalSales.toFixed(2)}</span>
      </div>
      <div style="font-size: 0.875rem; color: var(--text-secondary);">
        ${tabCount} customer${tabCount !== 1 ? 's' : ''} • 
        ${itemCount} item${itemCount !== 1 ? 's' : ''} • 
        ${completedTabs} completed
        ${totalDiscounts > 0 ? `• Discounts: $${totalDiscounts.toFixed(2)}` : ''}
      </div>
      <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
        Status: <span style="color: ${session.status === 'completed' ? 'var(--success)' : 'var(--warning)'}">
          ${session.status}
        </span>
      </div>
    `;

    item.onclick = async () => {
      await reviewManager.showSessionDetail(session.sessionId);
    };

    return item;
  }

  hideHistory() {
    this.historyModal.classList.add('hidden');
    // Cleanup any active audio players
    reviewManager.cleanup();
  }

  showSettings() {
    // TODO: Implement settings modal
    alert('Settings panel coming soon!\n\nFeatures:\n- Storage management\n- Data export/import\n- Sync settings\n- Audio settings');
  }

  async showStorageWarning() {
    const quota = await shopDB.checkStorageQuota();
    if (quota && quota.percentUsed > 80) {
      const warning = `Storage: ${quota.percentUsed}% used. Consider exporting data.`;
      console.warn(warning);
      // TODO: Show persistent warning banner
    }
  }
}

// Create global UI manager
const uiManager = new UIManager();
