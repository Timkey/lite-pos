# Analytics Quality Metrics - Quick Reference Guide

## Understanding Session Authenticity Scores

### Score Ranges

| Score | Badge | Meaning | Action Required |
|-------|-------|---------|----------------|
| **70-100** | 🟢 Authentic | Real-time usage with natural patterns | None - Keep it up! |
| **40-69** | 🟡 Questionable | Some suspicious patterns detected | Monitor for trends |
| **0-39** | 🔴 Suspicious | Clear retroactive entry or major issues | **Review immediately** |
| **N/A** | ⚪ Unknown | Session still in progress | Wait for completion |

---

## Flag Types Explained

### 🔴 No Audio
**What it means:** Session has NO audio recording  
**Why it matters:** Audio is key evidence of real-time service  
**Typical cause:** Staff forgot to enable audio or entered data later  
**Action:** Verify why audio wasn't recorded for this session

**Example:**
- Session: 15 minutes, 6 events
- Audio chunks: 0
- **Red flag!** - Should have continuous audio recording

---

### 🟡 Low Activity
**What it means:** Activity time < 30% of session duration  
**Why it matters:** Indicates session was open but mostly idle  
**Typical cause:** Staff opened app, left it running, logged events later  
**Action:** Check if session was abandoned or data entered retroactively

**Example:**
- Session duration: 15.1 minutes
- Activity duration: 4.3 minutes
- Activity ratio: 29%
- **Flag triggered!** - 71% of session was idle

---

### ⏰ Long Session
**What it means:** Session > 2 hours with minimal activity (<20%)  
**Why it matters:** Almost certainly a forgotten open session  
**Typical cause:** App opened, session never closed, data added later  
**Action:** Review session and implement auto-timeout

**Example:**
- Session duration: 898.7 minutes (15 hours!)
- Activity duration: 0.9 minutes (54 seconds)
- Activity ratio: 0.1%
- **Major red flag!** - Session left open overnight

---

### ⚡ Rapid Entry
**What it means:** >50% of events logged < 10 seconds apart  
**Why it matters:** Natural service has gaps between events  
**Typical cause:** Batch entry of multiple items at once  
**Action:** Verify if this matches actual service pattern

**Example:**
- 10 events in session
- 7 events logged 2-6 seconds apart
- Rapid entry ratio: 70%
- **Flag triggered!** - Likely rushed data entry

---

### 📦 Bulk Entry
**What it means:** 5+ events within 30 seconds  
**Why it matters:** Indicates rushed logging of past events  
**Typical cause:** Staff entering multiple items from memory  
**Action:** Confirm if this was legitimate rapid service

**Example:**
- First 5 events: Spans only 18 seconds
- **Flag triggered!** - Suspicious clustering

---

## Authenticity Score Components

The score is calculated from 4 weighted components:

### 1️⃣ Event Distribution (30%)
**Measures:** How spread out events are across session  
**Perfect score:** Events cover 80%+ of session duration  
**Low score:** Events clustered in small portion of session

**Example:**
- Session: 20 minutes
- First to last event: 18 minutes
- Distribution: 90% → **High score** (natural)

vs.

- Session: 20 minutes  
- First to last event: 3 minutes
- Distribution: 15% → **Low score** (suspicious)

---

### 2️⃣ Audio Presence (30%)
**Measures:** Audio chunk count relative to session duration  
**Perfect score:** ~1 chunk per 2 minutes (continuous recording)  
**Low score:** No audio or very few chunks

**Example:**
- Session: 10 minutes
- Audio chunks: 5
- Audio score: 100 → **Excellent!**

vs.

- Session: 10 minutes
- Audio chunks: 0
- Audio score: 0 → **Major issue!**

---

### 3️⃣ Time Gap Naturalness (20%)
**Measures:** How natural the spacing between events is  
**Perfect score:** Events 30-300 seconds apart (natural service)  
**Low score:** Most events < 10 seconds apart (rushed entry)

**Example:**
- Average gap: 55 seconds
- Rapid entries: 20%
- Naturalness: 100 → **Natural pattern**

vs.

- Average gap: 6 seconds
- Rapid entries: 80%
- Naturalness: 20 → **Suspicious clustering**

---

### 4️⃣ Duration Match (20%)
**Measures:** Activity duration vs total session duration  
**Perfect score:** Activity ≥ 80% of session (minimal idle time)  
**Low score:** Activity < 30% of session (mostly idle)

**Example:**
- Session: 5 minutes
- Activity: 4.8 minutes
- Match: 96% → **Excellent!**

vs.

- Session: 60 minutes
- Activity: 2 minutes
- Match: 3% → **Likely abandoned session**

---

## Quality Metrics Dashboard Cards

### Card 1: Average Authenticity
```
🎯 52.5
🟡 Questionable
Avg Authenticity
```
**Interpretation:**
- **70+:** Healthy usage patterns
- **50-69:** Some issues, monitor trends
- **<50:** Significant quality concerns

**Your score (52.5):** Below ideal, room for improvement

---

### Card 2: Flagged Sessions
```
🚩 14
37% of sessions
Flagged Sessions
```
**Interpretation:**
- **<20%:** Acceptable range
- **20-40%:** Moderate concern
- **>40%:** Major quality issues

**Your score (37%):** High, indicates discipline needed

---

### Card 3: Audio Coverage
```
🎤 97%
🟢 Excellent
Audio Coverage
```
**Interpretation:**
- **90-100%:** 🟢 Excellent
- **70-89%:** 🟡 Good
- **<70%:** 🔴 Needs Improvement

**Your score (97%):** Great! Audio discipline is strong

---

### Card 4: Quality Distribution
```
📊 13 | 19 | 5
🟢 Auth | 🟡 Quest | 🔴 Susp
Quality Distribution
```
**Interpretation:**
- **Ideal:** 70% | 25% | 5%
- **Acceptable:** 50% | 40% | 10%
- **Concerning:** <40% | >40% | >20%

**Your distribution:** 35% | 51% | 14%
- Too few authentic sessions
- Too many questionable
- Suspicious within acceptable range

---

## Common Scenarios

### ✅ GOOD SESSION (Score: 79/100)
```
Session Details:
  Duration: 3.8 minutes
  Activity: 3.7 minutes (97%)
  Events: 5
  Audio chunks: 2
  Average gap: 55 seconds
  
Flags: None
  
This is the target pattern!
```

**Characteristics:**
- High activity ratio (97%)
- Has audio recording
- Natural event spacing
- Minimal idle time

---

### ⚠️ QUESTIONABLE SESSION (Score: 52/100)
```
Session Details:
  Duration: 8.2 minutes
  Activity: 4.1 minutes (50%)
  Events: 7
  Audio chunks: 1
  Average gap: 12 seconds
  
Flags: Rapid Entry

Could be legitimate busy service or rushed entry
```

**Characteristics:**
- Moderate activity ratio
- Some audio (but minimal)
- Events clustered
- Worth monitoring

---

### 🔴 SUSPICIOUS SESSION (Score: 16/100)
```
Session Details:
  Duration: 15.1 minutes
  Activity: 4.3 minutes (29%)
  Events: 6
  Audio chunks: 0
  Average gap: 51 seconds
  
Flags: No Audio, Low Activity

REVIEW REQUIRED!
```

**Characteristics:**
- Low activity ratio (29%)
- NO audio recording
- Session mostly idle
- Clear retroactive entry pattern

---

### 🚨 ABANDONED SESSION (Score: 18/100)
```
Session Details:
  Duration: 898.7 minutes (15 hours!)
  Activity: 0.9 minutes (0.1%)
  Events: 3
  Audio chunks: 1
  Average gap: 18 seconds
  
Flags: Low Activity, Long Session

Session forgotten overnight!
```

**Characteristics:**
- Massive duration (hours)
- Tiny activity (minutes)
- Session left open
- Data added much later

---

## Taking Action

### For Managers:

**If you see many 🔴 Red sessions:**
1. Review flagged sessions individually
2. Discuss usage patterns with staff
3. Provide training on proper app usage
4. Set quality targets (aim for >70% authentic)
5. Monitor trends over time

**If you see 🟡 Yellow sessions:**
1. Watch for patterns (same staff? same times?)
2. May be legitimate but verify
3. Set expectation for audio recording
4. Encourage real-time usage

**If you see 🟢 Green sessions:**
1. Recognize good practices
2. Use as training examples
3. Maintain current standards

### For Staff:

**To achieve high authenticity scores:**
1. ✅ Open session WHEN service starts
2. ✅ Enable audio recording
3. ✅ Log items AS you serve (not after)
4. ✅ Keep app active during service
5. ✅ Close session WHEN service ends

**Avoid these behaviors:**
1. ❌ Opening session hours before/after service
2. ❌ Forgetting to enable audio
3. ❌ Entering all items at once from memory
4. ❌ Leaving sessions open when not in use
5. ❌ Batch logging at end of day

---

## Frequently Asked Questions

### Q: Why is my score low even with all events logged correctly?
**A:** Score measures HOW data was entered, not just WHAT. Low scores often indicate timing issues (retroactive entry, session abandonment, rushed logging) even if the data itself is accurate.

### Q: Can a session have no flags but still score low?
**A:** Yes! A score of 45 might have no critical flags but still indicates questionable patterns (e.g., moderate activity ratio, minimal audio, some rapid entries).

### Q: What's an acceptable average authenticity score?
**A:** 
- **70+:** Excellent
- **60-69:** Good
- **50-59:** Fair (needs improvement)
- **<50:** Poor (requires attention)

### Q: How often should I check quality metrics?
**A:** 
- Daily: Quick glance at average score
- Weekly: Review flagged sessions
- Monthly: Trend analysis and training

### Q: Can legitimate service trigger flags?
**A:** Rarely. Very rapid service might trigger "Rapid Entry" but would still have high activity ratio and audio. True authentic sessions typically score 70+.

### Q: What if staff claim they DID use the app during service?
**A:** The data doesn't lie. Low scores with specific flags (no audio, low activity, long duration) are objective evidence. Use it as a coaching opportunity, not punishment.

---

## Quick Action Checklist

When you see a 🔴 Suspicious session:

- [ ] Click "View" to see full details
- [ ] Note the specific flags
- [ ] Check duration vs activity ratio
- [ ] Verify if audio was recorded
- [ ] Review with staff member
- [ ] Document the issue
- [ ] Set expectations for improvement
- [ ] Monitor next sessions for changes

---

## Success Story Example

**Before Enhancement (No Visibility):**
- All sessions looked fine
- No way to detect issues
- Quality concerns invisible

**After 1 Week of Monitoring:**
- Identified 3 staff members with <40 scores
- Provided targeted training
- Explained importance of real-time logging
- Enabled audio recording reminders

**After 1 Month:**
- Average authenticity: 52.5 → 68.3 ✅
- Flagged sessions: 37% → 18% ✅
- Audio coverage: 97% → 99% ✅
- Suspicious sessions: 14% → 5% ✅

**Result:** Data quality improved, actual usage patterns more reliable!

---

## Need Help?

If you're seeing concerning patterns:
1. Review this guide for interpretation
2. Check specific session details
3. Compare with successful sessions
4. Implement corrective measures
5. Track improvement over time

**Remember:** The goal isn't punishment - it's improving data quality and ensuring the app is used as intended for accurate business insights!
