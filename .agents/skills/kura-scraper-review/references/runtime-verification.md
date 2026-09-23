# Runtime Verification & Live Evidence Protocol

This reference outlines the requirements for verifying scraper runtime behavior using real HTTP responses, network logs, and browser evidence rather than static code inspection alone.

*Primary sources: Playwright `playwright/SKILL.md` (magnus919), Scrapfly `skills/scrapfly-scraper/SKILL.md`.*

---

## 1. Runtime Verification Requirement

> [!IMPORTANT]
> **Static Code Inspection is Insufficient**: Scrapers interact with live external endpoints. Whenever runtime execution or test tools are available, review findings must be validated against actual runtime network requests and parsed responses.

---

## 2. Live Runtime Inspection Steps

When auditing a Kura scraper module:

1. **Direct Endpoint Probe**:
   - Execute a controlled fetch to the provider's actual endpoint or mock server:
     ```bash
     node -e "import('./src/doujindesu.js').then(m => m.search('naruto')).then(console.log).catch(console.error)"
     ```
2. **Examine Response Headers & Status**:
   - Check status codes (200, 301, 403, 429, 503).
   - Check Content-Type (`text/html; charset=utf-8`, `application/json`).
   - Check redirect chains (verify final destination URL matches expected domain).
3. **Inspect Extracted DOM & Schema**:
   - Compare extracted JSON against expected fields:
     - `id`: Non-empty string / numeric ID.
     - `title`: Clean string without trailing whitespace or raw HTML entities (`&amp;`, `&#039;`).
     - `cover`: Valid absolute URL (`https://...`).
     - `chapters`: Array with non-zero length and valid URLs.
4. **Browser-Assisted Inspection (For JS-Rendered Providers)**:
   - When scraping JavaScript-heavy or Cloudflare-protected targets, use headless Playwright or browser automation:
     - Verify selector matches in live DOM: `page.locator('.chapter-item')`.
     - Inspect network responses via `page.on('response')` to capture underlying API endpoints.

---

## 3. Evidence Log Format

Record runtime findings using the standardized evidence schema:

```text
Provider: [Provider Name, e.g. nekopoi]
Endpoint Tested: [URL, e.g. https://...]
HTTP Status: [200 OK / 403 Forbidden / etc.]
Redirect Chain: [None / A -> B]
Expected Schema Fields: [id, title, cover, chapters, type]
Extracted Fields: [id: OK, title: OK, cover: MALFORMED_RELATIVE_URL, chapters: EMPTY_ARRAY]
Root Cause: [Upstream DOM changed .cover img to .poster img]
Remediation: [Add fallback selector .poster img in src/sources/nekopoi/parser.js]
```
