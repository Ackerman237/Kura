// doujin-scraper — raw scraping modules for doujin/hentai/porn content sources.
// Framework-agnostic, zero dependencies. Works in Node.js >= 18.17, Bun,
// serverless functions, or any JS runtime with global fetch.
//
// Usage:
//   import { scrapeMangaList, scrapeHentaiList } from 'doujin-scraper';
//
// Each source can be imported standalone:
//   import { scrapeNekoList } from 'doujin-scraper/nekopoi';

export {
  scrapeMangaList,
  scrapeGenres,
  scrapeMangaDetail,
  scrapeChapterImages,
  searchManga,
  configureDoujin,
  buildSourceUrl,
} from './doujindesu.js';

export {
  scrapeNekoList,
  scrapeNekoCategory,
  scrapeNekoCategories,
  scrapeNekoDetail,
  scrapeNekoGenres,
  scrapeNekoGenre,
  scrapeNekoRelated,
  scrapeNekoRandomSlug,
  configureNeko,
} from './nekopoi.js';

export {
  scrapeHentaiList,
  scrapeHentaiDetail,
  scrapeHentaiGenre,
  scrapeHentaiGenres,
  scrapeHentaiSeries,
  scrapeHentaiSeriesDetail,
  scrapeHentaiRandomSlug,
  scrapeHentaiTrending,
  scrapeHentaiMostViewed,
  scrapeHentaiRelated,
  configureHentai,
} from './hentaitv.js';

export {
  scrapeEpornerList,
  scrapeEpornerDetail,
  scrapeEpornerCategories,
  scrapeEpornerCategory,
  scrapeEpornerListingPage,
  scrapeEpornerRelated,
  scrapeEpornerRandomId,
  configureEporner,
} from './eporner.js';

export {
  getCache,
  setCache,
  clearCache,
  cacheSize,
  MAX_CACHE_ENTRIES,
  MAX_KEY_LENGTH,
} from './cache.js';
export {
  safeHttpUrl,
  stripHtml,
  sanitizeUrl,
  isSafeExternalUrl,
  InvalidInputError,
  assertSlug,
  assertInt,
  assertQuery,
} from './security.js';
export {
  safeFetch,
  createSafeDispatcher,
  UnsafeUrlError,
  readTextLimited,
  readJsonLimited,
  ResponseTooLargeError,
  MAX_RESPONSE_BYTES_HTML,
  MAX_RESPONSE_BYTES_JSON,
} from './http.js';
export {
  isSafeProxyUrl,
  fetchThroughProxy,
  warmUpProxies,
  getProxyStats,
} from './proxy.js';
export {
  RateLimiter,
  UpstreamThrottler,
  getClientIp,
  generalLimiter,
  searchLimiter,
  imageProxyLimiter,
  upstreamThrottler,
} from './rate-limiter.js';




