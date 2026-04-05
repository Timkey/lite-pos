# Changelog

## [Unreleased] - 2026-04-05

### Changed
- **Currency**: Replaced all dollar signs ($) with KES (Kenya Shillings) throughout the application
  - Cart item totals now display as "KES XX.XX"
  - Review session totals show "KES XX.XX"
  - Discount amounts show "KES XX.XX"

### Added
- **Event Logging System**: New events database table to track user actions with timestamps
  - Counter button clicks (Available/Unavailable) are logged with timestamps
  - Item additions to cart are logged with item details
  - Checkout events are logged with payment method and total
  - All events include millisecond timestamps for audio synchronization

- **Event Timeline in Review**: New timeline view in session review interface
  - Shows chronological list of all events during a session
  - Displays time markers relative to session start (MM:SS format)
  - Visual indicators for different event types (✓ Available, ✕ Unavailable, 🛒 Item Added, 💳 Checkout)
  - Helps correlate audio recording with specific actions

### Fixed
- **Review Item Selection**: Made review items selectable and copyable
  - Changed `user-select: none` to `user-select: text`
  - Added text cursor on hover
  - Added subtle hover effect for better UX
  - Users can now select and copy item details, formulas, and prices

### Technical
- Database version upgraded from 1 to 2 (new events table)
- Added `logEvent()` method to ShopDB for consistent event logging
- Events include: sessionId, tabId, eventType, timestamp, timestampMs, and custom event data
- Event timeline CSS with vertical line connector between events

## [1.0.0] - Phase 1 Complete

### Features
- Offline-first PWA architecture
- Multi-tab customer management
- Audio recording with automatic chunking
- Smart calculator with discount detection
- Session management and recovery
- Session history with detailed review
- Audio playback interface
- Data export (JSON/CSV/Audio)
- Comprehensive documentation
