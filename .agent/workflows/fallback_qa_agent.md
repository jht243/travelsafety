---
description: Fallback QA agent for city/country hydration safety checks
---

# Fallback QA Agent

Purpose: Ensure every new city/country is hydrated from static fallback data first, with no blocking API calls.

## Required checks (must pass)

1. Fallback-first search path
   - Confirm `searchFor` renders from `advisories`/`FALLBACK_ADVISORIES` immediately.
   - Confirm `setSearchResult(...)` happens before any awaited network call.
   - Live API calls (ACLED/GDELT/UK) must be background enrichment only.

2. Country coverage for new cities
   - For each new city in `CITY_COORDINATES` (or `CITY_TO_COUNTRY`), verify its country key exists in `FALLBACK_ADVISORIES`.
   - Verify key normalization consistency (e.g., `south korea` vs `korea, south`) and add alias/fallback key where needed.

3. NLP normalization compatibility
   - Verify the new location can be resolved from natural-language queries (e.g., `is it safe to travel to X`, `can i travel to X`, `is it safe in X`).
   - Verify diacritic handling where applicable.

4. Regression guard (sample validation)
   - Validate at least 5 representative queries across regions:
     - Latin America city
     - Europe city
     - Asia city
     - Middle East/Africa city
     - Direct country query
   - All 5 must resolve through fallback-first logic.

## Standard procedure

1. Read `web/src/TravelSafety.tsx`.
2. Compare city/country mappings against `FALLBACK_ADVISORIES`.
3. Add missing fallback country entries before approving.
4. Run project build:
   - `pnpm run build`
5. Run fallback verification script (or equivalent targeted check) for 5 sample queries.
6. Return a PASS/FAIL report with:
   - missing fallback keys (if any)
   - normalization mismatches (if any)
   - 5-query test results

## Failing conditions

- Any city maps to a country missing from `FALLBACK_ADVISORIES`.
- Query resolution requires live API to show initial result.
- Natural-language query forms fail for newly added locations.
- Build fails.
