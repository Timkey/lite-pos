// Session Review Manager
class ReviewManager {
  constructor() {
    this.currentSessionId = null;
    this.audioPlayers = new Map(); // Track active audio elements
  }

  async showSessionDetail(sessionId) {
    this.currentSessionId = sessionId;
    
    // Get session data
    const session = await shopDB.get('sessions', sessionId);
    const tabs = await shopDB.getTabsBySession(sessionId);
    const audioChunks = await shopDB.getAllByIndex('audioChunks', 'sessionId', sessionId);
    
    // Build detail view
    const detailHTML = await this.buildDetailView(session, tabs, audioChunks);
    
    // Update history modal content
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = detailHTML;
    
    // Attach event listeners
    this.attachDetailEventListeners();
  }

  async buildDetailView(session, tabs, audioChunks) {
    // Calculate summary
    const summary = await sessionManager.getSessionSummary(session.sessionId);
    
    const startDate = new Date(session.startTime);
    const endDate = session.endTime ? new Date(session.endTime) : null;
    const duration = endDate ? this.formatDuration(endDate - startDate) : 'In progress';
    
    let html = `
      <div class="session-detail">
        <button class="back-button" onclick="reviewManager.backToList()">
          ← Back to History
        </button>
        
        <div class="detail-header">
          <div class="detail-info">
            <h2>Session Details</h2>
            <div class="detail-meta">
              <div>Started: ${startDate.toLocaleString()}</div>
              ${endDate ? `<div>Ended: ${endDate.toLocaleString()}</div>` : ''}
              <div>Duration: ${duration}</div>
              <div>Status: <strong>${session.status}</strong></div>
            </div>
          </div>
          <div class="detail-stats">
            <div class="stat-value">KES ${summary.totalSales.toFixed(2)}</div>
            <div class="stat-label">Total Sales</div>
          </div>
        </div>
    `;
    
    // Audio player section
    if (audioChunks.length > 0) {
      html += this.buildAudioPlayer(audioChunks);
    }
    
    // Event timeline section
    const events = await shopDB.getEventsBySession(session.sessionId);
    if (events.length > 0) {
      html += this.buildEventTimeline(events, session);
    }
    
    // Tabs and items
    html += '<div class="tabs-review">';
    
    for (const tab of tabs) {
      html += await this.buildTabReview(tab);
    }
    
    html += '</div>'; // Close tabs-review
    
    // Export section
    html += this.buildExportSection(session.sessionId);
    
    html += '</div>'; // Close session-detail
    
    return html;
  }

  buildAudioPlayer(chunks) {
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    let html = `
      <div class="audio-player">
        <h3>📻 Audio Recording (${chunks.length} chunk${chunks.length !== 1 ? 's' : ''})</h3>
        <div class="audio-chunks-list">
    `;
    
    chunks.forEach(chunk => {
      const chunkDate = new Date(chunk.timestamp);
      const sizeKB = (chunk.size / 1024).toFixed(2);
      
      html += `
        <div class="audio-chunk">
          <div class="chunk-info">
            <div class="chunk-label">Chunk ${chunk.chunkIndex + 1}</div>
            <div class="chunk-meta">
              ${chunkDate.toLocaleTimeString()} • ${sizeKB} KB
            </div>
          </div>
          <div class="audio-controls">
            <button class="audio-btn" data-chunk-id="${chunk.chunkId}" onclick="reviewManager.playAudioChunk('${chunk.chunkId}')">
              ▶
            </button>
          </div>
          <div class="playback-progress" id="progress-${chunk.chunkId}" style="display: none;">
            <div class="progress-bar" id="bar-${chunk.chunkId}"></div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }

  buildValidationIssues(tab) {
    const flags = tab.validationFlags;
    if (!flags || !flags.hasDiscrepancy) return '';
    
    let html = `<div class="validation-issues">`;
    
    if (flags.incompleteLogging) {
      html += `
        <div class="validation-issue critical">
          <strong>⚠️ CRITICAL:</strong> ${flags.expectedCount} items in counter but ZERO items logged!
        </div>
      `;
    }
    
    if (flags.counterMismatch && !flags.incompleteLogging) {
      if (flags.missingItemCount > 0) {
        html += `
          <div class="validation-issue ${flags.missingItemCount > 3 ? 'critical' : 'moderate'}">
            <strong>⚠️ Counter Mismatch:</strong> ${flags.expectedCount} available but only ${flags.actualCount} logged (${flags.missingItemCount} missing details)
          </div>
        `;
      } else {
        html += `
          <div class="validation-issue moderate">
            <strong>⚠️ Counter Mismatch:</strong> ${flags.actualCount} items logged but counter shows ${flags.expectedCount}
          </div>
        `;
      }
    }
    
    if (flags.amountMismatch) {
      html += `
        <div class="validation-issue moderate">
          <strong>💰 Amount Difference:</strong> Calculated KES ${flags.calculatedTotal.toFixed(2)}, Agreed KES ${flags.agreedTotal.toFixed(2)} 
          (${flags.amountDifference > 0 ? '+' : ''}${flags.amountDifference.toFixed(2)})
        </div>
      `;
    }
    
    html += `</div>`;
    return html;
  }

  async buildTabReview(tab) {
    const items = await shopDB.getLineItemsByTab(tab.tabId);
    
    const startTime = new Date(tab.startTime);
    const endTime = tab.endTime ? new Date(tab.endTime) : null;
    
    let subtotal = 0;
    let totalDiscount = 0;
    
    items.forEach(item => {
      subtotal += item.calculatedTotal;
      totalDiscount += item.discountAmount || 0;
    });
    
    const total = subtotal - totalDiscount;
    
    let html = `
      <div class="tab-review-card ${tab.validationFlags?.hasDiscrepancy ? 'has-validation-issues' : ''}">
        <div class="tab-review-header">
          <div class="tab-title">
            <div class="tab-color-indicator color-${tab.colorIndex}"></div>
            <h4>${tab.customerId}</h4>
            ${tab.validationFlags?.hasDiscrepancy ? '<span class="validation-badge">⚠️ Issues</span>' : ''}
          </div>
          <div class="tab-status ${tab.status}">
            ${tab.status === 'completed' ? '✓ ' : '✕ '}${tab.status}
          </div>
        </div>
        
        ${tab.validationFlags?.hasDiscrepancy ? this.buildValidationIssues(tab) : ''}
        
        <div class="tab-review-meta">
          <div class="meta-item">
            <div class="meta-label">Start Time</div>
            <div class="meta-value">${startTime.toLocaleTimeString()}</div>
          </div>
          ${endTime ? `
            <div class="meta-item">
              <div class="meta-label">End Time</div>
              <div class="meta-value">${endTime.toLocaleTimeString()}</div>
            </div>
          ` : ''}
          <div class="meta-item">
            <div class="meta-label">Items</div>
            <div class="meta-value">${items.length}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Available Count</div>
            <div class="meta-value">${tab.availableCount || 0}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Unavailable Count</div>
            <div class="meta-value">${tab.unavailableCount || 0}</div>
          </div>
          ${tab.paymentMethod ? `
            <div class="meta-item">
              <div class="meta-label">Payment</div>
              <div class="meta-value">${tab.paymentMethod}</div>
            </div>
          ` : ''}
        </div>
    `;
    
    if (items.length > 0) {
      html += '<div class="review-items-list">';
      
      items.forEach(item => {
        let formula = '';
        if (item.quantity && item.quantity !== 1) {
          formula = `${item.unitPrice.toFixed(2)} × ${item.quantity} = ${item.calculatedTotal.toFixed(2)}`;
        } else {
          formula = item.unitPrice.toFixed(2);
        }
        
        html += `
          <div class="review-item">
            <div>
              <div class="review-item-formula">${formula}</div>
              <div class="review-item-product">${item.productName || 'Unnamed item'}</div>
              ${item.discountAmount && item.discountAmount > 0 ? `
                <div class="review-item-discount">
                  Discount: -KES ${item.discountAmount.toFixed(2)} (${item.discountPercent.toFixed(1)}%)
                </div>
              ` : ''}
            </div>
            <div class="review-item-total">KES ${item.actualCharged.toFixed(2)}</div>
          </div>
        `;
      });
      
      html += '</div>'; // Close review-items-list
      
      html += `
        <div class="tab-review-summary">
          <div>
            <div class="summary-label">Calculated Total</div>
            ${totalDiscount > 0 ? `<div style="font-size: 0.875rem; color: var(--success);">Discounts: -KES ${totalDiscount.toFixed(2)}</div>` : ''}
            ${tab.agreedTotal !== null && Math.abs(tab.agreedTotal - total) > 0.01 ? `
              <div style="font-size: 0.875rem; color: var(--warning); font-weight: 600; margin-top: var(--spacing-xs);">
                Agreed Amount: KES ${tab.agreedTotal.toFixed(2)}
              </div>
            ` : ''}
          </div>
          <div class="summary-value">KES ${(tab.agreedTotal !== null ? tab.agreedTotal : total).toFixed(2)}</div>
        </div>
        ${tab.reconciliationNotes ? `
          <div class="reconciliation-notes-display">
            <strong>📝 Notes:</strong> ${tab.reconciliationNotes}
          </div>
        ` : ''}
      `;
    } else {
      html += '<div class="empty-state" style="padding: var(--spacing-lg); text-align: center; color: var(--text-secondary);">No items in this tab</div>';
    }
    
    html += '</div>'; // Close tab-review-card
    
    return html;
  }

  buildExportSection(sessionId) {
    return `
      <div class="export-section">
        <h3>Export Session Data</h3>
        <div class="export-options">
          <button class="export-btn" onclick="reviewManager.exportSessionJSON('${sessionId}')">
            Export as JSON
          </button>
          <button class="export-btn secondary" onclick="reviewManager.exportSessionCSV('${sessionId}')">
            Export as CSV
          </button>
          <button class="export-btn secondary" onclick="reviewManager.downloadAudio('${sessionId}')">
            Download Audio
          </button>
        </div>
      </div>
    `;
  }

  buildEventTimeline(events, session) {
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const sessionStart = new Date(session.startTime).getTime();
    
    const eventIcons = {
      'counter_available': '✓',
      'counter_unavailable': '✕',
      'item_added': '🛒',
      'checkout': '💳'
    };
    
    const eventLabels = {
      'counter_available': 'Available',
      'counter_unavailable': 'Unavailable', 
      'item_added': 'Item Added',
      'checkout': 'Checkout'
    };
    
    let html = `
      <div class="event-timeline">
        <h3>📍 Event Timeline (${events.length} events)</h3>
        <div class="timeline-list">
    `;
    
    events.forEach(event => {
      const eventTime = new Date(event.timestamp);
      const timeSinceStart = Math.floor((event.timestampMs - sessionStart) / 1000); // seconds
      const minutes = Math.floor(timeSinceStart / 60);
      const seconds = timeSinceStart % 60;
      const timeMarker = `${minutes}:${String(seconds).padStart(2, '0')}`;
      
      const icon = eventIcons[event.eventType] || '•';
      const label = eventLabels[event.eventType] || event.eventType;
      
      html += `
        <div class="timeline-event">
          <div class="event-marker">${icon}</div>
          <div class="event-details">
            <div class="event-label">${label}</div>
            <div class="event-time">${eventTime.toLocaleTimeString()} (${timeMarker} into session)</div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }

  attachDetailEventListeners() {
    // Event listeners are handled via onclick in HTML for simplicity
    // Could be refactored to use addEventListener for better practice
  }

  async playAudioChunk(chunkId) {
    // Stop any currently playing audio
    this.audioPlayers.forEach(player => {
      if (!player.paused) {
        player.pause();
        player.currentTime = 0;
      }
    });
    
    const btn = document.querySelector(`[data-chunk-id="${chunkId}"]`);
    const progressContainer = document.getElementById(`progress-${chunkId}`);
    const progressBar = document.getElementById(`bar-${chunkId}`);
    
    // Check if already playing this chunk
    if (this.audioPlayers.has(chunkId)) {
      const player = this.audioPlayers.get(chunkId);
      
      if (player.paused) {
        // Resume
        player.play();
        btn.textContent = '⏸';
        btn.classList.add('playing');
        progressContainer.style.display = 'block';
      } else {
        // Pause
        player.pause();
        btn.textContent = '▶';
        btn.classList.remove('playing');
      }
      return;
    }
    
    // Load and play new chunk
    try {
      const chunk = await shopDB.get('audioChunks', chunkId);
      if (!chunk || !chunk.blob) {
        alert('Audio chunk not found');
        return;
      }
      
      const url = URL.createObjectURL(chunk.blob);
      const audio = new Audio(url);
      
      // Update UI during playback
      audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${percent}%`;
      });
      
      audio.addEventListener('ended', () => {
        btn.textContent = '▶';
        btn.classList.remove('playing');
        progressBar.style.width = '0%';
        URL.revokeObjectURL(url);
        this.audioPlayers.delete(chunkId);
      });
      
      audio.addEventListener('pause', () => {
        btn.textContent = '▶';
        btn.classList.remove('playing');
      });
      
      audio.addEventListener('play', () => {
        btn.textContent = '⏸';
        btn.classList.add('playing');
        progressContainer.style.display = 'block';
      });
      
      this.audioPlayers.set(chunkId, audio);
      audio.play();
      
    } catch (error) {
      console.error('[Review] Failed to play audio:', error);
      alert('Failed to play audio chunk');
    }
  }

  async exportSessionJSON(sessionId) {
    try {
      const session = await shopDB.get('sessions', sessionId);
      const tabs = await shopDB.getTabsBySession(sessionId);
      const allItems = [];
      
      for (const tab of tabs) {
        const items = await shopDB.getLineItemsByTab(tab.tabId);
        allItems.push(...items);
      }
      
      const data = {
        session,
        tabs,
        lineItems: allItems,
        exportDate: new Date().toISOString()
      };
      
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      console.log('[Review] Session exported as JSON');
    } catch (error) {
      console.error('[Review] Export failed:', error);
      alert('Export failed');
    }
  }

  async exportSessionCSV(sessionId) {
    try {
      const tabs = await shopDB.getTabsBySession(sessionId);
      
      // CSV Headers
      let csv = 'Tab,Customer,Item,Unit Price,Quantity,Calculated Total,Actual Charged,Discount,Product,Timestamp\n';
      
      for (const tab of tabs) {
        const items = await shopDB.getLineItemsByTab(tab.tabId);
        
        items.forEach(item => {
          csv += [
            tab.tabId,
            tab.customerId,
            item.itemId,
            item.unitPrice,
            item.quantity,
            item.calculatedTotal,
            item.actualCharged,
            item.discountAmount || 0,
            item.productName || '',
            item.timestamp
          ].join(',') + '\n';
        });
      }
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-${Date.now()}.csv`;
      a.click();
      
      URL.revokeObjectURL(url);
      console.log('[Review] Session exported as CSV');
    } catch (error) {
      console.error('[Review] CSV export failed:', error);
      alert('CSV export failed');
    }
  }

  async downloadAudio(sessionId) {
    try {
      const chunks = await shopDB.getAllByIndex('audioChunks', 'sessionId', sessionId);
      
      if (chunks.length === 0) {
        alert('No audio recordings found for this session');
        return;
      }
      
      // Sort by chunk index
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      // Download each chunk separately (combining would require additional processing)
      for (const chunk of chunks) {
        const url = URL.createObjectURL(chunk.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio-${sessionId}-chunk${chunk.chunkIndex}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('[Review] Audio chunks downloaded');
    } catch (error) {
      console.error('[Review] Audio download failed:', error);
      alert('Audio download failed');
    }
  }

  async backToList() {
    // Stop any playing audio
    this.audioPlayers.forEach(player => {
      player.pause();
      player.currentTime = 0;
    });
    this.audioPlayers.clear();
    
    // Reload history list
    await uiManager.showHistory();
  }

  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  cleanup() {
    // Stop and cleanup all audio players
    this.audioPlayers.forEach(player => {
      player.pause();
      player.currentTime = 0;
    });
    this.audioPlayers.clear();
    this.currentSessionId = null;
  }
}

// Create global review manager instance
const reviewManager = new ReviewManager();
