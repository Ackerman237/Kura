# Scraper Extraction Reliability & Resilience

This reference specifies reliability, fault tolerance, and extraction engineering standards for Kura scrapers.

*Primary sources: Scrapfly `skills/scrapfly-scraper/SKILL.md`, QA Methodology (`magnus919`).*

---

## 1. Resilient Selectors & Fallback Strategy

Web scrapers face frequent remote HTML structure changes. Parsers must implement defense-in-depth extraction:

1. **Fallback Selector Chains**:
   - For critical fields (`title`, `cover`, `chapters`, `streamUrl`), provide primary and secondary fallback selectors:
     ```javascript
     const cover = doc.querySelector('.thumb img')?.getAttribute('src')
       || doc.querySelector('.cover-image img')?.getAttribute('data-src')
       || doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
       || null;
     ```
2. **Structural Assertions**:
   - If a primary selector yields 0 results where items were expected, log a structured warning:
     `[Provider:doujindesu] SelectorWarning: Primary chapter selector '.chapter-list a' returned 0 elements.`
3. **Attribute Sanitization**:
   - Handle lazy-loaded images (`data-src`, `data-lazy-src`, `data-original`, `srcset`).

---

## 2. Timeout, Retry & Exponential Backoff

1. **Explicit Request Timeouts**:
   - Every outbound HTTP request must declare a strict timeout (e.g., 10,000ms for metadata; 15,000ms for video streams) using `AbortSignal.timeout(ms)`. Never allow indefinite blocking requests.
2. **Controlled Retries with Jitter**:
   - Retry transient network errors (502, 503, 504, ECONNRESET, ETIMEDOUT) up to 2–3 attempts with exponential backoff:
     $$\text{Delay} = \text{base} \times 2^{\text{attempt}} + \text{jitter}$$
   - **Do Not Retry Client Errors**: Never retry 400, 401, 403 (unless rotating proxy/headers), or 404.
3. **Rate Limiting & Politeness**:
   - Enforce minimum inter-request delays (e.g., 250ms–500ms) per remote host via `src/rate-limiter.js` to avoid triggering IP bans or Cloudflare rate limits.

---

## 3. Failure Isolation & Partial Degradation

1. **Provider Sandboxing**:
   - If a provider encounters an unhandled extraction error, catch it at the provider boundary:
     - Return `{ success: false, provider: 'nekopoi', error: 'ExtractionFailed', items: [] }`.
     - Do not bubble uncaught exceptions to the main Express server process.
2. **Stale-While-Revalidate Caching**:
   - When a live scrape fails (e.g. upstream site down), serve the cached response with a `stale: true` flag rather than failing completely.
