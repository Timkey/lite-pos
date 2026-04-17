#!/usr/bin/env python3
"""
Analyze ShopTracker backup data to detect usage patterns and session authenticity
"""
import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict

def parse_timestamp(ts_str):
    """Parse ISO timestamp to datetime"""
    return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))

def analyze_session(session, events, audio_chunks):
    """Analyze a single session for authenticity indicators"""
    session_id = session['sessionId']
    start = parse_timestamp(session['startTime'])
    
    # Skip sessions without end time (still in progress)
    if not session.get('endTime'):
        return None
    
    end = parse_timestamp(session['endTime'])
    session_duration = (end - start).total_seconds()
    
    # Get events for this session
    session_events = [e for e in events if e['sessionId'] == session_id]
    session_audio = [a for a in audio_chunks if a['sessionId'] == session_id]
    
    if not session_events:
        return None
    
    # Sort events by timestamp
    session_events.sort(key=lambda x: x['timestampMs'])
    
    # Calculate event timeline
    event_timestamps = [e['timestampMs'] for e in session_events]
    first_event = min(event_timestamps)
    last_event = max(event_timestamps)
    activity_duration = (last_event - first_event) / 1000  # seconds
    
    # Calculate time gaps between events
    gaps = []
    for i in range(1, len(event_timestamps)):
        gap = (event_timestamps[i] - event_timestamps[i-1]) / 1000  # seconds
        gaps.append(gap)
    
    # Audio coverage
    audio_count = len(session_audio)
    has_audio = audio_count > 0
    
    # Calculate metrics
    activity_ratio = activity_duration / session_duration if session_duration > 0 else 0
    avg_gap = sum(gaps) / len(gaps) if gaps else 0
    min_gap = min(gaps) if gaps else 0
    max_gap = max(gaps) if gaps else 0
    
    # Detect patterns
    rapid_entries = sum(1 for g in gaps if g < 10)  # < 10 seconds
    rapid_ratio = rapid_entries / len(gaps) if gaps else 0
    
    # Bulk entry detection (5+ events within 30 seconds)
    bulk_pattern = False
    if len(session_events) >= 5:
        first_five_duration = (event_timestamps[4] - event_timestamps[0]) / 1000
        if first_five_duration < 30:
            bulk_pattern = True
    
    # Authenticity scoring
    scores = {
        'event_distribution': 0,
        'audio_presence': 0,
        'time_gap_naturalness': 0,
        'duration_match': 0
    }
    
    # Event distribution (0-100)
    if activity_ratio > 0.6:
        scores['event_distribution'] = 100
    elif activity_ratio > 0.3:
        scores['event_distribution'] = 50
    else:
        scores['event_distribution'] = 10
    
    # Audio presence
    if has_audio and audio_count >= len(session_events) * 0.5:
        scores['audio_presence'] = 100
    elif has_audio:
        scores['audio_presence'] = 50
    else:
        scores['audio_presence'] = 0
    
    # Time gap naturalness (30s - 5min is natural)
    natural_gaps = sum(1 for g in gaps if 30 <= g <= 300)
    natural_ratio = natural_gaps / len(gaps) if gaps else 0
    scores['time_gap_naturalness'] = int(natural_ratio * 100)
    
    # Duration match
    scores['duration_match'] = min(100, int(activity_ratio * 100))
    
    # Overall authenticity score
    authenticity = (
        scores['event_distribution'] * 0.3 +
        scores['audio_presence'] * 0.3 +
        scores['time_gap_naturalness'] * 0.2 +
        scores['duration_match'] * 0.2
    )
    
    return {
        'sessionId': session_id,
        'start': session['startTime'],
        'end': session['endTime'],
        'sessionDurationMin': round(session_duration / 60, 1),
        'eventCount': len(session_events),
        'audioCount': audio_count,
        'activityDurationMin': round(activity_duration / 60, 1),
        'activityRatio': round(activity_ratio, 2),
        'avgGapSec': round(avg_gap, 1),
        'minGapSec': round(min_gap, 1),
        'maxGapSec': round(max_gap, 1),
        'rapidEntries': rapid_entries,
        'rapidRatio': round(rapid_ratio, 2),
        'bulkPattern': bulk_pattern,
        'authenticityScore': round(authenticity, 1),
        'scores': scores,
        'flags': {
            'no_audio': not has_audio,
            'low_activity_ratio': activity_ratio < 0.3,
            'bulk_entry': bulk_pattern,
            'rapid_entries_high': rapid_ratio > 0.5,
            'suspicious_duration': session_duration > 7200 and activity_duration < 900  # 2hr session, <15min activity
        }
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_backup.py <backup.json>")
        sys.exit(1)
    
    backup_file = sys.argv[1]
    
    with open(backup_file, 'r') as f:
        data = json.load(f)
    
    sessions = data['data']['sessions']
    events = data['data']['events']
    audio_chunks = data['data']['audioChunks']
    
    print(f"\n{'='*80}")
    print(f"ShopTracker Backup Analysis")
    print(f"{'='*80}\n")
    print(f"Total Sessions: {len(sessions)}")
    print(f"Total Events: {len(events)}")
    print(f"Total Audio Chunks: {len(audio_chunks)}\n")
    
    # Analyze all sessions
    results = []
    for session in sessions:
        result = analyze_session(session, events, audio_chunks)
        if result:
            results.append(result)
    
    # Sort by authenticity score
    results.sort(key=lambda x: x['authenticityScore'])
    
    # Summary statistics
    print(f"{'='*80}")
    print("SUMMARY STATISTICS")
    print(f"{'='*80}\n")
    
    authenticity_scores = [r['authenticityScore'] for r in results]
    avg_authenticity = sum(authenticity_scores) / len(authenticity_scores)
    
    flagged_sessions = [r for r in results if any(r['flags'].values())]
    no_audio_sessions = [r for r in results if r['flags']['no_audio']]
    bulk_sessions = [r for r in results if r['flags']['bulk_entry']]
    suspicious_duration = [r for r in results if r['flags']['suspicious_duration']]
    
    print(f"Average Authenticity Score: {avg_authenticity:.1f}")
    print(f"Sessions with No Audio: {len(no_audio_sessions)} ({len(no_audio_sessions)/len(results)*100:.1f}%)")
    print(f"Sessions with Bulk Entry Pattern: {len(bulk_sessions)} ({len(bulk_sessions)/len(results)*100:.1f}%)")
    print(f"Sessions with Suspicious Duration: {len(suspicious_duration)} ({len(suspicious_duration)/len(results)*100:.1f}%)")
    print(f"Total Flagged Sessions: {len(flagged_sessions)} ({len(flagged_sessions)/len(results)*100:.1f}%)\n")
    
    # Most suspicious sessions
    print(f"{'='*80}")
    print("MOST SUSPICIOUS SESSIONS (Lowest Authenticity)")
    print(f"{'='*80}\n")
    
    for i, r in enumerate(results[:10], 1):
        print(f"{i}. Session: {r['sessionId']}")
        print(f"   Authenticity: {r['authenticityScore']:.1f}/100")
        print(f"   Duration: {r['sessionDurationMin']:.1f} min | Activity: {r['activityDurationMin']:.1f} min ({r['activityRatio']:.0%})")
        print(f"   Events: {r['eventCount']} | Audio: {r['audioCount']}")
        print(f"   Avg Gap: {r['avgGapSec']:.1f}s | Rapid Entries: {r['rapidEntries']} ({r['rapidRatio']:.0%})")
        flags = [k for k, v in r['flags'].items() if v]
        print(f"   Flags: {', '.join(flags) if flags else 'None'}")
        print()
    
    # Best sessions
    print(f"{'='*80}")
    print("HIGHEST AUTHENTICITY SESSIONS")
    print(f"{'='*80}\n")
    
    for i, r in enumerate(reversed(results[-5:]), 1):
        print(f"{i}. Session: {r['sessionId']}")
        print(f"   Authenticity: {r['authenticityScore']:.1f}/100")
        print(f"   Duration: {r['sessionDurationMin']:.1f} min | Activity: {r['activityDurationMin']:.1f} min ({r['activityRatio']:.0%})")
        print(f"   Events: {r['eventCount']} | Audio: {r['audioCount']}")
        print(f"   Avg Gap: {r['avgGapSec']:.1f}s")
        print()
    
    # Export detailed report
    report_file = backup_file.replace('.json', '_analysis.json')
    with open(report_file, 'w') as f:
        json.dump({
            'summary': {
                'totalSessions': len(results),
                'averageAuthenticity': avg_authenticity,
                'flaggedSessions': len(flagged_sessions),
                'noAudioSessions': len(no_audio_sessions),
                'bulkEntrySessions': len(bulk_sessions),
                'suspiciousDurationSessions': len(suspicious_duration)
            },
            'sessions': results
        }, f, indent=2)
    
    print(f"\nDetailed analysis saved to: {report_file}")

if __name__ == '__main__':
    main()
