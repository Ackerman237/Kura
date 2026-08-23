# doujin-scraper

Raw, framework-agnostic scraping modules for doujin / hentai / adult content sources.
No UI, no framework coupling, no external dependencies — just `fetch`, JSON, and battle-tested HTML parsing.

Extracted from a production Next.js app, these modules handle the hard parts for you:

- **Doujindesu** — reverse-engineered API encryption (XOR + time-rotating keys), fully implemented
- **NekoPoi** — WordPress HTML parsing (lists, categories, genres, detail, players)
- **Hentai.tv** — public JSON API + Next.js RSC payload parsing (genres, series, trending, most-viewed)
- **Eporner** — official JSON API + HTML parsing (categories, top-rated, most-viewed, mp4 sources)

Every function returns normalized, sanitized data — safe to render in your own UI.

---

## Features

- 🔌 **Zero dependencies** — pure Node.js `fetch`, runs on Node ≥ 18.17, Bun, Deno, and serverless runtimes
- 🧩 **Modular** — import one source or all of them; every source is self-contained
- 🔐 **Security built-in** — SSRF protection, URL scheme filtering (`javascript:`, `data:`, ...), HTML stripping
- ⏱️ **TTL caching** — in-memory cache with per-source TTLs; pluggable for Redis/DB backends
- 🛡️ **Hardened parsing** — regex/JSON-LD/RSC parsers that survive markup changes, dedupe, and discard ads/tracking
- 🌐 **Configurable** — base URLs, timeouts, user agents, and credentials via env vars or runtime config
- 📦 **Tree-shakeable ESM** — import only what you need

## Supported sources

| Source | Type | Auth | Endpoints |
| --- | --- | --- | --- |
| [Doujindesu](https://doujin.desu.xxx) | Manga / doujinshi / manhwa | API secret + salt | list, search, genres, detail, chapter images |
| [NekoPoi](https://nekopoi.care) | Video posts (hentai, jav, 2D) | none | list, categories, genres, detail (players), related, random |
| [Hentai.tv](https://hentai.tv) | Streaming hentai 2D | none | list, search, detail, genres, series, trending, most-viewed, related, random |
| [Eporner](https://www.eporner.com) | Tube videos | none | list, search, detail (+mp4 sources), categories, top-rated, most-viewed, related, random |

---

## Requirements

- Node.js **≥ 18.17** (global `fetch` required) — or any runtime that provides `fetch`
- **Doujindesu only**: valid `DOUJIN_APP_SECRET` and `DOUJIN_SALT` credentials

## Installation

```bash
npm install doujin-scraper
```

Or from GitHub:

```bash
npm install github:kyy0887/doujin-scraper
```

No build step, no transitive dependencies.

---

## Quick start

```js
import { scrapeHentaiList, scrapeHentaiDetail } from 'doujin-scraper';

// List latest videos
const { videos, hasNext, total } = await scrapeHentaiList({ page: 1 });
console.log(videos[0]); // { id, slug, title, displayTitle, thumb, embedUrl, views, ... }

// Full detail with player embed
const detail = await scrapeHentaiDetail(videos[0].slug);
console.log(detail.embedUrl); // https://... player URL
```

Import one source only:

```js
import { scrapeMangaList } from 'doujin-scraper/doujindesu';
import { scrapeNekoDetail } from 'doujin-scraper/nekopoi';
import { scrapeEpornerList } from 'doujin-scraper/eporner';
```

---

## Configuration

### Doujindesu credentials (required)

The Doujindesu API rejects requests without credentials. Set them via env vars:

```bash
DOUJIN_APP_SECRET=your_secret
DOUJIN_SALT=your_salt
```

Node ≥ 20.6:

```bash
node --env-file=.env your-app.js
```

Or programmatically:

```js
import { configureDoujin } from 'doujin-scraper';

configureDoujin({
  appSecret: 'your_secret',
  salt: 'your_salt',
  // baseUrl, userAgent, timeoutMs, cacheTtl — all optional
});
```

### Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DOUJIN_APP_SECRET` | — | Doujindesu API app secret (**required**) |
| `DOUJIN_SALT` | — | Doujindesu key-rotation salt (**required**) |
| `DOUJIN_BASE_URL` | `https://doujin.desu.xxx` | Doujindesu base URL |
| `DOUJIN_USER_AGENT` | Chrome UA | Doujindesu user agent |
| `DOUJIN_TIMEOUT_MS` | `30000` | Doujindesu request timeout |
| `NEKO_BASE_URL` | `https://nekopoi.care` | NekoPoi base URL |
| `NEKO_TIMEOUT_MS` | `30000` | NekoPoi request timeout |
| `HENTAI_BASE_URL` | `https://hentai.tv` | Hentai.tv base URL |
| `HENTAI_TIMEOUT_MS` | `30000` | Hentai.tv request timeout |
| `EPORNER_BASE_URL` | `https://www.eporner.com` | Eporner HTML base URL |
| `EPORNER_API_BASE` | `https://api.eporner.com/api/v2` | Eporner API base URL |
| `EPORNER_TIMEOUT_MS` | `30000` | Eporner request timeout |

Runtime equivalents: `configureDoujin()`, `configureNeko()`, `configureHentai()`, `configureEporner()` — each accepts the relevant subset (`baseUrl`, `userAgent`, `timeoutMs`, `cacheTtl`, and `appSecret`/`salt` for Doujindesu).

---

## API reference

### Doujindesu — `doujin-scraper/doujindesu`

| Function | Description |
| --- | --- |
| `scrapeMangaList({ page, query, type, genre, sort, limit })` | Paginated manga list with filters. `type`: `manga` \| `doujinshi` \| `manhwa`. `sort`: `latest_chapter` \| `views` \| `rating`. **Note:** the API ignores `page` — the module translates it to `offset` so pagination actually works |
| `searchManga(query)` | Search by keyword |
| `scrapeGenres()` | All genres with manga counts, sorted by count DESC |
| `scrapeMangaDetail(slug)` | Full detail: synopsis (cleaned HTML), author/artist, genres, chapter list, views |
| `scrapeChapterImages(id)` | Chapter image URLs + manga/chapter metadata |

List item shape:

```js
{
  title: 'string', slug: 'string', thumb: 'https://...',
  rating: number|null, type: 'string', status: 'string|null',
  latestChapter: number|null
}
```

### NekoPoi — `doujin-scraper/nekopoi`

| Function | Description |
| --- | --- |
| `scrapeNekoList(page)` | Latest posts `{ videos, hasNext }` |
| `scrapeNekoCategory(category, page)` | Posts by category `{ videos, hasNext }` |
| `scrapeNekoCategories()` | Category list |
| `scrapeNekoGenres()` | Genre list |
| `scrapeNekoGenre(slug, page)` | Posts by genre `{ videos, hasNext }` |
| `scrapeNekoDetail(slug)` | Detail: title, thumb, **sanitized player iframe URLs**, synopsis |
| `scrapeNekoRelated(slug, { limit })` | YouTube-style recommendations (same-series first) |
| `scrapeNekoRandomSlug()` | Random post slug |

Player URLs are filtered against an allowlist — ad/tracking/embedding iframes are discarded.

### Hentai.tv — `doujin-scraper/hentaitv`

| Function | Description |
| --- | --- |
| `scrapeHentaiList({ page, query })` | Browse/search `{ videos, hasNext, total }` (28/page) |
| `scrapeHentaiDetail(slug)` | Detail via HTML + JSON-LD: embedUrl, tags, views, duration (ISO→`m:ss`), description. Falls back to API search |
| `scrapeHentaiGenres()` | Genre list |
| `scrapeHentaiGenre(slug, page)` | Videos by genre (parsed from RSC payload) `{ videos, total, hasNext }` |
| `scrapeHentaiSeries()` | Series list |
| `scrapeHentaiSeriesDetail(slug)` | Episodes of a series `{ videos, totalEpisodes, title }` |
| `scrapeHentaiTrending()` | Trending videos |
| `scrapeHentaiMostViewed()` | Most-viewed (aggregates 6 pages, sorts by views) |
| `scrapeHentaiRelated(slug, { limit })` | Recommendations (same series first) |
| `scrapeHentaiRandomSlug()` | Random slug (follows the `/random` 307 redirect) |

### Eporner — `doujin-scraper/eporner`

| Function | Description |
| --- | --- |
| `scrapeEpornerList({ page, query, order })` | Browse/search `{ videos, hasNext, total }` (28/page). `order`: `top-rated` |
| `scrapeEpornerDetail(id)` | Detail: embedUrl, **direct mp4 `src[]` per quality** (falls back to HTML scraping), description |
| `scrapeEpornerCategories()` | Category list |
| `scrapeEpornerCategory(slug, page)` | Videos by category `{ videos, hasNext }` |
| `scrapeEpornerListingPage(kind, page)` | `top-rated` or `most-viewed` listings |
| `scrapeEpornerRelated(id, { tags, title, limit })` | Recommendations (tag-based search first) |
| `scrapeEpornerRandomId()` | Random video id |

---

## Caching

All scrapers use a shared in-memory TTL cache (`src/cache.js`):

- Lists and details: **10 min** TTL (Doujindesu: 1 h)
- Genres/series/categories: **1 h**
- Trending / most-viewed: **30 min – 1 h**
- Related recommendations: **2 min** (stays fresh, like YouTube)

Exports:

```js
import { getCache, setCache, clearCache, cacheSize } from 'doujin-scraper';

clearCache();          // drop everything
cacheSize();           // number of entries
```

> **Multi-instance deployments**: the default cache is per-process. For serverless/edge deployments with many instances, override `getCache`/`setCache` with your own Redis/Upstash-backed store — the scrapers call these two functions exclusively.

## Security

All data returned by these scrapers passes through `src/security.js`:

- `safeHttpUrl()` — forces `http(s)://`, rejects `javascript:`, `data:`, `vbscript:`, relative paths
- `isSafeExternalUrl()` — SSRF protection: rejects localhost, private/loopback/link-local IPs, non-standard ports, and DNS rebinding targets
- `stripHtml()` — removes tags/scripts/styles from external text
- NekoPoi players are allowlisted by hostname; ad/tracking iframes are dropped
- Doujindesu synopsis HTML is double-decoded and cleaned (the API double-encodes entities)

Use these utilities in your own UI too:

```js
import { safeHttpUrl, stripHtml, isSafeExternalUrl } from 'doujin-scraper';
```

## Error handling

All functions throw plain `Error`s with descriptive messages:

- `HTTP 404 for /api/manga/xxx` — upstream returned an error status
- `Video xxx not found` — no such item on the source
- `Failed to decrypt server response` — wrong/missing Doujindesu credentials
- Invalid input (bad slug/id/genre) throws `Error('Invalid ...')` immediately

Network timeouts abort after the configured `timeoutMs` (default 30 s) via `AbortSignal.timeout`.

## Examples

### Next.js App Router route handler

```js
// app/api/hentai/route.js
import { NextResponse } from 'next/server';
import { scrapeHentaiList } from 'doujin-scraper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  try {
    const data = await scrapeHentaiList({ page });
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=600' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
```

### Express

```js
import express from 'express';
import { scrapeNekoDetail } from 'doujin-scraper';

const app = express();

app.get('/neko/:slug', async (req, res) => {
  try {
    res.json(await scrapeNekoDetail(req.params.slug));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.listen(3000);
```

### Plain Node script

```js
// npm i doujin-scraper && node index.mjs
import { scrapeEpornerListingPage, clearCache } from 'doujin-scraper';

const { videos } = await scrapeEpornerListingPage('most-viewed');
for (const v of videos.slice(0, 5)) console.log(v.views, v.title);
clearCache();
```

See `examples/basic.js` for a full walkthrough of all four sources.

## Testing

```bash
npm test
```

- `test/crypto.test.mjs` — offline round-trip verification of the Doujindesu decryption algorithm (no network needed)
- `test/smoke.mjs` — live tests against all four sources (requires network; Doujindesu section needs credentials)

## Disclaimer

This library is for **educational and personal-use purposes only**. The scraped sources are third-party websites; this project is not affiliated with, endorsed by, or connected to any of them. You are responsible for:

- Complying with the terms of service of the sites you scrape
- Complying with the laws of your jurisdiction regarding adult content
- Respecting rate limits — the built-in caching already reduces request volume significantly

## License

[MIT](LICENSE) © Hengki
