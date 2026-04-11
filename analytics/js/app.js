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
    this.renderQualityAnalysis();
    this.renderSessionsTable();
    this.renderCustomersTable();
    this.renderEventsTable();
  }

  renderSummaryCards() {
    const metrics = analytics.metrics;

    // Basic metrics
    document.getElementById('total-sessions').textContent = metrics.totalSessions;
    document.getElementById('total-customers').textContent = metrics.totalCustomers;
    document.getElementById('total-revenue').textContent = analytics.formatCurrency(metrics.totalRevenue);
    document.getElementById('total-items').textContent = metrics.totalItems;

    // Quality metrics
    const quality = metrics.qualityMetrics;
    if (quality) {
      document.getElementById('avg-authenticity').textContent = quality.avgAuthenticity;
      const badge = analytics.getQualityBadge(parseFloat(quality.avgAuthenticity));
      document.getElementById('quality-trend').textContent = badge.emoji + ' ' + badge.label;

      document.getElementById('flagged-sessions').textContent = quality.flaggedCount;
      const flaggedPct = quality.totalAnalyzed > 0 ? 
        ((quality.flaggedCount / quality.totalAnalyzed) * 100).toFixed(0) : 0;
      document.getElementById('flagged-percentage').textContent = `${flaggedPct}% of sessions`;

      document.getElementById('audio-coverage').textContent = quality.audioCoverage + '%';
      const audioLabel = parseFloat(quality.audioCoverage) >= 90 ? '🟢 Excellent' :
                         parseFloat(quality.audioCoverage) >= 70 ? '🟡 Good' : '🔴 Needs Improvement';
      document.getElementById('audio-subtitle').textContent = audioLabel;

      const dist = quality.distribution;
      document.getElementById('quality-distribution').textContent = 
        `${dist.authentic} | ${dist.questionable} | ${dist.suspicious}`;
    }
  }

  renderCharts() {
    this.renderSessionChart();
    this.renderRevenueChart();
  }

  renderSessionChart() {
    const container = document.getElementById('session-chart');
    const data = analytics.metrics.sessionsByDate;
    
    console.log('[Session Chart] Raw data:', data);
    
    if (!data || Object.keys(data).length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No session data available</p>';
      return;
    }

    // Sort entries chronologically and take last 7
    const entries = Object.entries(data)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .slice(-7);

    console.log('[Session Chart] Entries to render:', entries);

    if (entries.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No session data available</p>';
      return;
    }

    const maxValue = Math.max(...entries.map(([_, value]) => value), 1);
    console.log('[Session Chart] Max value:', maxValue);

    container.innerHTML = `
      <div class="chart-bar">
        ${entries.map(([date, count]) => {
          // Calculate percentage height with minimum of 8% for visibility
          const heightPercent = Math.max((count / maxValue) * 100, 8);
          return `
            <div class="bar-item">
              <div class="bar-value">${count}</div>
              <div class="bar" style="height: ${heightPercent}%;"></div>
              <div class="bar-label">${date}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderRevenueChart() {
    const container = document.getElementById('revenue-chart');
    const data = analytics.metrics.revenueByDate;
    
    if (!data || Object.keys(data).length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No revenue data available</p>';
      return;
    }

    // Sort entries chronologically and take last 7
    const entries = Object.entries(data)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .slice(-7);

    if (entries.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No revenue data available</p>';
      return;
    }

    const maxValue = Math.max(...entries.map(([_, value]) => value), 1);

    container.innerHTML = `
      <div class="chart-bar">
        ${entries.map(([date, revenue]) => {
          // Calculate percentage height with minimum of 8% for visibility
          const heightPercent = Math.max((revenue / maxValue) * 100, 8);
          return `
            <div class="bar-item">
              <div class="bar-value">${analytics.formatCurrency(revenue)}</div>
              <div class="bar" style="height: ${heightPercent}%; background: var(--success);"></div>
              <div class="bar-label">${date}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderQualityAnalysis() {
    this.renderQualityDistribution();
    this.renderSuspiciousSessions();
  }

  renderQualityDistribution() {
    const container = document.getElementById('quality-distribution-chart');
    const quality = analytics.metrics.qualityMetrics;
    
    if (!quality || quality.totalAnalyzed === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem;">No completed sessions to analyze</p>';
      return;
    }

    const dist = quality.distribution;
    const total = quality.totalAnalyzed;
    
    container.innerHTML = `
      <div class="quality-bars">
        <div class="quality-bar-item">
          <div class="quality-bar-header">
            <span class="quality-bar-label">🟢 Authentic (70-100)</span>
            <span class="quality-bar-count">${dist.authentic} sessions</span>
          </div>
          <div class="quality-bar-track">
            <div class="quality-bar-fill quality-bar-green" style="width: ${(dist.authentic / total) * 100}%"></div>
          </div>
          <div class="quality-bar-percent">${((dist.authentic / total) * 100).toFixed(0)}%</div>
        </div>
        
        <div class="quality-bar-item">
          <div class="quality-bar-header">
            <span class="quality-bar-label">🟡 Questionable (40-69)</span>
            <span class="quality-bar-count">${dist.questionable} sessions</span>
          </div>
          <div class="quality-bar-track">
            <div class="quality-bar-fill quality-bar-yellow" style="width: ${(dist.questionable / total) * 100}%"></div>
          </div>
          <div class="quality-bar-percent">${((dist.questionable / total) * 100).toFixed(0)}%</div>
        </div>
        
        <div class="quality-bar-item">
          <div class="quality-bar-header">
            <span class="quality-bar-label">🔴 Suspicious (0-39)</span>
            <span class="quality-bar-count">${dist.suspicious} sessions</span>
          </div>
          <div class="quality-bar-track">
            <div class="quality-bar-fill quality-bar-red" style="width: ${(dist.suspicious / total) * 100}%"></div>
          </div>
          <div class="quality-bar-percent">${((dist.suspicious / total) * 100).toFixed(0)}%</div>
        </div>
      </div>
    `;
  }

  renderSuspiciousSessions() {
    const container = document.getElementById('suspicious-sessions-list');
    
    // Get all completed sessions with quality scores from filtered data
    const filteredData = analytics.getFilteredData();
    const sessionsWithQuality = filteredData.sessions
      .filter(s => s.endTime)
      .map(s => ({
        session: s,
        quality: analytics.calculateSessionAuthenticity(s.sessionId)
      }))
      .filter(item => item.quality !== null && item.quality.flags.length > 0)
      .sort((a, b) => a.quality.score - b.quality.score)
      .slice(0, 5); // Top 5 most suspicious

    if (sessionsWithQuality.length === 0) {
      container.innerHTML = '<p style="color: var(--success); padding: 1rem; text-align: center;">✅ No flagged sessions detected!</p>';
      return;
    }

    container.innerHTML = `
      <div class="suspicious-items">
        ${sessionsWithQuality.map(({ session, quality }) => {
          const badge = analytics.getQualityBadge(quality.score);
          return `
            <div class="suspicious-item" onclick="app.viewSession('${session.sessionId}')">
              <div class="suspicious-header">
                <code class="suspicious-id">${session.sessionId.substring(0, 18)}...</code>
                <span class="quality-badge ${badge.class}">${badge.emoji} ${quality.score}</span>
              </div>
              <div class="suspicious-details">
                <small>📅 ${analytics.formatDate(session.startTime)}</small>
                <small>⏱️ ${quality.metrics.sessionDuration} min (${(quality.metrics.activityRatio * 100).toFixed(0)}% active)</small>
              </div>
              <div class="suspicious-flags">
                ${quality.flags.map(flag => 
                  `<span class="flag-tag-small">${analytics.getFlagDescription(flag)}</span>`
                ).join(' ')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${sessionsWithQuality.length >= 5 ? '<p style="color: var(--text-secondary); font-size: 0.75rem; text-align: center; margin-top: 0.5rem;">Showing top 5 most suspicious sessions</p>' : ''}
    `;
  }

  renderSessionsTable() {
    const tbody = document.getElementById('sessions-table-body');
    // Use filtered data from analytics
    const filteredData = analytics.getFilteredData();
    let sessions = filteredData.sessions.sort((a, b) => 
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
      const quality = analytics.calculateSessionAuthenticity(session.sessionId);
      
      let qualityBadge = '';
      let flagsText = '';
      
      if (quality) {
        const badge = analytics.getQualityBadge(quality.score);
        qualityBadge = `<span class="quality-badge ${badge.class}" title="Score: ${quality.score}/100">${badge.emoji} ${quality.score}</span>`;
        
        if (quality.flags.length > 0) {
          flagsText = quality.flags.map(flag => 
            `<span class="flag-tag">${analytics.getFlagDescription(flag)}</span>`
          ).join(' ');
        } else {
          flagsText = '<span style="color: var(--text-secondary);">-</span>';
        }
      } else {
        qualityBadge = '<span class="quality-badge badge-unknown">⚪ N/A</span>';
        flagsText = '<span style="color: var(--text-secondary);">In Progress</span>';
      }
      
      return `
        <tr>
          <td><code>${session.sessionId.substring(0, 20)}...</code></td>
          <td>${analytics.formatDate(session.startTime)}</td>
          <td>${analytics.formatDuration(session.startTime, session.endTime)}</td>
          <td>${qualityBadge}</td>
          <td class="flags-cell">${flagsText}</td>
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
    const quality = analytics.calculateSessionAuthenticity(sessionId);
    
    let message = `Session Details:\n\nID: ${sessionId}\nTabs: ${details.tabs.length}\nRevenue: ${analytics.formatCurrency(details.totalRevenue)}\nEvents: ${details.events.length}`;
    
    if (quality) {
      const badge = analytics.getQualityBadge(quality.score);
      message += `\n\n--- Session Quality ---\nAuthenticity Score: ${quality.score}/100 ${badge.emoji}\n`;
      message += `Duration: ${quality.metrics.sessionDuration} min\n`;
      message += `Activity: ${quality.metrics.activityDuration} min (${(quality.metrics.activityRatio * 100).toFixed(1)}%)\n`;
      message += `Audio Chunks: ${quality.metrics.audioChunkCount}\n`;
      
      if (quality.flags.length > 0) {
        message += `\n⚠️ Flags: ${quality.flags.map(f => analytics.getFlagDescription(f)).join(', ')}`;
      }
    }
    
    alert(message);
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

    // Date Range Filter
    const dateRangeFilter = document.getElementById('date-range-filter');
    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', (e) => {
        this.handleDateRangeChange(e.target.value);
      });
    }
  }

  handleDateRangeChange(filterType) {
    // Update analytics filter
    analytics.setDateFilter(filterType);
    
    // Update filter info badge
    const filterInfo = document.getElementById('filter-info');
    const filterLabels = {
      'all': 'All Time',
      '3': 'Last 3 Days',
      '5': 'Last 5 Days',
      '7': 'Last 7 Days',
      '30': 'Last 30 Days',
      '90': 'Last 3 Months',
      'custom': 'Custom Range'
    };
    
    if (filterInfo) {
      filterInfo.innerHTML = `<span class="filter-badge">Showing: ${filterLabels[filterType]}</span>`;
    }
    
    // Re-render entire dashboard with new filtered data
    this.renderDashboard();
  }
}

// Create global instance
const app = new AnalyticsApp();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
