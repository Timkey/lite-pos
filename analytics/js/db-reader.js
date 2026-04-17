// Database Reader - Reads from Shop Tracker's IndexedDB
class ShopDataReader {
  constructor() {
    this.dbName = 'ShopTrackerDB';
    this.version = 2;
    this.db = null;
  }

  async init() {
    // First, check if database exists without opening it
    try {
      const databases = await indexedDB.databases();
      const shopDB = databases.find(db => db.name === 'ShopTrackerDB');
      
      if (!shopDB) {
        throw new Error('Shop Tracker database not found. Please open and use shop-tracker app first to create the database.');
      }
      
      if (shopDB.version < 2) {
        throw new Error(`Shop Tracker database is version ${shopDB.version}, but version 2 is required. Please open shop-tracker app to upgrade.`);
      }
      
      console.log('[Analytics] Found ShopTrackerDB version:', shopDB.version);
    } catch (err) {
      if (err.message.includes('Shop Tracker database')) {
        throw err;
      }
      console.warn('[Analytics] Could not check database list, will try to open:', err);
    }

    return new Promise((resolve, reject) => {
      // Open database without specifying version - use whatever exists
      const request = indexedDB.open(this.dbName);

      request.onerror = () => {
        console.error('[Analytics] Failed to open database');
        reject(new Error('Failed to open database. Please ensure shop-tracker has been used at least once.'));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        
        console.log('[Analytics] Database opened, version:', this.db.version);
        console.log('[Analytics] Available stores:', Array.from(this.db.objectStoreNames));
        
        // Verify required stores exist
        const expectedStores = ['sessions', 'tabs', 'lineItems', 'events'];
        const missingStores = expectedStores.filter(store => 
          !this.db.objectStoreNames.contains(store)
        );
        
        if (missingStores.length > 0) {
          console.error('[Analytics] Missing required object stores:', missingStores);
          this.db.close();
          reject(new Error(`Shop Tracker database is not properly initialized. Please open shop-tracker app and start a session to create the required data structures.`));
          return;
        }
        
        console.log('[Analytics] Successfully connected to Shop Tracker database');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        // CRITICAL: Never create stores in analytics app!
        // If this fires, it means database doesn't exist yet
        console.error('[Analytics] Upgrade triggered - this should never happen in analytics app');
        const db = event.target.result;
        
        // Abort the upgrade to prevent creating empty database
        db.close();
        
        // The transaction will error out, which is what we want
        reject(new Error('Shop Tracker database does not exist. Please open shop-tracker app first to initialize it.'));
      };
    });
  }

  async getAll(storeName) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex(storeName, indexName, value) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSessions() {
    try {
      return await this.getAll('sessions');
    } catch (error) {
      console.error('[Analytics] Error fetching sessions:', error);
      return [];
    }
  }

  async getTabs() {
    try {
      return await this.getAll('tabs');
    } catch (error) {
      console.error('[Analytics] Error fetching tabs:', error);
      return [];
    }
  }

  async getLineItems() {
    try {
      return await this.getAll('lineItems');
    } catch (error) {
      console.error('[Analytics] Error fetching line items:', error);
      return [];
    }
  }

  async getEvents() {
    try {
      return await this.getAll('events');
    } catch (error) {
      console.error('[Analytics] Error fetching events:', error);
      return [];
    }
  }

  async getAudioChunks() {
    try {
      return await this.getAll('audioChunks');
    } catch (error) {
      console.error('[Analytics] Error fetching audio chunks:', error);
      return [];
    }
  }

  async getTabsBySession(sessionId) {
    try {
      return await this.getAllByIndex('tabs', 'sessionId', sessionId);
    } catch (error) {
      console.error('[Analytics] Error fetching tabs for session:', error);
      return [];
    }
  }

  async getLineItemsByTab(tabId) {
    try {
      return await this.getAllByIndex('lineItems', 'tabId', tabId);
    } catch (error) {
      console.error('[Analytics] Error fetching line items for tab:', error);
      return [];
    }
  }

  async getAllData() {
    try {
      const [sessions, tabs, lineItems, events, audioChunks] = await Promise.all([
        this.getSessions(),
        this.getTabs(),
        this.getLineItems(),
        this.getEvents(),
        this.getAudioChunks()
      ]);

      return {
        sessions,
        tabs,
        lineItems,
        events,
        audioChunks
      };
    } catch (error) {
      console.error('[Analytics] Error fetching all data:', error);
      throw error;
    }
  }

  hasData() {
    return this.db !== null;
  }
}

// Create global instance
const shopDataReader = new ShopDataReader();
