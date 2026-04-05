// IndexedDB Database Layer
class ShopDB {
  constructor() {
    this.dbName = 'ShopTrackerDB';
    this.version = 3; // Incremented for edit tracking
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[DB] Database initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Sessions table
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { 
            keyPath: 'sessionId', 
            autoIncrement: false 
          });
          sessionsStore.createIndex('startTime', 'startTime', { unique: false });
          sessionsStore.createIndex('status', 'status', { unique: false });
        }

        // Tabs table
        if (!db.objectStoreNames.contains('tabs')) {
          const tabsStore = db.createObjectStore('tabs', { 
            keyPath: 'tabId', 
            autoIncrement: false 
          });
          tabsStore.createIndex('sessionId', 'sessionId', { unique: false });
          tabsStore.createIndex('status', 'status', { unique: false });
        }

        // Line Items table
        if (!db.objectStoreNames.contains('lineItems')) {
          const itemsStore = db.createObjectStore('lineItems', { 
            keyPath: 'itemId', 
            autoIncrement: false 
          });
          itemsStore.createIndex('tabId', 'tabId', { unique: false });
          itemsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Audio Chunks table
        if (!db.objectStoreNames.contains('audioChunks')) {
          const audioStore = db.createObjectStore('audioChunks', { 
            keyPath: 'chunkId', 
            autoIncrement: false 
          });
          audioStore.createIndex('sessionId', 'sessionId', { unique: false });
          audioStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Products table (for future use)
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { 
            keyPath: 'productId', 
            autoIncrement: false 
          });
          productsStore.createIndex('name', 'name', { unique: false });
          productsStore.createIndex('unitPrice', 'unitPrice', { unique: false });
        }

        // Events table (for logging counter clicks, navigation, etc.)
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { 
            keyPath: 'eventId', 
            autoIncrement: false 
          });
          eventsStore.createIndex('sessionId', 'sessionId', { unique: false });
          eventsStore.createIndex('tabId', 'tabId', { unique: false });
          eventsStore.createIndex('eventType', 'eventType', { unique: false });
          eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('[DB] Object stores created');
      };
    });
  }

  // Generic CRUD operations
  async add(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex(storeName, indexName, value) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Specific methods for sessions
  async createSession(sessionData) {
    return this.add('sessions', {
      sessionId: `session_${Date.now()}`,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      audioChunks: [],
      ...sessionData
    });
  }

  async updateSession(sessionId, updates) {
    const session = await this.get('sessions', sessionId);
    return this.put('sessions', { ...session, ...updates });
  }

  async getActiveSession() {
    const sessions = await this.getAll('sessions');
    return sessions.find(s => s.status === 'active');
  }

  // Specific methods for tabs
  async createTab(sessionId, tabData) {
    return this.add('tabs', {
      tabId: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      customerId: null,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'open',
      availableCount: 0,
      unavailableCount: 0,
      paymentMethod: null,
      total: 0,
      agreedTotal: null, // Actual amount customer pays (can differ from calculated)
      reconciliationNotes: null, // Notes for discrepancies
      validationFlags: {
        counterMismatch: false,
        amountMismatch: false,
        incompleteLogging: false,
        missingItemCount: 0,
        amountDifference: 0,
        hasDiscrepancy: false
      },
      ...tabData
    });
  }

  async updateTab(tabId, updates) {
    const tab = await this.get('tabs', tabId);
    return this.put('tabs', { ...tab, ...updates });
  }

  async updateTabPaymentInfo(tabId, paymentUpdates) {
    const tab = await this.get('tabs', tabId);
    if (!tab) throw new Error('Tab not found');
    
    return this.put('tabs', { 
      ...tab, 
      ...paymentUpdates,
      lastModified: new Date().toISOString()
    });
  }

  async getTabsBySession(sessionId) {
    return this.getAllByIndex('tabs', 'sessionId', sessionId);
  }

  async getOpenTabs(sessionId) {
    const tabs = await this.getTabsBySession(sessionId);
    return tabs.filter(t => t.status === 'open');
  }

  // Specific methods for line items
  async addLineItem(tabId, itemData) {
    return this.add('lineItems', {
      itemId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tabId,
      timestamp: new Date().toISOString(),
      ...itemData
    });
  }

  async getLineItemsByTab(tabId) {
    return this.getAllByIndex('lineItems', 'tabId', tabId);
  }

  async updateLineItem(itemId, updates) {
    const item = await this.get('lineItems', itemId);
    if (!item) throw new Error('Line item not found');
    
    return this.update('lineItems', itemId, {
      ...updates,
      lastModified: new Date().toISOString()
    });
  }

  async deleteLineItem(itemId) {
    return this.delete('lineItems', itemId);
  }

  // Event logging for audio sync
  async logEvent(sessionId, tabId, eventType, eventData = {}) {
    return this.add('events', {
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      tabId,
      eventType, // 'counter_available', 'counter_unavailable', 'item_added', 'checkout', etc.
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      ...eventData
    });
  }

  async getEventsBySession(sessionId) {
    return this.getAllByIndex('events', 'sessionId', sessionId);
  }

  async getEventsByTab(tabId) {
    return this.getAllByIndex('events', 'tabId', tabId);
  }

  // Validation helpers
  async calculateValidationFlags(tabId) {
    const tab = await this.get('tabs', tabId);
    const lineItems = await this.getLineItemsByTab(tabId);
    
    if (!tab) return null;

    const totalLogged = lineItems.length;
    const expectedCount = tab.availableCount || 0;
    const calculatedTotal = lineItems.reduce((sum, item) => sum + item.actualCharged, 0);
    const agreedTotal = tab.agreedTotal !== null ? tab.agreedTotal : calculatedTotal;
    
    const counterMismatch = expectedCount !== totalLogged;
    const amountMismatch = Math.abs(calculatedTotal - agreedTotal) > 0.01;
    const incompleteLogging = expectedCount > 0 && totalLogged === 0;
    const missingItemCount = expectedCount - totalLogged;
    const amountDifference = agreedTotal - calculatedTotal;
    
    return {
      counterMismatch,
      amountMismatch,
      incompleteLogging,
      criticalIssue: incompleteLogging || Math.abs(missingItemCount) > 3,
      missingItemCount,
      amountDifference: parseFloat(amountDifference.toFixed(2)),
      hasDiscrepancy: counterMismatch || amountMismatch || incompleteLogging,
      calculatedTotal,
      agreedTotal,
      expectedCount,
      actualCount: totalLogged
    };
  }

  // Storage quota check
  async checkStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const percentUsed = (estimate.usage / estimate.quota) * 100;
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentUsed: percentUsed.toFixed(2),
        available: estimate.quota - estimate.usage
      };
    }
    return null;
  }
}

// Create global database instance
const shopDB = new ShopDB();
