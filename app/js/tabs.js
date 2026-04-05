// Tab Manager
class TabManager {
  constructor() {
    this.tabs = [];
    this.activeTab = null;
    this.tabColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
      '#ec4899', '#06b6d4', '#f97316', '#14b8a6'
    ];
  }

  async createTab() {
    const session = await sessionManager.getCurrentSession();
    
    if (!session) {
      // Start new session if none exists
      await sessionManager.startSession();
      const newSession = await sessionManager.getCurrentSession();
      session = newSession;
    }

    const colorIndex = this.tabs.length % this.tabColors.length;
    const customerNumber = this.tabs.length + 1;

    const tabId = await shopDB.createTab(session.sessionId, {
      customerId: `Customer ${customerNumber}`,
      colorIndex
    });

    const tab = await shopDB.get('tabs', tabId);
    this.tabs.push(tab);
    
    // Set as active tab
    this.setActiveTab(tab.tabId);
    
    // Update UI
    this.renderTabs();
    this.showTabsContainer();

    console.log('[Tab] Created:', tabId);
    return tab;
  }

  async closeTab(tabId, paymentData = null) {
    const tab = await shopDB.get('tabs', tabId);
    
    if (!tab) return;

    // Update tab status
    await shopDB.updateTab(tabId, {
      endTime: new Date().toISOString(),
      status: paymentData ? 'completed' : 'cancelled',
      paymentMethod: paymentData?.method,
      amountReceived: paymentData?.amountReceived,
      change: paymentData?.change,
      agreedTotal: paymentData?.agreedTotal,
      reconciliationNotes: paymentData?.reconciliationNotes,
      validationFlags: paymentData?.validationFlags || tab.validationFlags
    });

    // Remove from active tabs
    this.tabs = this.tabs.filter(t => t.tabId !== tabId);

    // Check if any tabs remain
    if (this.tabs.length === 0) {
      // End session
      await sessionManager.endSession();
      this.activeTab = null;
      this.hideTabsContainer();
    } else {
      // Switch to another tab
      this.setActiveTab(this.tabs[0].tabId);
    }

    this.renderTabs();
    console.log('[Tab] Closed:', tabId);
  }

  async setActiveTab(tabId) {
    this.activeTab = tabId;
    this.renderTabs();
    await this.loadTabContent(tabId);
    
    // Clear calculator history when switching tabs
    if (calculator) {
      calculator.clearHistory();
    }
  }

  async loadTabContent(tabId) {
    const tab = await shopDB.get('tabs', tabId);
    if (!tab) return;

    // Update counters
    document.getElementById('counter-available').textContent = tab.availableCount || 0;
    document.getElementById('counter-unavailable').textContent = tab.unavailableCount || 0;

    // Load cart items
    await cartManager.loadCart(tabId);
  }

  async updateCounter(tabId, counterType, increment = 1) {
    const tab = await shopDB.get('tabs', tabId);
    if (!tab) return;

    const field = counterType === 'available' ? 'availableCount' : 'unavailableCount';
    const newValue = (tab[field] || 0) + increment;

    await shopDB.updateTab(tabId, {
      [field]: Math.max(0, newValue) // Prevent negative values
    });

    // Log event with timestamp for audio sync
    await shopDB.logEvent(
      tab.sessionId, 
      tabId, 
      `counter_${counterType}`, 
      { 
        previousValue: tab[field] || 0,
        newValue: newValue,
        increment: increment
      }
    );

    // Update UI
    if (tabId === this.activeTab) {
      const counterId = counterType === 'available' ? 'counter-available' : 'counter-unavailable';
      document.getElementById(counterId).textContent = newValue;
    }

    console.log(`[Tab] Counter updated: ${counterType} = ${newValue}`);
  }

  renderTabs() {
    const tabList = document.getElementById('tab-list');
    tabList.innerHTML = '';

    this.tabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = `tab ${tab.tabId === this.activeTab ? 'active' : ''}`;
      tabElement.dataset.tabId = tab.tabId;

      const colorDiv = document.createElement('div');
      colorDiv.className = `tab-color color-${tab.colorIndex}`;

      const label = document.createElement('div');
      label.className = 'tab-label';
      label.textContent = tab.customerId;

      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.handleTabClose(tab.tabId);
      };

      tabElement.appendChild(colorDiv);
      tabElement.appendChild(label);
      tabElement.appendChild(closeBtn);

      tabElement.onclick = () => this.setActiveTab(tab.tabId);

      tabList.appendChild(tabElement);
    });
  }

  handleTabClose(tabId) {
    // Show payment modal
    uiManager.showPaymentModal(tabId);
  }

  showTabsContainer() {
    document.getElementById('session-start').classList.add('hidden');
    document.getElementById('tabs-container').classList.remove('hidden');
  }

  hideTabsContainer() {
    document.getElementById('session-start').classList.remove('hidden');
    document.getElementById('tabs-container').classList.add('hidden');
  }

  async loadOpenTabs() {
    const session = await sessionManager.getCurrentSession();
    if (!session) return;

    const openTabs = await shopDB.getOpenTabs(session.sessionId);
    this.tabs = openTabs;

    if (this.tabs.length > 0) {
      this.setActiveTab(this.tabs[0].tabId);
      this.showTabsContainer();
    }
  }
}

// Create global tab manager
const tabManager = new TabManager();
