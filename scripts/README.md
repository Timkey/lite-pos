# Analysis Scripts

Python scripts for analyzing ShopTracker data and generating insights.

## Available Scripts

### `analyze_backup.py`

Analyzes ShopTracker backup JSON files to calculate session quality metrics and detect usage patterns.

**Purpose:**
- Calculate session authenticity scores (0-100)
- Detect retroactive data entry patterns
- Identify suspicious sessions
- Generate comprehensive analysis reports

**Usage:**
```bash
python3 analyze_backup.py <path-to-backup.json>
```

**Example:**
```bash
python3 analyze_backup.py "../Gataka Backups/shoptracker-backup-1775887634169.json"
```

**Output:**
1. Console summary with key statistics
2. JSON report: `<backup-filename>_analysis.json`

**Output Format:**
```json
{
  "summary": {
    "total_sessions": 38,
    "total_events": 190,
    "total_audio": 36,
    "average_authenticity": 52.5,
    "flagged_count": 14,
    "flagged_percentage": 37.8
  },
  "sessions": [
    {
      "sessionId": "session_...",
      "score": 79.2,
      "flags": [],
      "metrics": { ... }
    }
  ],
  "most_suspicious": [ ... ],
  "highest_authenticity": [ ... ]
}
```

**Authenticity Scoring:**

The script uses a 4-component weighted algorithm:
- **Event Distribution (30%):** How spread out events are
- **Audio Presence (30%):** Audio recording coverage
- **Time Gap Naturalness (20%):** Natural event spacing
- **Duration Match (20%):** Activity vs session duration

**Flags Detected:**
- `no_audio` - Session has no audio recording
- `low_activity_ratio` - Activity < 30% of session duration
- `suspicious_duration` - Session > 2 hours with < 20% activity
- `rapid_entries_high` - > 50% of events logged < 10 seconds apart
- `bulk_entry` - 5+ events within 30 seconds

**Requirements:**
- Python 3.x
- Standard library only (json, datetime, defaultdict)

**Related Documentation:**
- [Algorithm Proposal](../docs/analytics/ANALYTICS_ENHANCEMENT_PROPOSAL.md)
- [Real Data Analysis](../docs/analytics/REAL_DATA_ANALYSIS.md)
- [Quality Metrics Guide](../docs/analytics/QUALITY_METRICS_GUIDE.md)

## Future Scripts

Planned additions:
- `export_report.py` - Generate PDF/Excel reports
- `compare_backups.py` - Compare quality metrics across time periods
- `detect_anomalies.py` - Advanced pattern detection

## Contributing

When adding new scripts:
1. Include usage documentation in this README
2. Follow the established output format
3. Use standard library when possible
4. Add error handling for common issues
