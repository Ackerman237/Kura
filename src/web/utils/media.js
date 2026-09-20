/**
 * Media extraction and proxy resolution helpers
 */

export const PLACEHOLDERS = {
  COVER: '/assets/placeholders/placeholder-cover.svg',
  THUMBNAIL: '/assets/placeholders/placeholder-thumbnail.svg',
  PAGE: '/assets/placeholders/placeholder-page.svg',
};

/**
 * Extract the best available cover URL from a comic or chapter record
 */
export function getComicCover(comic) {
  if (!comic || typeof comic !== 'object') return PLACEHOLDERS.COVER;
  return (
    comic.mangaCover ||
    comic.thumb ||
    comic.cover ||
    comic.cover_url ||
    comic.image ||
    comic.thumbnail ||
    PLACEHOLDERS.COVER
  );
}

/**
 * Extract thumbnail URL from a video record
 */
export function getVideoThumb(video) {
  if (!video || typeof video !== 'object') return PLACEHOLDERS.THUMBNAIL;
  return (
    video.thumb ||
    video.thumbnail ||
    video.poster ||
    video.image ||
    PLACEHOLDERS.THUMBNAIL
  );
}

/**
 * Safely format an external image URL through the local image proxy
 */
export function resolveProxyUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('/api/image-proxy') || url.startsWith('/assets/')) return url;
  if (url.startsWith('http')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
