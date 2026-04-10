// Analytics Engine
class Analytics {
  constructor() {
    this.data = {
      sessions: [],
      tabs: [],
      lineItems: [],
      events: []
    };
    this.metrics = {};
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
    const { sessions, tabs, lineItems } = this.data;

    // Total sessions
    this.metrics.totalSessions = sessions.length;

    // Total customers (unique customer IDs from tabs)
    const customerIds = tabs
      .map(t => t.customerId)
      .filter(id => id !== null && id !== undefined);
    this.metrics.totalCustomers = new Set(customerIds).size;

    // Total revenue
    this.metrics.totalRevenue = tabs.reduce((sum, tab) => {
      const revenue = tab.agreedTotal !== null ? tab.agreedTotal : tab.total;
      return sum + (revenue || 0);
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
  }

  groupByDate(items, dateField) {
    const grouped = {};
    items.forEach(item => {
      if (!item[dateField]) return;
      const date = new Date(item[dateField]).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return grouped;
  }

  calculateRevenueByDate() {
    const revenueByDate = {};
    this.data.tabs.forEach(tab => {
      if (!tab.startTime) return;
      const date = new Date(tab.startTime).toLocaleDateString();
      const revenue = tab.agreedTotal !== null ? tab.agreedTotal : tab.total;
      revenueByDate[date] = (revenueByDate[date] || 0) + (revenue || 0);
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
