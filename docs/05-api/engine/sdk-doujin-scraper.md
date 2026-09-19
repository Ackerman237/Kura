# doujin-scraper SDK Reference (Original Engine)

> [!NOTE]
> Berkas ini mengarsipkan dokumentasi asli dari library data-collection engine `doujin-scraper`, yang awalnya dibuat oleh [Hengki (@kyy0887)](https://github.com/kyy0887/doujin-scraper). Di dalam ekosistem **Kura (蔵)**, modul ini berfungsi sebagai *Core Data Access Layer* (backend scraper engine).

---

Standalone data-collection modules for manga / video cataloging sources.
Zero-dependency ESM — just `fetch`, JSON, and hardened parsing. Runs on any
JS runtime with global fetch: Node ≥ 18.17, Bun, Deno, and serverless functions.

## Features

- **Zero dependencies** — pure Node.js `fetch`, no transitive deps, no build step
- **Modular** — import one source or all of them; every source is self-contained
- **Security built-in** — SSRF protection, URL scheme filtering (`javascript:`, `data:`, ...), HTML stripping
- **TTL caching** — in-memory cache with per-source TTLs; pluggable for Redis/DB backends
- **Hardened parsing** — regex/JSON-LD/RSC parsers that survive markup changes, dedupe, and discard ads/tracking
- **Configurable** — base URLs, timeouts, user agents, and credentials via env vars or runtime config
- **Tree-shakeable ESM** — import only what you need

## Supported sources

| Codename | Type | Auth | Export path |
| --- | --- | --- | --- |
| manga | Manga / doujinshi / manhwa catalog | API secret + salt | `doujin-scraper/doujindesu` |
| neko | Video posts (subbed, 2D/3D, cosplay) | none | `doujin-scraper/nekopoi` |
| htv | Streaming 2D animation | none | `doujin-scraper/hentaitv` |
| tube | Tube videos | none | `doujin-scraper/eporner` |

## Requirements

- Node.js **≥ 18.17** (global `fetch` required) — or any runtime that provides `fetch`
- **manga source only**: valid `DOUJIN_APP_SECRET` and `DOUJIN_SALT` credentials

## Installation

```bash
npm install doujin-scraper
```

Or from GitHub:

```bash
npm install github:kyy0887/doujin-scraper
```

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

## Configuration

### manga source credentials (required)

The manga API rejects requests without credentials. Set them via env vars:

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
| `DOUJIN_APP_SECRET` | — | manga API app secret (**required**) |
| `DOUJIN_SALT` | — | key-rotation salt (**required**) |
| `DOUJIN_BASE_URL` | set in `.env.example` | manga base URL |
| `DOUJIN_USER_AGENT` | Chrome UA | manga user agent |
| `DOUJIN_TIMEOUT_MS` | `30000` | request timeout |
| `NEKO_BASE_URL` | set in `.env.example` | neko base URL |
| `NEKO_TIMEOUT_MS` | `30000` | request timeout |
| `HENTAI_BASE_URL` | set in `.env.example` | htv base URL |
| `HENTAI_TIMEOUT_MS` | `30000` | request timeout |
| `EPORNER_BASE_URL` | set in `.env.example` | tube HTML base URL |
| `EPORNER_API_BASE` | set in `.env.example` | tube API base URL |
| `EPORNER_TIMEOUT_MS` | `30000` | request timeout |

Runtime equivalents: `configureDoujin()`, `configureNeko()`, `configureHentai()`, `configureEporner()` — each accepts the relevant subset (`baseUrl`, `userAgent`, `timeoutMs`, `cacheTtl`, and `appSecret`/`salt` for the manga source).

## API reference

### manga — `doujin-scraper/doujindesu`

| Function | Description |
| --- | --- |
| `scrapeMangaList({ page, query, type, genre, sort, limit })` | Paginated list with filters. `type`: `manga` \| `doujinshi` \| `manhwa`. `sort`: `latest_chapter` \| `views` \| `rating`. **Note:** the API ignores `page` — the module translates it to `offset` so pagination actually works |
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

### neko — `doujin-scraper/nekopoi`

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

### htv — `doujin-scraper/hentaitv`

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

### tube — `doujin-scraper/eporner`

| Function | Description |
| --- | --- |
| `scrapeEpornerList({ page, query, order })` | Browse/search `{ videos, hasNext, total }` (28/page). `order`: `top-rated` |
| `scrapeEpornerDetail(id)` | Detail: embedUrl, **direct mp4 `src[]` per quality** (falls back to HTML parsing), description |
| `scrapeEpornerCategories()` | Category list |
| `scrapeEpornerCategory(slug, page)` | Videos by category `{ videos, hasNext }` |
| `scrapeEpornerListingPage(kind, page)` | `top-rated` or `most-viewed` listings |
| `scrapeEpornerRelated(id, { tags, title, limit })` | Recommendations (tag-based search first) |
| `scrapeEpornerRandomId()` | Random video id |

## Caching

All modules use a shared in-memory TTL cache (`src/cache.js`):

- Lists and details: **10 min** TTL (manga: 1 h)
- Genres/series/categories: **1 h**
- Trending / most-viewed: **30 min – 1 h**
- Related recommendations: **2 min** (stays fresh, like YouTube)

Exports:

```js
import { getCache, setCache, clearCache, cacheSize } from 'doujin-scraper';

clearCache();          // drop everything
cacheSize();           // number of entries
```

> **Multi-instance deployments**: the default cache is per-process. For serverless/edge deployments with many instances, override `getCache`/`setCache` with your own Redis/Upstash-backed store — the modules call these two functions exclusively.

## Security

All data returned by these modules passes through `src/security.js`:

- `safeHttpUrl()` — forces `http(s)://`, rejects `javascript:`, `data:`, `vbscript:`, relative paths
- `isSafeExternalUrl()` — SSRF protection: rejects localhost, private/loopback/link-local IPs, non-standard ports, and DNS rebinding targets
- `stripHtml()` — removes tags/scripts/styles from external text
- neko players are allowlisted by hostname; ad/tracking iframes are dropped
- manga synopsis HTML is double-decoded and cleaned (the API double-encodes entities)

Use these utilities in your own UI too:

```js
import { safeHttpUrl, stripHtml, isSafeExternalUrl } from 'doujin-scraper';
```

## Error handling

All functions throw plain `Error`s with descriptive messages:

- `HTTP 404 for /api/manga/xxx` — upstream returned an error status
- `Video xxx not found` — no such item on the source
- `Failed to decrypt server response` — wrong/missing manga credentials
- Invalid input (bad slug/id/genre) throws `Error('Invalid ...')` immediately

Network timeouts abort after the configured `timeoutMs` (default 30 s) via `AbortSignal.timeout`.

## Testing

```bash
npm test
```

## Disclaimer

This library is for **educational and personal-use purposes only**. The referenced sources are third-party websites; this project is not affiliated with, endorsed by, or connected to any of them. You are responsible for:

- Complying with the terms of service of the sites you access
- Complying with the laws of your jurisdiction regarding the accessed content
- Respecting rate limits — the built-in caching already reduces request volume significantly

**No liability.** The authors and maintainers of this project shall not be held responsible for any loss, damage, claim, or expense — direct or indirect, including but not limited to data loss, account suspension, legal consequences, or any other harm — arising from the use, misuse, or inability to use this library. Use it entirely at your own risk.

## Original License

[MIT](LICENSE) © Hengki
