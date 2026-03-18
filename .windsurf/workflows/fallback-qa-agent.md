---
description: Fallback QA agent for city/country hydration safety checks
---

# Fallback QA Agent

Purpose: Ensure every new city/country is hydrated from static fallback data first, with no blocking API calls.

1. Read `web/src/TravelSafety.tsx`.
2. Confirm fallback-first search path:
   - `searchFor` renders from `advisories`/`FALLBACK_ADVISORIES` immediately.
   - `setSearchResult(...)` happens before any awaited network call.
   - Live API calls (ACLED/GDELT/UK) are background enrichment only.
3. Validate coverage:
   - For each new city in `CITY_COORDINATES` or `CITY_TO_COUNTRY`, confirm its country key exists in `FALLBACK_ADVISORIES`.
   - Confirm key normalization consistency (e.g., `south korea` vs `korea, south`) and add alias/fallback key where needed.
4. Validate NLP compatibility for newly added locations:
   - `is it safe to travel to X`
   - `can i travel to X`
   - `is it safe in X`
5. Run 5-query regression checks across regions:
   - Latin America city
   - Europe city
   - Asia city
   - Middle East/Africa city
   - Direct country query
6. Build and report:
   - Run `pnpm run build`.
   - Return PASS/FAIL with missing fallback keys, normalization mismatches, and 5-query results.

Fail immediately if any city maps to a country missing from `FALLBACK_ADVISORIES` or if first render requires live APIs.
