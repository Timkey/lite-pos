# Analytics Enhancement Proposal: Usage Behavior & Session Authenticity Detection

## Problem Statement
Current analytics show WHAT happened but not WHEN it truly happened. Users may be logging activity retroactively (after the fact) instead of in real-time during actual service. This misrepresents session timing and makes audit trails unreliable.

## Available Data Points

### Session Level
- `sessionId`, `startTime`, `endTime`, `status`
- Duration can be calculated

### Tab Level  
- `tabId`, `sessionId`, `startTime`, `endTime`, `customerId`
- Individual customer interaction timeline

### Events (with precise timing)
- `eventId`, `timestamp` (ISO string), `timestampMs` (milliseconds)
- `eventType`: 'counter_available', 'counter_unavailable', 'item_added', 'checkout'
- `sessionId`, `tabId`
- Additional context data

### Line Items
- `itemId`, `tabId`, `timestamp`
- Individual product entries

### Audio Chunks
- `chunkId`, `sessionId`, `timestamp`
- Proof of real-time activity

## Proposed Analytical Metrics

### 1. **Session Authenticity Score** (0-100)
Indicators of real-time vs retroactive logging:

**High authenticity (90-100):**
- Events distributed throughout session duration
- Audio chunks present
- Natural time gaps between events (30s - 5min)
- Session duration matches event spread

**Medium authenticity (50-89):**
- Some event clustering
- Sparse audio or none
- Irregular gaps

**Low authenticity (0-49):**
- All events clustered within seconds/minutes
- No audio chunks
- Session duration >> event activity duration
- Bulk entry pattern (rapid sequential timestamps)

**Formula:**
```javascript
authenticity = (
  eventDistributionScore * 0.3 +
  audioPresenceScore * 0.3 +
  timeGapNaturalnessScore * 0.2 +
  durationMatchScore * 0.2
) * 100
```

### 2. **Event Velocity Analysis**
Time between consecutive events per session:

- **Normal velocity**: 30 seconds - 5 minutes between events
- **Suspicious rapid**: < 10 seconds consistently
- **Suspicious slow**: > 30 minutes gaps (abandoned session?)
- **Bulk entry pattern**: 0-3 seconds per event for 5+ events

**Visualization:**
- Timeline chart showing event spacing
- Histogram of time gaps
- Highlight suspicious patterns in red

### 3. **Session Duration vs Activity Duration**
```
Activity Duration = (last_event_timestamp - first_event_timestamp)
Session Duration = (session.endTime - session.startTime)
Activity Ratio = Activity Duration / Session Duration

Healthy ratio: 0.6 - 1.0 (most of session is active)
Suspicious: < 0.3 (session open for hours, all events in 10 minutes)
```

### 4. **Audio Coverage Metric**
```
Audio Coverage = (total_audio_duration / session_duration) * 100

Expected: 60-100% (recording most of session)
Suspicious: 0% (no audio recorded)
Questionable: 1-30% (minimal audio)
```

### 5. **Retroactive Entry Detection**
Flag sessions where:
- Session duration > 2 hours BUT all events within 15 minutes
- No audio chunks BUT many events logged
- Events have identical timestamps (bulk insert)
- Event timestamps don't align with audio chunk timestamps

### 6. **Behavioral Consistency Score**
Compare sessions from same user:
- Average session duration variance
- Typical event velocity patterns
- Audio recording habits
- Flag outliers

## Proposed Visualizations

### 1. **Session Timeline View** (per session)
```
|----Session Start----------------------Session End----|
     ▲    ▲  ▲▲▲           ▲        ▲
     Event density visualization
     
Audio: [====]  [=========]     [======]
       Audio chunk presence bars
```

### 2. **Authenticity Heatmap** (all sessions)
Grid showing:
- Rows: Sessions (sorted by date)
- Columns: Time of day (hourly)
- Color: Authenticity score (green=high, yellow=medium, red=low)

### 3. **Event Velocity Distribution**
Box plot showing:
- Min/Max/Median time between events
- Per session comparison
- Highlight outliers

### 4. **Usage Pattern Timeline**
Scatter plot:
- X-axis: Session start time (chronological)
- Y-axis: Session duration
- Size: Event count
- Color: Authenticity score
- Shows usage trends over time

### 5. **Red Flag Dashboard**
Quick view cards:
- Sessions with 0% audio
- Sessions with <30% activity ratio
- Bulk entry patterns detected
- Total suspicious sessions

## Implementation Approach

### Phase 1: Data Analysis Functions
Add to `analytics.js`:

```javascript
calculateSessionAuthenticity(sessionId)
analyzeEventVelocity(sessionId)
detectRetroactiveEntry(sessionId)
calculateActivityRatio(sessionId)
getAudioCoverage(sessionId)
```

### Phase 2: New Metrics in Dashboard
Add section to `analytics/index.html`:
- "Session Quality Analysis" tab
- Authenticity score distribution
- Flagged sessions table

### Phase 3: Detailed Session Inspector
Modal/new page showing:
- Full timeline visualization
- All events with precise timing
- Audio chunks timeline
- Authenticity breakdown
- Export detailed report

### Phase 4: Alert System
- Red/Yellow/Green flags on session list
- Filter by authenticity score
- Export suspicious sessions for review

## Data Privacy Considerations
- No customer-identifiable data in suspicious session reports
- Focus on timing patterns, not content
- Audio analyzed for presence/duration, not content

## Success Metrics
- Can identify retroactive logging with 90%+ accuracy
- Reduce false positives to <10%
- Clear visual indicators for auditors
- Exportable compliance reports

## Next Steps
1. Review and refine this proposal
2. Implement Phase 1 (calculation functions)
3. Add one visualization at a time
4. Test with real data
5. Iterate based on findings

## Questions for Discussion
1. What authenticity score threshold should trigger alerts?
2. Should we add user training mode detection (learning phase)?
3. How to handle legitimate edge cases (e.g., very quick service)?
4. Should we add session notes field for user to explain anomalies?
5. Export format for compliance reports?
