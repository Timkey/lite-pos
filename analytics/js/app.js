// Main Application
class AnalyticsApp {
  constructor() {
    this.searchTerm = '';
    this.filterStatus = 'all';
  }

  async init() {
    try {
      // Initialize database reader
      await shopDataReader.init();

      // Load analytics data
      const hasData = await analytics.loadData();

      if (!hasData || analytics.data.sessions.length === 0) {
        this.showErrorState('No sessions found. Please use Shop Tracker to create some data first.');
        return;
      }

      // Render dashboard
      await this.renderDashboard();
      this.attachEventListeners();
      this.hideLoadingState();

    } catch (error) {
      console.error('[App] Initialization error:', error);
      this.showErrorState(error.message || 'Failed to load analytics data. Please try again.');
    }
  }

  hideLoadingState() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
  }

  showErrorState(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'flex';
    if (message) {
      const errorMessageEl = document.getElementById('error-message');
      if (errorMessageEl) {
        errorMessageEl.textContent = message;
      }
    }
  }

  async renderDashboard() {
    this.renderSummaryCards();
    this.renderCharts();
    this.renderSessionsTable();
    this.renderCustomersTable();
    this.renderEventsTable();
  }

  renderSummaryCards() {
    const metrics = analytics.metrics;

    document.getElementById('total-sessions').textContent = metrics.totalSessions;
    document.getElementById('total-customers').textContent = metrics.totalCustomers;
    document.getElementById('total-revenue').textContent = analytics.formatCurrency(metrics.totalRevenue);
    document.getElementById('total-items').textContent = metrics.totalItems;
  }

  renderCharts() {
    this.renderSessionChart();
    this.renderRevenueChart();
  }

  renderSessionChart() {
    const container = document.getElementById('session-chart');
    const data = analytics.metrics.sessionsByDate;
    const entries = Object.entries(data).slice(-7); // Last 7 days

    if (entries.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No session data available</p>';
      return;
    }

    const maxValue = Math.max(...entries.map(([_, value]) => value));

    container.innerHTML = `
      <div class="chart-bar">
        ${entries.map(([date, count]) => `
          <div class="bar-item">
            <div class="bar-value">${count}</div>
            <div class="bar" style="height: ${(count / maxValue) * 100}%; min-height: 20px;"></div>
            <div class="bar-label">${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderRevenueChart() {
    const container = document.getElementById('revenue-chart');
    const data = analytics.metrics.revenueByDate;
    const entries = Object.entries(data).slice(-7); // Last 7 days

    if (entries.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No revenue data available</p>';
      return;
    }

    const maxValue = Math.max(...entries.map(([_, value]) => value));

    container.innerHTML = `
      <div class="chart-bar">
        ${entries.map(([date, revenue]) => `
          <div class="bar-item">
            <div class="bar-value">${analytics.formatCurrency(revenue)}</div>
            <div class="bar" style="height: ${(revenue / maxValue) * 100}%; min-height: 20px; background: var(--success);"></div>
            <div class="bar-label">${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderSessionsTable() {
    const tbody = document.getElementById('sessions-table-body');
    let sessions = analytics.data.sessions.sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );

    // Apply filters
    if (this.filterStatus !== 'all') {
      sessions = sessions.filter(s => s.status === this.filterStatus);
    }

    if (this.searchTerm) {
      sessions = sessions.filter(s => 
        s.sessionId.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    tbody.innerHTML = sessions.slice(0, 20).map(session => {
      const details = analytics.getSessionDetails(session.sessionId);
      return `
        <tr>
          <td><code>${session.sessionId.substring(0, 20)}...</code></td>
          <td>${analytics.formatDate(session.startTime)}</td>
          <td>${analytics.formatDuration(session.startTime, session.endTime)}</td>
          <td>${details.customerCount}</td>
          <td><strong>${analytics.formatCurrency(details.totalRevenue)}</strong></td>
          <td><span class="status-badge status-${session.status}">${session.status}</span></td>
          <td><button class="btn-view" onclick="app.viewSession('${session.sessionId}')">View</button></td>
        </tr>
      `;
    }).join('');
  }

  renderCustomersTable() {
    const tbody = document.getElementById('customers-table-body');
    const customers = analytics.metrics.customerStats.slice(0, 20);

    tbody.innerHTML = customers.map(customer => `
      <tr>
        <td><code>${customer.customerId}</code></td>
        <td>${customer.sessionCount}</td>
        <td><strong>${analytics.formatCurrency(customer.totalSpent)}</strong></td>
        <td>${analytics.formatCurrency(customer.totalSpent / customer.tabCount)}</td>
        <td>${customer.itemCount}</td>
        <td>${analytics.formatDate(customer.lastVisit)}</td>
      </tr>
    `).join('');
  }

  renderEventsTable() {
    const tbody = document.getElementById('events-table-body');
    const events = analytics.metrics.recentEvents.slice(0, 30);

    tbody.innerHTML = events.map(event => `
      <tr>
        <td>${analytics.formatDate(event.timestamp)}</td>
        <td><strong>${event.eventType}</strong></td>
        <td><code>${event.sessionId ? event.sessionId.substring(0, 15) + '...' : '-'}</code></td>
        <td><code>${event.tabId ? event.tabId.substring(0, 15) + '...' : '-'}</code></td>
        <td>${this.formatEventDetails(event)}</td>
      </tr>
    `).join('');
  }

  formatEventDetails(event) {
    const details = [];
    if (event.productName) details.push(`Product: ${event.productName}`);
    if (event.quantity) details.push(`Qty: ${event.quantity}`);
    if (event.amount) details.push(`Amount: ${analytics.formatCurrency(event.amount)}`);
    return details.join(' | ') || '-';
  }

  viewSession(sessionId) {
    const details = analytics.getSessionDetails(sessionId);
    alert(`Session Details:\n\nID: ${sessionId}\nTabs: ${details.tabs.length}\nRevenue: ${analytics.formatCurrency(details.totalRevenue)}\nEvents: ${details.events.length}`);
    // TODO: Implement detailed session view modal
  }

  attachEventListeners() {
    // Search
    const searchInput = document.getElementById('search-sessions');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.renderSessionsTable();
      });
    }

    // Filter
    const filterSelect = document.getElementById('filter-status');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.filterStatus = e.target.value;
        this.renderSessionsTable();
      });
    }
  }
}

// Create global instance
const app = new AnalyticsApp();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
