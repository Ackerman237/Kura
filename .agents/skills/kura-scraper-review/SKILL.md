---
name: kura-scraper-review
description: >-
  Audits and reviews Kura scrapers, data providers, media extractors, and proxy routes for architectural separation, extraction reliability, security (SSRF/sanitization), rate-limiting, and runtime data correctness against verified human-authored standards. Use when asked to "review scraper", "audit provider", "check SSRF security", "inspect extraction selectors", "debug scraper timeout", or "review Kura data sources".
license: MIT
compatibility: Node.js >= 18.17, ESM, Undici/native fetch.
metadata:
  version: "1.0.0"
  author: "Kura Engineering"
---

# Kura Scraper Review Orchestrator

A specialized project-local reviewer for Kura scraper modules, data providers, media extraction pipelines, and proxy routes.

This skill is strictly an **orchestrator of verified human-authored scraping, testing, and security standards** (Apify, Scrapfly, Playwright, QA Methodology, and Secure Software Engineering). It does not invent novel scraping methodologies.

---

## 1. Scope & Boundaries

- **IS**: Auditing scraper architecture, extractor selectors, timeout/retry reliability, SSRF security, rate limiting, and runtime data correctness across Kura providers (`src/doujindesu.js`, `src/nekopoi.js`, `src/hentaitv.js`, `src/eporner.js`, `src/sources/`, `src/proxy.js`).
- **IS NOT**: Browser execution operations (routes to `playwright`), broad QA test strategy (routes to `qa-methodology`), general software architecture (routes to `open-code-review-delegate`), or UI review (routes to `kura-ui-ux-review`).

---

## 2. Review Dimensions & Verified Standards

Every scraper audit evaluates six core dimensions:

```
+-----------------------------------------------------------------------------------------+
|                              KURA SCRAPER REVIEW DIMENSIONS                             |
+-----------------------------------------------------------------------------------------+
| 1. Architecture & Boundaries      | Fetcher/Parser/Normalizer separation, unified       |
|                                   | domain models, provider isolation (Apify/Scrapfly). |
+-----------------------------------+-----------------------------------------------------+
| 2. Extraction & Selectors         | Fallback selector chains, malformed HTML resilience,|
|                                   | absolute media URLs, pagination bounds (Scrapfly).  |
+-----------------------------------+-----------------------------------------------------+
| 3. Reliability & Fault Tolerance  | Explicit timeouts (AbortSignal), exponential        |
|                                   | backoff, rate limiting, stale-cache fallback (QA).  |
+-----------------------------------+-----------------------------------------------------+
| 4. Performance & Resource Bounds  | Concurrency control, streaming vs memory buffering, |
|                                   | duplicate request elimination, cache hit rates.     |
+-----------------------------------+-----------------------------------------------------+
| 5. Security & Threat Modeling     | SSRF prevention, private IP blocking, redirect      |
|                                   | validation, untrusted input sanitization (Apify/Sec)|
+-----------------------------------+-----------------------------------------------------+
| 6. Runtime Verification           | Live HTTP status inspection, network mocking,       |
|                                   | expected vs actual JSON payload checks (Playwright).|
+-----------------------------------------------------------------------------------------+
```

---

## 3. Scraper Review Workflow

When auditing a provider or scraper module:

1. **Inspect Module Architecture**: Check separation of concerns between HTTP fetching, DOM parsing, and domain normalization ([`references/architecture-rules.md`](./references/architecture-rules.md)).
2. **Evaluate Extraction Resilience**: Verify fallback selector chains and graceful handling of missing fields ([`references/extraction-reliability.md`](./references/extraction-reliability.md)).
3. **Audit Security & Threat Surface**: Verify SSRF IP blocking, redirect re-validation, and remote input sanitization ([`references/security-threat-model.md`](./references/security-threat-model.md)).
4. **Inspect Reliability Controls**: Check explicit request timeouts (`AbortSignal.timeout`), retry logic, and rate limiting.
5. **Run Runtime Verification (When Available)**: Execute live test probes to verify HTTP responses, redirect chains, and extracted payloads against expected schemas ([`references/runtime-verification.md`](./references/runtime-verification.md)).
6. **Compile Evidence-Based Report**: Produce findings grouped by severity with clickable `file:line` locations and actionable code fixes.

---

## 4. Standard Audit Report Template

```markdown
# Scraper Review Report: [Provider Name / Module]

## 1. Module Context
- **Target File**: `src/path/to/provider.js`
- **Upstream Host**: `https://...`
- **Verification Status**: [Live Runtime Probed | Static Source Code Analysis]

## 2. Assessment by Dimension

| Dimension | Status | Verified Standard | Findings Summary |
|---|---|---|---|
| **Architecture** | 🟢 / 🟠 / ⚫ | Layer separation, provider isolation | [Summary] |
| **Extraction** | 🟢 / 🟠 / ⚫ | Fallback selectors, URL normalization | [Summary] |
| **Reliability** | 🟢 / 🟠 / ⚫ | Timeouts, retries, rate limiting | [Summary] |
| **Performance** | 🟢 / 🟠 / ⚫ | Concurrency, cache effectiveness | [Summary] |
| **Security** | 🟢 / 🟠 / ⚫ | SSRF, redirect validation, sanitization | [Summary] |
| **Runtime Proof** | 🟢 / 🟠 / ⚫ | Live HTTP status, schema validation | [Summary] |

*Legend: 🟢 Pass | 🟠 Needs Attention (Major) | ⚫ Blocking Defect (Critical)*

## 3. Prioritized Issues

### 🔴 Blocking (Must Fix)
1. `src/path/to/file.js:line` - [Issue description + Root cause + Remediation code]

### 🟠 Major (Should Fix)
1. `src/path/to/file.js:line` - [Issue description + Root cause + Remediation code]

### 🟡 Minor (Refinement)
1. `src/path/to/file.js:line` - [Issue description + Root cause + Remediation code]

## 4. Runtime Evidence Log (If Verified Live)
```text
Endpoint: [URL]
HTTP Status: [200 / 403 / 500]
Extracted Count: [X items]
Discrepancies: [None / Field Y missing]
```
```

---

## 5. Reference Links
- [`references/sources.md`](./references/sources.md) - Exact verified sources, URLs, and authority mapping
- [`references/architecture-rules.md`](./references/architecture-rules.md) - Layer separation and modular provider design
- [`references/security-threat-model.md`](./references/security-threat-model.md) - SSRF prevention and untrusted input sanitization
- [`references/extraction-reliability.md`](./references/extraction-reliability.md) - Resilient selectors, timeouts, and rate limits
- [`references/runtime-verification.md`](./references/runtime-verification.md) - Live HTTP and schema verification protocol
- [`tests/test-scenarios.md`](./tests/test-scenarios.md) - 10 validation test scenarios
