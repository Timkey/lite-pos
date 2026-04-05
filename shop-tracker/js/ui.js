// UI Manager - Handle modals and UI interactions
class UIManager {
  constructor() {
    this.paymentModal = document.getElementById('payment-modal');
    this.historyModal = document.getElementById('history-modal');
    this.currentTabForPayment = null;
    this.selectedPaymentMethod = null;
    // History pagination
    this.historyPage = 1;
    this.historyPageSize = 10;
    this.historyFilters = {
      status: 'all', // all, completed, cancelled
      dateFrom: null,
      dateTo: null
    };
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

        // Hide all payment sections
        document.getElementById('cash-section').classList.add('hidden');
        document.getElementById('mpesa-section').classList.add('hidden');
        document.getElementById('credit-section').classList.add('hidden');
        document.getElementById('mixed-section').classList.add('hidden');

        // Show relevant section based on payment method
        if (this.selectedPaymentMethod === 'cash') {
          document.getElementById('cash-section').classList.remove('hidden');
          document.getElementById('amount-received').focus();
        } else if (this.selectedPaymentMethod === 'mpesa') {
          document.getElementById('mpesa-section').classList.remove('hidden');
          document.getElementById('mpesa-reference').focus();
        } else if (this.selectedPaymentMethod === 'credit') {
          document.getElementById('credit-section').classList.remove('hidden');
          document.getElementById('credit-phone').focus();
        } else if (this.selectedPaymentMethod === 'mixed') {
          document.getElementById('mixed-section').classList.remove('hidden');
          this.updateMixedPaymentSummary();
        }
      });
    });

    // Amount received input - calculate change
    document.getElementById('amount-received').addEventListener('input', (e) => {
      const totalText = document.getElementById('payment-total').textContent;
      const total = parseFloat(totalText.replace('KES ', ''));
      const received = parseFloat(e.target.value) || 0;
      const change = received - total;
      document.getElementById('change-amount').textContent = `KES ${change.toFixed(2)}`;
    });

    // Mixed payment split checkboxes
    document.querySelectorAll('.split-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const method = e.target.id.replace('split-', '');
        const amountInput = document.getElementById(`split-${method}-amount`);
        amountInput.disabled = !e.target.checked;
        if (!e.target.checked) {
          amountInput.value = '';
        }
        
        // Show/hide additional fields for mpesa and credit
        if (method === 'mpesa') {
          const refSection = document.getElementById('split-mpesa-ref-section');
          if (e.target.checked) {
            refSection.classList.remove('hidden');
          } else {
            refSection.classList.add('hidden');
            document.getElementById('split-mpesa-reference').value = '';
          }
        } else if (method === 'credit') {
          const detailsSection = document.getElementById('split-credit-details-section');
          if (e.target.checked) {
            detailsSection.classList.remove('hidden');
          } else {
            detailsSection.classList.add('hidden');
            document.getElementById('split-credit-phone').value = '';
            document.getElementById('split-credit-notes').value = '';
          }
        }
        
        this.updateMixedPaymentSummary();
      });
    });

    // Mixed payment amount inputs
    document.querySelectorAll('.split-amount').forEach(input => {
      input.addEventListener('input', () => {
        this.updateMixedPaymentSummary();
      });
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
    
    // Hide all payment sections
    document.getElementById('cash-section').classList.add('hidden');
    document.getElementById('mpesa-section').classList.add('hidden');
    document.getElementById('credit-section').classList.add('hidden');
    document.getElementById('mixed-section').classList.add('hidden');
    
    // Reset all payment inputs
    document.getElementById('mpesa-reference').value = '';
    document.getElementById('credit-phone').value = '';
    document.getElementById('credit-notes').value = '';
    
    // Reset mixed payment
    document.querySelectorAll('.split-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.split-amount').forEach(input => {
      input.value = '';
      input.disabled = true;
    });
    document.getElementById('split-mpesa-ref-section').classList.add('hidden');
    document.getElementById('split-credit-details-section').classList.add('hidden');
    document.getElementById('split-mpesa-reference').value = '';
    document.getElementById('split-credit-phone').value = '';
    document.getElementById('split-credit-notes').value = '';
    
    // Reset payment method selection
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    this.selectedPaymentMethod = null;

    // Calculate and show validation warnings
    await this.showValidationWarnings(tabId);

    this.paymentModal.classList.remove('hidden');
  }

  updateMixedPaymentSummary() {
    const totalText = document.getElementById('payment-total').textContent;
    const total = parseFloat(totalText.replace('KES ', ''));
    
    const cashAmount = parseFloat(document.getElementById('split-cash-amount').value) || 0;
    const mpesaAmount = parseFloat(document.getElementById('split-mpesa-amount').value) || 0;
    const creditAmount = parseFloat(document.getElementById('split-credit-amount').value) || 0;
    
    const splitTotal = cashAmount + mpesaAmount + creditAmount;
    const remaining = total - splitTotal;
    
    document.getElementById('split-total-amount').textContent = `KES ${splitTotal.toFixed(2)}`;
    document.getElementById('split-remaining-amount').textContent = `KES ${remaining.toFixed(2)}`;
    
    // Highlight remaining if not zero
    const remainingElement = document.getElementById('split-remaining-amount');
    if (Math.abs(remaining) < 0.01) {
      remainingElement.style.color = 'var(--success)';
    } else if (remaining > 0) {
      remainingElement.style.color = 'var(--warning)';
    } else {
      remainingElement.style.color = 'var(--danger)';
    }
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

    // Validate based on payment method
    if (this.selectedPaymentMethod === 'cash') {
      const received = parseFloat(document.getElementById('amount-received').value);
      const amountToPay = agreedTotal !== null ? agreedTotal : total;
      if (!received || received < amountToPay) {
        alert(`Amount received must be equal to or greater than KES ${amountToPay.toFixed(2)}`);
        return;
      }
      paymentData.amountReceived = received;
      paymentData.change = received - amountToPay;
      
    } else if (this.selectedPaymentMethod === 'mpesa') {
      const mpesaRef = document.getElementById('mpesa-reference').value.trim();
      if (!mpesaRef) {
        alert('Please enter M-Pesa transaction code');
        return;
      }
      paymentData.mpesaReference = mpesaRef;
      
    } else if (this.selectedPaymentMethod === 'credit') {
      const creditPhone = document.getElementById('credit-phone').value.trim();
      const creditNotes = document.getElementById('credit-notes').value.trim();
      if (!creditPhone) {
        alert('Phone number is required for credit transactions');
        return;
      }
      paymentData.creditPhone = creditPhone;
      paymentData.creditNotes = creditNotes || null;
      
    } else if (this.selectedPaymentMethod === 'mixed') {
      const cashAmount = parseFloat(document.getElementById('split-cash-amount').value) || 0;
      const mpesaAmount = parseFloat(document.getElementById('split-mpesa-amount').value) || 0;
      const creditAmount = parseFloat(document.getElementById('split-credit-amount').value) || 0;
      
      const splitTotal = cashAmount + mpesaAmount + creditAmount;
      const amountToPay = agreedTotal !== null ? agreedTotal : total;
      
      if (Math.abs(splitTotal - amountToPay) > 0.01) {
        alert(`Split total (KES ${splitTotal.toFixed(2)}) must equal payment amount (KES ${amountToPay.toFixed(2)})`);
        return;
      }
      
      const splitDetails = [];
      if (cashAmount > 0) splitDetails.push({ method: 'cash', amount: cashAmount });
      
      if (mpesaAmount > 0) {
        const mpesaRef = document.getElementById('split-mpesa-reference').value.trim();
        if (!mpesaRef) {
          alert('Please enter M-Pesa transaction code for M-Pesa portion');
          return;
        }
        splitDetails.push({ method: 'mpesa', amount: mpesaAmount, reference: mpesaRef });
      }
      
      if (creditAmount > 0) {
        const creditPhone = document.getElementById('split-credit-phone').value.trim();
        const creditNotes = document.getElementById('split-credit-notes').value.trim();
        if (!creditPhone) {
          alert('Phone number is required for credit portion');
          return;
        }
        splitDetails.push({ 
          method: 'credit', 
          amount: creditAmount, 
          phone: creditPhone,
          notes: creditNotes || null
        });
      }
      
      if (splitDetails.length === 0) {
        alert('Please enter at least one payment method for mixed payment');
        return;
      }
      
      paymentData.splitDetails = splitDetails;
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

    // Filter controls
    document.getElementById('btn-apply-filters').addEventListener('click', () => {
      const status = document.getElementById('filter-status').value;
      const dateFrom = document.getElementById('filter-date-from').value;
      const dateTo = document.getElementById('filter-date-to').value;
      
      this.historyFilters.status = status;
      this.historyFilters.dateFrom = dateFrom || null;
      this.historyFilters.dateTo = dateTo || null;
      this.historyPage = 1;
      this.showHistory();
    });

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
      this.historyFilters = { status: 'all', dateFrom: null, dateTo: null };
      this.historyPage = 1;
      document.getElementById('filter-status').value = 'all';
      document.getElementById('filter-date-from').value = '';
      document.getElementById('filter-date-to').value = '';
      this.showHistory();
    });

    // Pagination
    document.getElementById('history-prev-page').addEventListener('click', () => {
      this.prevHistoryPage();
    });

    document.getElementById('history-next-page').addEventListener('click', () => {
      this.nextHistoryPage();
    });

    document.getElementById('page-size').addEventListener('change', (e) => {
      this.changeHistoryPageSize(e.target.value);
    });

    // Click outside to close
    this.historyModal.addEventListener('click', (e) => {
      if (e.target === this.historyModal) {
        this.hideHistory();
      }
    });
  }

  async showHistory() {
    let sessions = await shopDB.getAll('sessions');
    
    // Apply filters
    sessions = this.applyHistoryFilters(sessions);
    
    // Sort by start time (newest first)
    sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    // Calculate pagination
    const totalSessions = sessions.length;
    const totalPages = Math.ceil(totalSessions / this.historyPageSize);
    const startIndex = (this.historyPage - 1) * this.historyPageSize;
    const endIndex = startIndex + this.historyPageSize;
    const paginatedSessions = sessions.slice(startIndex, endIndex);
    
    // Render
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (paginatedSessions.length === 0) {
      historyList.innerHTML = '<div class="empty-state"><p>No sessions found</p></div>';
    } else {
      for (const session of paginatedSessions) {
        const summary = await sessionManager.getSessionSummary(session.sessionId);
        const itemEl = this.createHistoryItem(summary);
        historyList.appendChild(itemEl);
      }
    }
    
    // Update pagination controls
    this.updateHistoryPagination(totalSessions, totalPages);

    this.historyModal.classList.remove('hidden');
  }

  applyHistoryFilters(sessions) {
    return sessions.filter(session => {
      // Status filter
      if (this.historyFilters.status !== 'all') {
        if (session.status !== this.historyFilters.status) return false;
      }
      
      // Date range filter
      if (this.historyFilters.dateFrom) {
        const sessionDate = new Date(session.startTime);
        const fromDate = new Date(this.historyFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (sessionDate < fromDate) return false;
      }
      
      if (this.historyFilters.dateTo) {
        const sessionDate = new Date(session.startTime);
        const toDate = new Date(this.historyFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (sessionDate > toDate) return false;
      }
      
      return true;
    });
  }

  updateHistoryPagination(totalSessions, totalPages) {
    const paginationInfo = document.getElementById('history-pagination-info');
    const prevBtn = document.getElementById('history-prev-page');
    const nextBtn = document.getElementById('history-next-page');
    
    if (paginationInfo) {
      const startItem = (this.historyPage - 1) * this.historyPageSize + 1;
      const endItem = Math.min(this.historyPage * this.historyPageSize, totalSessions);
      paginationInfo.textContent = `${startItem}-${endItem} of ${totalSessions}`;
    }
    
    if (prevBtn) {
      prevBtn.disabled = this.historyPage === 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.historyPage >= totalPages;
    }
  }

  nextHistoryPage() {
    this.historyPage++;
    this.showHistory();
  }

  prevHistoryPage() {
    this.historyPage--;
    this.showHistory();
  }

  changeHistoryPageSize(size) {
    this.historyPageSize = parseInt(size);
    this.historyPage = 1; // Reset to first page
    this.showHistory();
  }

  applyHistoryDateFilter(fromDate, toDate) {
    this.historyFilters.dateFrom = fromDate;
    this.historyFilters.dateTo = toDate;
    this.historyPage = 1; // Reset to first page
    this.showHistory();
  }

  applyHistoryStatusFilter(status) {
    this.historyFilters.status = status;
    this.historyPage = 1; // Reset to first page
    this.showHistory();
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
        <span style="color: var(--primary); font-weight: 700;">KES ${totalSales.toFixed(2)}</span>
      </div>
      <div style="font-size: 0.875rem; color: var(--text-secondary);">
        ${tabCount} customer${tabCount !== 1 ? 's' : ''} • 
        ${itemCount} item${itemCount !== 1 ? 's' : ''} • 
        ${completedTabs} completed
        ${totalDiscounts > 0 ? `• Discounts: KES ${totalDiscounts.toFixed(2)}` : ''}
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
