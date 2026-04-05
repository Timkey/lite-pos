// Main Application Entry Point
class App {
  constructor() {
    this.initialized = false;
  }

  async init() {
    try {
      console.log('[App] Initializing...');

      // Initialize database
      await shopDB.init();
      console.log('[App] Database ready');

      // Check for session recovery
      const recovery = await sessionManager.recoverSession();
      if (recovery.recovered) {
        console.log('[App] Session recovered');
        
        // Load recovered tabs
        tabManager.tabs = recovery.tabs;
        if (recovery.tabs.length > 0) {
          tabManager.setActiveTab(recovery.tabs[0].tabId);
          tabManager.showTabsContainer();
        }

        // Ask user if they want to continue
        if (confirm('Previous session found. Continue where you left off?')) {
          // Resume audio recording
          await audioRecorder.startRecording(recovery.session.sessionId);
        } else {
          // End recovered session
          await sessionManager.endSession();
          tabManager.hideTabsContainer();
        }
      }

      // Initialize UI components
      uiManager.init();
      calculator.init();

      // Check storage quota
      await uiManager.showStorageWarning();

      this.initialized = true;
      console.log('[App] Initialized successfully');

      // Log app info
      this.logAppInfo();

    } catch (error) {
      console.error('[App] Initialization failed:', error);
      alert('Failed to initialize application. Please refresh the page.');
    }
  }

  logAppInfo() {
    console.log(`
╔════════════════════════════════════════════╗
║   Shop Activity Tracker v1.0               ║
║   Offline PWA with Multi-tab Support       ║
╚════════════════════════════════════════════╝

Features:
✓ Offline-capable Progressive Web App
✓ Multi-customer tab management
✓ Audio session recording
✓ Calculator with discount detection
✓ IndexedDB persistent storage
✓ Session recovery on reload

Status: Ready
    `);
  }

  async exportData() {
    try {
      const data = {
        sessions: await shopDB.getAll('sessions'),
        tabs: await shopDB.getAll('tabs'),
        lineItems: await shopDB.getAll('lineItems'),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `shop-data-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      console.log('[App] Data exported successfully');
      return true;
    } catch (error) {
      console.error('[App] Export failed:', error);
      return false;
    }
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Import sessions
      for (const session of data.sessions) {
        await shopDB.put('sessions', session);
      }

      // Import tabs
      for (const tab of data.tabs) {
        await shopDB.put('tabs', tab);
      }

      // Import line items
      for (const item of data.lineItems) {
        await shopDB.put('lineItems', item);
      }

      console.log('[App] Data imported successfully');
      alert('Data imported successfully. Reloading...');
      location.reload();
      return true;
    } catch (error) {
      console.error('[App] Import failed:', error);
      alert('Import failed. Please check the file format.');
      return false;
    }
  }

  async clearAllData() {
    if (!confirm('Clear all data? This cannot be undone!')) {
      return false;
    }

    if (!confirm('Are you absolutely sure? All sessions and recordings will be deleted!')) {
      return false;
    }

    try {
      await shopDB.clear('sessions');
      await shopDB.clear('tabs');
      await shopDB.clear('lineItems');
      await shopDB.clear('audioChunks');
      await shopDB.clear('products');

      console.log('[App] All data cleared');
      alert('All data cleared. Reloading...');
      location.reload();
      return true;
    } catch (error) {
      console.error('[App] Clear failed:', error);
      return false;
    }
  }
}

// Create global app instance
const app = new App();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Make app utilities available in console
window.shopApp = {
  exportData: () => app.exportData(),
  importData: (file) => app.importData(file),
  clearAllData: () => app.clearAllData(),
  getStorageInfo: () => shopDB.checkStorageQuota(),
  version: '1.0.0'
};

// Log helper message
console.log('💡 Tip: Use shopApp.exportData() to export your data');
