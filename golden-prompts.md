# Golden Prompt Set - Is It Safe? Travel Safety

This document contains test prompts to validate the `check_travel_safety` connector's metadata and behavior.

## Purpose
Use these prompts to test:
- **Precision**: Does the right tool get called?
- **Recall**: Does the tool get called when it should?
- **Accuracy**: Are the right parameters passed?

---

## Direct Prompts (Should ALWAYS trigger the connector)

### 1. Explicit Safety Check
**Prompt**: "Is it safe to travel to Colombia?"
**Expected**: ✅ Calls `check_travel_safety` with location="Colombia"
**Status**: [ ] Pass / [ ] Fail

### 2. City-Specific Query
**Prompt**: "Check travel safety for Bangkok"
**Expected**: ✅ Calls `check_travel_safety` with city="Bangkok"
**Status**: [ ] Pass / [ ] Fail

### 3. Country Advisory
**Prompt**: "What's the travel advisory for Ukraine?"
**Expected**: ✅ Calls `check_travel_safety` with country="Ukraine"
**Status**: [ ] Pass / [ ] Fail

### 4. Detailed Parameters
**Prompt**: "Show me safety data for Mexico City including news and conflict data"
**Expected**: ✅ Calls `check_travel_safety` with city="Mexico City", include_news=true, include_conflict=true
**Status**: [ ] Pass / [ ] Fail

### 5. Open-Ended Safety
**Prompt**: "Is it safe to travel right now?"
**Expected**: ✅ Calls `check_travel_safety` with no arguments (opens widget for manual search)
**Status**: [ ] Pass / [ ] Fail

---

## Indirect Prompts (Should trigger the connector)

### 6. Trip Planning
**Prompt**: "I'm planning a trip to Kenya, should I be worried?"
**Expected**: ✅ Calls `check_travel_safety` with location="Kenya"
**Status**: [ ] Pass / [ ] Fail

### 7. News-Based Concern
**Prompt**: "Is there any danger traveling to Israel right now?"
**Expected**: ✅ Calls `check_travel_safety` with location="Israel"
**Status**: [ ] Pass / [ ] Fail

### 8. Comparison
**Prompt**: "How safe is Tokyo compared to other cities?"
**Expected**: ✅ Calls `check_travel_safety` with city="Tokyo"
**Status**: [ ] Pass / [ ] Fail

---

## Negative Prompts (Should NOT trigger the connector)

### 9. Food Safety
**Prompt**: "Is it safe to eat raw fish?"
**Expected**: ❌ Does NOT call `check_travel_safety` (food safety, not travel)
**Status**: [ ] Pass / [ ] Fail

### 10. Financial Safety
**Prompt**: "Is it safe to invest in crypto?"
**Expected**: ❌ Does NOT call `check_travel_safety` (financial advice)
**Status**: [ ] Pass / [ ] Fail

### 11. General Safety
**Prompt**: "Is this neighborhood safe to walk at night?"
**Expected**: ❌ Does NOT call `check_travel_safety` (local safety, not travel advisory)
**Status**: [ ] Pass / [ ] Fail

---

## Edge Cases

### 12. Region Query
**Prompt**: "Is Southeast Asia safe?"
**Expected**: ✅ Calls `check_travel_safety` with location="Southeast Asia"
**Status**: [ ] Pass / [ ] Fail

### 13. Ambiguous Location
**Prompt**: "Safety in Georgia"
**Expected**: ✅ Calls `check_travel_safety` with location="Georgia" (may need disambiguation)
**Status**: [ ] Pass / [ ] Fail

---

## Testing Instructions

### How to Test
1. Open ChatGPT in **Developer Mode**
2. Link your Is It Safe? travel safety connector
3. For each prompt above:
   - Enter the exact prompt
   - Observe which tool gets called
   - Check the parameters passed
   - Verify the widget renders correctly
   - Mark Pass/Fail in the Status column