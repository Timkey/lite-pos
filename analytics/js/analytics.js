// Analytics Engine
class Analytics {
  constructor() {
    this.data = {
      sessions: [],
      tabs: [],
      lineItems: [],
      events: [],
      audioChunks: []
    };
    this.metrics = {};
    this.sessionQuality = new Map(); // Cache for session authenticity scores
    this.dateFilter = {
      type: '7', // 'all', '7', '30', '90', 'custom'
      startDate: null,
      endDate: null
    };
  }

  setDateFilter(type, startDate = null, endDate = null) {
    this.dateFilter = { type, startDate, endDate };
    this.calculateMetrics(); // Recalculate with new filter
  }

  getFilteredData() {
    if (this.dateFilter.type === 'all') {
      return this.data;
    }

    const now = new Date();
    let cutoffDate;

    if (this.dateFilter.type === 'custom' && this.dateFilter.startDate) {
      cutoffDate = new Date(this.dateFilter.startDate);
    } else {
      const days = parseInt(this.dateFilter.type);
      cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }

    const filterByDate = (item, dateField) => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate >= cutoffDate;
    };

    // Filter all data
    const filteredSessions = this.data.sessions.filter(s => filterByDate(s, 'startTime'));
    const sessionIds = new Set(filteredSessions.map(s => s.sessionId));
    
    const filteredTabs = this.data.tabs.filter(t => sessionIds.has(t.sessionId));
    const tabIds = new Set(filteredTabs.map(t => t.tabId));
    
    const filteredLineItems = this.data.lineItems.filter(i => tabIds.has(i.tabId));
    const filteredEvents = this.data.events.filter(e => sessionIds.has(e.sessionId));
    const filteredAudioChunks = this.data.audioChunks.filter(a => sessionIds.has(a.sessionId));

    return {
      sessions: filteredSessions,
      tabs: filteredTabs,
      lineItems: filteredLineItems,
      events: filteredEvents,
      audioChunks: filteredAudioChunks
    };
  }

  async loadData() {
    try {
      this.data = await shopDataReader.getAllData();
      this.calculateMetrics();
      return true;
    } catch (error) {
      console.error('[Analytics] Failed to load data:', error);
      return false;
    }
  }

  calculateMetrics() {
    // Use filtered data instead of raw data
    const filteredData = this.getFilteredData();
    const { sessions, tabs, lineItems } = filteredData;
    
    // Temporarily replace this.data for calculations
    const originalData = this.data;
    this.data = filteredData;

    // Total sessions (only completed)
    const completedSessions = sessions.filter(s => s.endTime);
    this.metrics.totalSessions = sessions.length;
    this.metrics.completedSessions = completedSessions.length;

    // Total customers - count unique customers PER SESSION
    // customerId format is "Customer 1", "Customer 2", etc. - session-specific, not global
    // So total customers = sum of max customer number per session
    this.metrics.totalCustomers = sessions.reduce((total, session) => {
      const sessionTabs = tabs.filter(t => t.sessionId === session.sessionId);
      const maxCustomerId = sessionTabs.reduce((max, tab) => {
        if (!tab.customerId) return max;
        // Extract number from "Customer N" format
        const match = tab.customerId.match(/\d+/);
        const customerNum = match ? parseInt(match[0]) : 0;
        return Math.max(max, customerNum);
      }, 0);
      return total + maxCustomerId;
    }, 0);

    // Total revenue - FIX: Use agreedTotal or total, not both
    this.metrics.totalRevenue = tabs.reduce((sum, tab) => {
      // Prefer agreedTotal, fallback to total
      const revenue = (tab.agreedTotal !== null && tab.agreedTotal !== undefined) 
        ? tab.agreedTotal 
        : (tab.total || 0);
      return sum + revenue;
    }, 0);

    // Total items
    this.metrics.totalItems = lineItems.length;

    // Average order value
    const completedTabs = tabs.filter(t => t.status === 'completed' || t.status === 'closed');
    this.metrics.avgOrderValue = completedTabs.length > 0
      ? this.metrics.totalRevenue / completedTabs.length
      : 0;

    // Sessions by date
    this.metrics.sessionsByDate = this.groupByDate(sessions, 'startTime');

    // Revenue by date
    this.metrics.revenueByDate = this.calculateRevenueByDate();

    // Customer statistics
    this.metrics.customerStats = this.calculateCustomerStats();

    // Recent events
    this.metrics.recentEvents = this.data.events
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);

    // SESSION QUALITY METRICS
    this.metrics.qualityMetrics = this.calculateQualityMetrics();
    
    // SESSION COMPLEXITY METRICS
    this.metrics.sessionComplexity = this.calculateSessionComplexity();
    
    // Restore original data after calculations
    this.data = originalData;
  }

  groupByDate(items, dateField) {
    const grouped = {};
    items.forEach(item => {
      if (!item[dateField]) return;
      const date = new Date(item[dateField]).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return grouped;
  }

  calculateRevenueByDate() {
    const revenueByDate = {};
    this.data.tabs.forEach(tab => {
      if (!tab.startTime) return;
      const date = new Date(tab.startTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      const revenue = (tab.agreedTotal !== null && tab.agreedTotal !== undefined) 
        ? tab.agreedTotal 
        : (tab.total || 0);
      revenueByDate[date] = (revenueByDate[date] || 0) + revenue;
    });
    return revenueByDate;
  }

  calculateCustomerStats() {
    const customerData = {};

    this.data.tabs.forEach(tab => {
      const customerId = tab.customerId || 'Unknown';
      
      if (!customerData[customerId]) {
        customerData[customerId] = {
          customerId,
          sessions: new Set(),
          totalSpent: 0,
          itemCount: 0,
          lastVisit: null,
          tabCount: 0
        };
      }

      customerData[customerId].sessions.add(tab.sessionId);
      customerData[customerId].tabCount++;
      const revenue = tab.agreedTotal !== null ? tab.agreedTotal : tab.total;
      customerData[customerId].totalSpent += revenue || 0;

      const tabDate = new Date(tab.startTime);
      if (!customerData[customerId].lastVisit || tabDate > customerData[customerId].lastVisit) {
        customerData[customerId].lastVisit = tabDate;
      }
    });

    // Count items per customer
    this.data.lineItems.forEach(item => {
      const tab = this.data.tabs.find(t => t.tabId === item.tabId);
      if (tab) {
        const customerId = tab.customerId || 'Unknown';
        if (customerData[customerId]) {
          customerData[customerId].itemCount++;
        }
      }
    });

    // Convert Set to count
    return Object.values(customerData).map(customer => ({
      ...customer,
      sessionCount: customer.sessions.size
    })).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  getSessionDetails(sessionId) {
    const session = this.data.sessions.find(s => s.sessionId === sessionId);
    if (!session) return null;

    const tabs = this.data.tabs.filter(t => t.sessionId === sessionId);
    const events = this.data.events.filter(e => e.sessionId === sessionId);

    return {
      session,
      tabs,
      events,
      totalRevenue: tabs.reduce((sum, t) => sum + (t.agreedTotal !== null ? t.agreedTotal : t.total || 0), 0),
      customerCount: tabs.filter(t => t.customerId).length
    };
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(startTime, endTime) {
    if (!endTime) return 'In Progress';
    const duration = new Date(endTime) - new Date(startTime);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // ==================== SESSION QUALITY ANALYSIS ====================
  
  /**
   * Calculate session authenticity score (0-100)
   * Based on event distribution, audio presence, time gaps, and duration match
   */
  calculateSessionAuthenticity(sessionId) {
    // Check cache first
    if (this.sessionQuality.has(sessionId)) {
      return this.sessionQuality.get(sessionId);
    }

    const session = this.data.sessions.find(s => s.sessionId === sessionId);
    if (!session || !session.endTime) {
      return null; // Can't analyze in-progress sessions
    }

    const events = this.data.events.filter(e => e.sessionId === sessionId);
    const audioChunks = this.data.audioChunks.filter(a => a.sessionId === sessionId);

    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    const sessionDuration = (endTime - startTime) / 1000 / 60; // in minutes

    if (sessionDuration <= 0 || events.length === 0) {
      return null;
    }

    // Calculate activity duration (time from first to last event)
    const eventTimes = events
      .map(e => new Date(e.timestampMs || e.timestamp).getTime())
      .sort((a, b) => a - b);
    const activityDuration = (eventTimes[eventTimes.length - 1] - eventTimes[0]) / 1000 / 60;

    // Component 1: Event Distribution (0-100)
    const activityRatio = activityDuration / sessionDuration;
    const eventDistribution = Math.min(100, activityRatio * 100);

    // Component 2: Audio Presence (0-100)
    const audioPresence = audioChunks.length > 0 ? 
      Math.min(100, (audioChunks.length / sessionDuration) * 30) : 0;

    // Component 3: Time Gap Naturalness (0-100)
    let timeGapNaturalness = 100;
    if (events.length > 1) {
      const gaps = [];
      for (let i = 1; i < eventTimes.length; i++) {
        gaps.push((eventTimes[i] - eventTimes[i-1]) / 1000); // in seconds
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const rapidEntries = gaps.filter(g => g < 10).length;
      const rapidRatio = rapidEntries / gaps.length;
      
      // Penalize if too many rapid entries (< 10 seconds apart)
      timeGapNaturalness = rapidRatio > 0.5 ? 
        Math.max(0, 100 - (rapidRatio * 100)) : 100;
      
      // Bonus for natural spacing (30-300 seconds)
      if (avgGap >= 30 && avgGap <= 300 && rapidRatio < 0.3) {
        timeGapNaturalness = Math.min(100, timeGapNaturalness + 20);
      }
    }

    // Component 4: Duration Match (0-100)
    const durationMatch = activityRatio >= 0.3 ? 
      Math.min(100, activityRatio * 150) : activityRatio * 100;

    // Weighted authenticity score
    const authenticity = Math.round(
      eventDistribution * 0.3 +
      audioPresence * 0.3 +
      timeGapNaturalness * 0.2 +
      durationMatch * 0.2
    );

    // Detect flags
    const flags = [];
    if (audioChunks.length === 0) flags.push('no_audio');
    if (activityRatio < 0.3) flags.push('low_activity_ratio');
    if (sessionDuration > 120 && activityRatio < 0.2) flags.push('suspicious_duration');
    if (events.length >= 5) {
      const gaps = [];
      for (let i = 1; i < eventTimes.length; i++) {
        gaps.push((eventTimes[i] - eventTimes[i-1]) / 1000);
      }
      const rapidRatio = gaps.filter(g => g < 10).length / gaps.length;
      if (rapidRatio > 0.5) flags.push('rapid_entries_high');
    }
    
    // Check for bulk entry pattern (5+ events in < 30 seconds)
    if (events.length >= 5) {
      const firstFiveSpan = (eventTimes[4] - eventTimes[0]) / 1000;
      if (firstFiveSpan < 30) flags.push('bulk_entry');
    }

    const result = {
      sessionId,
      score: authenticity,
      components: {
        eventDistribution: Math.round(eventDistribution),
        audioPresence: Math.round(audioPresence),
        timeGapNaturalness: Math.round(timeGapNaturalness),
        durationMatch: Math.round(durationMatch)
      },
      metrics: {
        sessionDuration: sessionDuration.toFixed(1),
        activityDuration: activityDuration.toFixed(1),
        activityRatio: activityRatio.toFixed(3),
        eventCount: events.length,
        audioChunkCount: audioChunks.length
      },
      flags
    };

    // Cache the result
    this.sessionQuality.set(sessionId, result);
    return result;
  }

  /**
   * Get quality badge based on authenticity score
   */
  getQualityBadge(score) {
    if (score === null || score === undefined) return { emoji: '⚪', label: 'Unknown', class: 'badge-unknown' };
    if (score >= 70) return { emoji: '🟢', label: 'Authentic', class: 'badge-green' };
    if (score >= 40) return { emoji: '🟡', label: 'Questionable', class: 'badge-yellow' };
    return { emoji: '🔴', label: 'Suspicious', class: 'badge-red' };
  }

  /**
   * Get human-readable flag descriptions
   */
  getFlagDescription(flag) {
    const descriptions = {
      'no_audio': 'No Audio',
      'low_activity_ratio': 'Low Activity',
      'suspicious_duration': 'Long Session',
      'rapid_entries_high': 'Rapid Entry',
      'bulk_entry': 'Bulk Entry'
    };
    return descriptions[flag] || flag;
  }

  /**
   * Calculate overall quality metrics for all sessions
   */
  calculateQualityMetrics() {
    const completedSessions = this.data.sessions.filter(s => s.endTime);
    const scores = [];
    let flaggedCount = 0;
    let audioCount = 0;

    completedSessions.forEach(session => {
      const quality = this.calculateSessionAuthenticity(session.sessionId);
      if (quality) {
        scores.push(quality.score);
        if (quality.flags.length > 0) flaggedCount++;
        if (quality.metrics.audioChunkCount > 0) audioCount++;
      }
    });

    const avgAuthenticity = scores.length > 0 ?
      scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const distribution = {
      authentic: scores.filter(s => s >= 70).length,
      questionable: scores.filter(s => s >= 40 && s < 70).length,
      suspicious: scores.filter(s => s < 40).length
    };

    return {
      avgAuthenticity: avgAuthenticity.toFixed(1),
      flaggedCount,
      audioCoverage: completedSessions.length > 0 ?
        ((audioCount / completedSessions.length) * 100).toFixed(1) : 0,
      distribution,
      totalAnalyzed: scores.length
    };
  }

  calculateSessionComplexity() {
    // Group sessions by number of customers served
    const complexityByCustomerCount = {};
    
    this.data.sessions.forEach(session => {
      if (!session.endTime) return; // Only completed sessions
      
      // Get tabs for this session
      const sessionTabs = this.data.tabs.filter(t => t.sessionId === session.sessionId);
      
      // Extract customer numbers from customerId strings like "Customer 1", "Customer 2"
      const customerCount = sessionTabs.reduce((max, tab) => {
        if (!tab.customerId) return max;
        // Extract number from "Customer N" format
        const match = tab.customerId.match(/\d+/);
        const customerNum = match ? parseInt(match[0]) : 0;
        return Math.max(max, customerNum);
      }, 0);
      
      // Get items for this session
      const tabIds = sessionTabs.map(t => t.tabId);
      const sessionItems = this.data.lineItems.filter(item => 
        tabIds.includes(item.tabId));
      
      // Calculate duration in minutes
      const duration = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60);
      
      // Get revenue for this session
      const revenue = sessionTabs.reduce((sum, tab) => {
        const rev = (tab.agreedTotal !== null && tab.agreedTotal !== undefined) 
          ? tab.agreedTotal 
          : (tab.total || 0);
        return sum + rev;
      }, 0);
      
      if (!complexityByCustomerCount[customerCount]) {
        complexityByCustomerCount[customerCount] = {
          sessionCount: 0,
          totalDuration: 0,
          totalItems: 0,
          totalRevenue: 0
        };
      }
      
      complexityByCustomerCount[customerCount].sessionCount++;
      complexityByCustomerCount[customerCount].totalDuration += duration;
      complexityByCustomerCount[customerCount].totalItems += sessionItems.length;
      complexityByCustomerCount[customerCount].totalRevenue += revenue;
    });
    
    // Calculate averages
    const result = {};
    Object.keys(complexityByCustomerCount).forEach(customerCount => {
      const data = complexityByCustomerCount[customerCount];
      result[customerCount] = {
        avgDuration: data.totalDuration / data.sessionCount,
        avgItems: data.totalItems / data.sessionCount,
        avgRevenue: data.totalRevenue / data.sessionCount,
        sessionCount: data.sessionCount
      };
    });
    
    return result;
  }

  exportData() {
    const exportData = {
      exportDate: new Date().toISOString(),
      metrics: this.metrics,
      rawData: this.data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop-tracker-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async refreshData() {
    const loadingState = document.getElementById('loading-state');
    const dashboardContent = document.getElementById('dashboard-content');
    
    loadingState.style.display = 'flex';
    dashboardContent.style.display = 'none';
    
    await this.loadData();
    await app.renderDashboard();
    
    loadingState.style.display = 'none';
    dashboardContent.style.display = 'block';
  }
}

// Create global instance
const analytics = new Analytics();
