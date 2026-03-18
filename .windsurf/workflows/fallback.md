---
description: Run fallback QA checks for new city/country hydration
---

1. Open `web/src/TravelSafety.tsx`.
2. Verify fallback-first behavior:
   - `searchFor` renders from `advisories`/`FALLBACK_ADVISORIES` first.
   - No awaited API calls before initial `setSearchResult(...)`.
3. Verify mapping coverage:
   - Every city country in `CITY_COORDINATES`/`CITY_TO_COUNTRY` exists in `FALLBACK_ADVISORIES`.
4. Verify NLP patterns for newly added locations:
   - `is it safe to travel to X`
   - `can i travel to X`
   - `is it safe in X`
5. Run a 5-query regression across regions and report PASS/FAIL.
6. Run `pnpm run build` and include result in report.
