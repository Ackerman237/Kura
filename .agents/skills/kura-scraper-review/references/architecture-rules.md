# Scraper Architecture & Modular Provider Design

This reference details the architectural standards for Kura scrapers and data providers, grounded in verified source patterns from Apify, Scrapfly, and Secure Software Engineering.

---

## 1. Provider Layer Separation (Fetcher -> Parser -> Normalizer)

Every provider implementation must respect strict single-responsibility boundaries:

```
+-------------------------------------------------------------------------------+
|                             PROVIDER DATA FLOW                                |
+-------------------------------------------------------------------------------+
|  1. Fetcher / Client Layer    | Performs HTTP request, sets User-Agent/headers|
|     (e.g., src/http.js)       | handles timeouts, proxies, retries & cookies. |
+-------------------------------+-----------------------------------------------+
                                        │
                                        ▼ (Raw HTML / JSON)
+-------------------------------+-----------------------------------------------+
|  2. Parser & Extractor Layer  | Extracts raw fields from DOM or JSON payload. |
|     (e.g., sources/*/parser)  | Resilient selectors with fallback selectors.  |
+-------------------------------+-----------------------------------------------+
                                        │
                                        ▼ (Raw Extracted Data)
+-------------------------------+-----------------------------------------------+
|  3. Normalizer & Domain Model | Coerces types, trims text, validates URLs,    |
|     (e.g., comicType.js)      | maps to Kura Unified Series/Media domain.    |
+-------------------------------+-----------------------------------------------+
                                        │
                                        ▼ (Normalized Clean Object)
+-------------------------------+-----------------------------------------------+
|  4. Caching & Delivery Layer  | Persists response in in-memory / disk cache   |
|     (e.g., src/cache.js)      | and serves to API routes or unified feed.     |
+-------------------------------+-----------------------------------------------+
```

### Mandatory Separation Rules:
1. **No Mixed Network & DOM Code**: Parsers must never execute HTTP fetches directly. They should accept a string/DOM/JSON input and return data.
2. **Standardized Return Schemas**: Every provider method (`search`, `getDetail`, `getPages`, `getStream`) must return a predictable domain object conforming to Kura schemas:
   - `id`, `title`, `cover`, `url`, `type` (`manga` / `doujin` / `anime` / `video`), `provider`, `updatedAt`.
3. **Provider Abstraction & Isolation**: A failure in one provider (e.g. `doujindesu` 500 error or Cloudflare challenge) must never crash the server, block the unified feed, or prevent other providers from returning results.

---

## 2. Dependency Direction & Shared Utilities

1. **Shared Core Utilities**:
   - HTTP requests must route through `src/http.js` or centralized fetcher to enforce timeout, rate limiting, and User-Agent headers.
   - Proxying of remote media must use `src/proxy.js` to ensure SSRF sanitization and header validation.
   - Cache reads/writes must use `src/cache.js` rather than ad-hoc module-level global variables.
2. **Duplicated Logic Elimination**:
   - Common extraction heuristics (e.g., scraping page numbers, duration string parsing, clean synopsis stripping) must reside in shared helper modules rather than copy-pasted across provider files.
