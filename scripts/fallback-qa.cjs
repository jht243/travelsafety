#!/usr/bin/env node
/**
 * Fallback QA Agent
 * -----------------
 * Validates that every city/country in the widget has static fallback
 * advisory data and can be resolved instantly without live API calls.
 *
 * Run:  node scripts/fallback-qa.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'web', 'src', 'TravelSafety.tsx');
const src = fs.readFileSync(SRC, 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

// ── Helpers ──────────────────────────────────────────────────────────

function extractBlock(startMarker, endMarker) {
  const s = src.indexOf(startMarker);
  const e = src.indexOf(endMarker, s + startMarker.length);
  return src.substring(s, e);
}

function getCityCountries() {
  const block = extractBlock('const CITY_COORDINATES', 'const CITY_ALIASES');
  const map = {};
  const re = /^\s+'([^']+)':\s*\{[^}]*country:\s*'([^']+)'/gm;
  let m;
  while ((m = re.exec(block)) !== null) map[m[1]] = m[2];
  return map;
}

function getFallbackKeys() {
  const block = extractBlock('const FALLBACK_ADVISORIES', 'function AdvisoryLevelBadge');
  const keys = new Set();
  const re = /^\s+'([^']+)':\s*\{/gm;
  let m;
  while ((m = re.exec(block)) !== null) keys.add(m[1]);
  return keys;
}

function getCityAliases() {
  const block = extractBlock('const CITY_ALIASES', 'function getDistanceKm');
  const map = {};
  const re = /^\s+'([^']+)':\s*'([^']+)'/gm;
  let m;
  while ((m = re.exec(block)) !== null) map[m[1]] = m[2];
  return map;
}

function normalizeSearchQuery(input) {
  let query = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  query = query
    .replace(/^is it safe(?:\s+to)?(?:\s+travel)?(?:\s+to|\s+in)?\s+/, '')
    .replace(/^can i(?:\s+safely)?(?:\s+travel)?(?:\s+to)?\s+/, '')
    .replace(/^should i(?:\s+travel)?(?:\s+to)?\s+/, '')
    .replace(/^how safe is(?:\s+it(?:\s+to)?(?:\s+travel)?(?:\s+to)?)?\s+/, '')
    .replace(/^how safe is\s+/, '')
    .replace(/^travel safety(?:\s+in|\s+for)?\s+/, '')
    .replace(/^safety(?:\s+in|\s+of|\s+for)?\s+/, '')
    .replace(/^travel(?:\s+to|\s+in)\s+/, '')
    .replace(/^visit(?:ing)?\s+/, '')
    .replace(/^go(?:ing)?(?:\s+to)?\s+/, '')
    .replace(/^fly(?:ing)?(?:\s+to)?\s+/, '')
    .replace(/^trip to\s+/, '')
    .replace(/^vacation(?:\s+in|\s+to)?\s+/, '')
    .replace(/^holiday(?:\s+in|\s+to)?\s+/, '')
    .trim();
  return query;
}

// ── Check 1: Fallback-first search path ─────────────────────────────

function checkSearchForOrder() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('CHECK 1: Fallback-first search path');
  console.log('══════════════════════════════════════════════════');

  // searchFor is defined AFTER enrichResultInBackground, so extract to next top-level const
  const searchStart = src.indexOf('const searchFor = async');
  // Grab ~200 lines (enough for the function body)
  const searchBlock = src.substring(searchStart, searchStart + 8000);

  // setSearchResult must appear before any fetch/enrichResultInBackground
  const setIdx = searchBlock.indexOf('setSearchResult(');
  const enrichIdx = searchBlock.indexOf('enrichResultInBackground(');
  const fetchIdx = searchBlock.indexOf('fetch(');

  if (setIdx === -1) {
    console.log('  ❌ FAIL: setSearchResult not found in searchFor');
    failed++; failures.push('setSearchResult missing from searchFor');
    return;
  }

  if (enrichIdx !== -1 && setIdx > enrichIdx) {
    console.log('  ❌ FAIL: setSearchResult appears AFTER enrichResultInBackground');
    failed++; failures.push('setSearchResult after enrichResultInBackground');
    return;
  }

  if (fetchIdx !== -1 && setIdx > fetchIdx) {
    console.log('  ❌ FAIL: setSearchResult appears AFTER a fetch() call');
    failed++; failures.push('setSearchResult after fetch()');
    return;
  }

  console.log('  ✅ PASS: setSearchResult fires before any live API call');
  passed++;
}

// ── Check 2: Country coverage ───────────────────────────────────────

function checkCountryCoverage() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('CHECK 2: Country coverage (every city has fallback)');
  console.log('══════════════════════════════════════════════════');

  const cityCountries = getCityCountries();
  const fallbackKeys = getFallbackKeys();

  const allCountries = new Set(Object.values(cityCountries).map(c => c.toLowerCase()));
  const missing = [];

  for (const country of allCountries) {
    if (!fallbackKeys.has(country)) missing.push(country);
  }

  if (missing.length > 0) {
    console.log(`  ❌ FAIL: ${missing.length} countries missing from FALLBACK_ADVISORIES:`);
    missing.forEach(c => console.log(`     - ${c}`));
    failed++; failures.push(`Missing fallback countries: ${missing.join(', ')}`);
  } else {
    console.log(`  ✅ PASS: All ${allCountries.size} countries have fallback entries`);
    passed++;
  }
}

// ── Check 3: 5-query regression ─────────────────────────────────────

function checkFiveQueries() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('CHECK 3: 5-query NLP + fallback regression');
  console.log('══════════════════════════════════════════════════');

  const cityCountries = getCityCountries();
  const fallbackKeys = getFallbackKeys();
  const aliases = getCityAliases();

  const testCases = [
    ['is it safe to travel to Medellín?',  'medellin',  'Latin America city (Colombia)'],
    ['can i travel to Seoul',              'seoul',     'Asia city (Korea, South key)'],
    ['is it safe in india',                'india',     'Direct country query'],
    ['how safe is Bali',                   'denpasar',  'Alias -> Asia city (Indonesia)'],
    ['should i go to Tbilisi',             'tbilisi',   'Caucasus city (Georgia)'],
  ];

  for (const [rawQuery, expectedKey, desc] of testCases) {
    const query = normalizeSearchQuery(rawQuery);
    const resolved = aliases[query] || query;

    const countryFromCity = cityCountries[resolved];
    let ok = false;
    let detail = '';

    if (countryFromCity) {
      const key = countryFromCity.toLowerCase();
      ok = fallbackKeys.has(key);
      detail = ok
        ? `city -> "${key}" found in FALLBACK_ADVISORIES`
        : `city -> "${key}" MISSING from FALLBACK_ADVISORIES`;
    } else if (fallbackKeys.has(resolved)) {
      ok = true;
      detail = `country "${resolved}" found in FALLBACK_ADVISORIES`;
    } else {
      detail = `"${resolved}" not found as city or country`;
    }

    const status = ok ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: "${rawQuery}"`);
    console.log(`         normalized: "${query}" -> "${resolved}"`);
    console.log(`         ${detail}  [${desc}]`);

    if (ok) passed++; else { failed++; failures.push(`Query "${rawQuery}" failed: ${detail}`); }
  }
}

// ── Run all checks ──────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════╗');
console.log('║         FALLBACK QA AGENT — Full Audit          ║');
console.log('╚══════════════════════════════════════════════════╝');

checkSearchForOrder();
checkCountryCoverage();
checkFiveQueries();

console.log('\n══════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('══════════════════════════════════════════════════');
console.log(`  Total checks: ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ❌ ${f}`));
  console.log('\n  RESULT: ❌ FAIL');
  process.exit(1);
} else {
  console.log('\n  RESULT: ✅ ALL CHECKS PASSED');
  process.exit(0);
}
