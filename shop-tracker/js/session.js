// Session Manager
class SessionManager {
  constructor() {
    this.currentSession = null;
    this.activeTabs = [];
  }

  async startSession() {
    try {
      // Create new session
      const sessionId = await shopDB.createSession({
        status: 'active'
      });

      this.currentSession = await shopDB.get('sessions', sessionId);
      
      // Start audio recording
      await audioRecorder.startRecording(sessionId);

      console.log('[Session] Started:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('[Session] Failed to start:', error);
      throw error;
    }
  }

  async endSession() {
    if (!this.currentSession) return;

    try {
      // Stop audio recording
      await audioRecorder.stopRecording();

      // Update session status
      await shopDB.updateSession(this.currentSession.sessionId, {
        endTime: new Date().toISOString(),
        status: 'completed'
      });

      console.log('[Session] Ended:', this.currentSession.sessionId);
      this.currentSession = null;
    } catch (error) {
      console.error('[Session] Failed to end:', error);
      throw error;
    }
  }

  async getCurrentSession() {
    if (!this.currentSession) {
      this.currentSession = await shopDB.getActiveSession();
    }
    return this.currentSession;
  }

  async getSessionSummary(sessionId) {
    const session = await shopDB.get('sessions', sessionId);
    const tabs = await shopDB.getTabsBySession(sessionId);
    
    let totalSales = 0;
    let totalDiscounts = 0;
    let itemCount = 0;

    for (const tab of tabs) {
      const items = await shopDB.getLineItemsByTab(tab.tabId);
      for (const item of items) {
        itemCount++;
        totalSales += item.actualCharged || item.calculatedTotal;
        totalDiscounts += item.discountAmount || 0;
      }
    }

    return {
      session,
      tabs,
      totalSales,
      totalDiscounts,
      itemCount,
      tabCount: tabs.length,
      completedTabs: tabs.filter(t => t.status === 'completed').length
    };
  }

  async recoverSession() {
    // Check for incomplete session on app load
    const activeSession = await shopDB.getActiveSession();
    
    if (activeSession) {
      console.log('[Session] Recovering session:', activeSession.sessionId);
      this.currentSession = activeSession;
      
      // Check if there are open tabs
      const openTabs = await shopDB.getOpenTabs(activeSession.sessionId);
      
      if (openTabs.length > 0) {
        // Resume session
        return {
          recovered: true,
          session: activeSession,
          tabs: openTabs
        };
      } else {
        // No open tabs, end the session
        await this.endSession();
        return { recovered: false };
      }
    }
    
    return { recovered: false };
  }
}

// Create global session manager
const sessionManager = new SessionManager();
