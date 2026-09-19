// Doujindesu Pure Parser & Data Normalizer
// 100% pure transformation functions: JSON/HTML payload -> clean normalized DTOs.
// No network I/O, no caching side-effects, no global state.

import { safeHttpUrl } from '../../security.js';

/**
 * Normalizes a list item payload into a standard MangaListItem DTO.
 * @param {object} item - Raw manga item from API
 * @param {string} [baseUrl=''] - Fallback base URL for relative cover images
 * @returns {object|null} Normalized manga list item
 */
export function mapListItem(item, baseUrl = '') {
  if (!item || typeof item !== 'object') return null;
  const latestChapter = Array.isArray(item.chapters) ? item.chapters[0] : null;
  return {
    title: typeof item.title === 'string' ? item.title.slice(0, 500) : '',
    slug: typeof item.slug === 'string' ? item.slug.slice(0, 200) : '',
    thumb:
      safeHttpUrl(item.cover_url) ||
      (typeof item.cover_url === 'string' && item.cover_url.startsWith('/') && baseUrl
        ? `${baseUrl}${item.cover_url}`
        : ''),
    rating: item.rating != null ? item.rating : null,
    type: typeof item.type === 'string' ? item.type.slice(0, 50) : 'manga',
    status: typeof item.status === 'string' ? item.status.slice(0, 50) : null,
    latestChapter:
      latestChapter && latestChapter.chapter_number != null
        ? latestChapter.chapter_number
        : null,
  };
}

/**
 * Decode HTML entities twice then strip tags to produce clean plain text.
 * @param {string} html - Raw synopsis HTML or encoded text
 * @returns {string} Cleaned synopsis text
 */
export function cleanSynopsis(html) {
  if (!html) return '';
  const decodeEntities = (s) =>
    s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');
  let decoded = decodeEntities(html);
  if (decoded.includes('&lt;') || decoded.includes('&gt;') || decoded.includes('&quot;')) {
    decoded = decodeEntities(decoded);
  }
  return decoded
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Normalizes raw detail payload into MangaDetail DTO.
 * @param {object} detail - Raw manga detail object from API
 * @param {string} [baseUrl=''] - Fallback base URL for relative cover images
 * @returns {object|null}
 */
export function mapDetail(detail, baseUrl = '') {
  if (!detail || typeof detail !== 'object') return null;

  const genres = (Array.isArray(detail.manga_genres) ? detail.manga_genres : [])
    .map((g) => ({
      name: typeof g?.genres?.name === 'string' ? g.genres.name.slice(0, 100) : '',
      slug: typeof g?.genres?.slug === 'string' ? g.genres.slug.slice(0, 100) : '',
    }))
    .filter((g) => g.name);

  const chapters = (Array.isArray(detail.chapters) ? detail.chapters : [])
    .map((ch) => ({
      id: ch?.id,
      number: ch?.chapter_number,
      title: typeof ch?.title === 'string' ? ch.title.slice(0, 300) : '',
      date: ch?.created_at ? new Date(ch.created_at).toLocaleDateString('id-ID') : '',
    }))
    .filter((ch) => ch.id != null);

  return {
    title: typeof detail.title === 'string' ? detail.title.slice(0, 500) : '',
    altTitle: typeof detail.alt_titles === 'string' ? detail.alt_titles.slice(0, 500) : null,
    thumb:
      safeHttpUrl(detail.cover_url) ||
      (typeof detail.cover_url === 'string' && detail.cover_url.startsWith('/') && baseUrl
        ? `${baseUrl}${detail.cover_url}`
        : ''),
    rating: detail.rating != null ? detail.rating : null,
    status: typeof detail.status === 'string' ? detail.status.slice(0, 50) : null,
    type: typeof detail.type === 'string' ? detail.type.slice(0, 50) : 'manga',
    synopsis: cleanSynopsis(detail.description),
    author:
      typeof detail.author === 'string'
        ? detail.author.slice(0, 200)
        : typeof detail.author?.name === 'string'
          ? detail.author.name.slice(0, 200)
          : null,
    artist:
      typeof detail.artist === 'string'
        ? detail.artist.slice(0, 200)
        : typeof detail.artist?.name === 'string'
          ? detail.artist.name.slice(0, 200)
          : null,
    genres,
    chapters,
    views: Number.isFinite(detail.views) ? detail.views : 0,
  };
}

/**
 * Normalizes raw genres list into array of genre objects sorted by count descending.
 * @param {object|Array} data - Raw genres API response
 * @returns {Array<{slug: string, name: string, count: number}>}
 */
export function mapGenres(data) {
  const list = Array.isArray(data) ? data : data?.data || data?.results || [];
  return list
    .map((g) => ({
      slug: g.slug,
      name: g.name,
      count: g.manga_count || g._count?.manga_genres || 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Normalizes chapter payload into ChapterImages DTO with safe URLs.
 * @param {object} chapter - Raw chapter object from API
 * @returns {{images: string[], mangaSlug: string, mangaTitle: string, title: string, number: number|null}}
 */
export function mapChapterImages(chapter) {
  if (!chapter || typeof chapter !== 'object' || !chapter.content_urls || chapter.content_urls.length === 0) {
    throw new Error('This chapter has no images yet');
  }
  const images = (Array.isArray(chapter.content_urls) ? chapter.content_urls : [])
    .map((u) => safeHttpUrl(u))
    .filter(Boolean);
  if (images.length === 0) {
    throw new Error('This chapter has no images yet');
  }
  return {
    images,
    mangaSlug: typeof chapter.manga_slug === 'string' ? chapter.manga_slug.slice(0, 200) : '',
    mangaTitle: typeof chapter.manga_title === 'string' ? chapter.manga_title.slice(0, 500) : '',
    title:
      typeof chapter.title === 'string'
        ? chapter.title.slice(0, 500)
        : `Chapter ${chapter.chapter_number || ''}`.trim(),
    number: chapter.chapter_number || null,
  };
}
