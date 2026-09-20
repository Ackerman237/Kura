/**
 * Media Utilities (Noctra Blueprint)
 * Real covers, thumbnails, and reader pages are preserved directly without SVG placeholder substitution.
 */

export const PLACEHOLDERS = {
  cover: '',
  thumbnail: '',
  page: '',
};

export function maskCover(url) {
  return url || '';
}

export function maskThumbnail(url) {
  return url || '';
}

export function maskPages(pages) {
  return pages || [];
}

/**
 * Manga List response (returns raw real media data)
 */
export function maskMangaList(data) {
  return data;
}

/**
 * Manga Detail response (returns raw real media data)
 */
export function maskMangaDetail(manga) {
  return manga;
}

/**
 * Video List response (returns raw real media data)
 */
export function maskVideoList(data) {
  return data;
}

/**
 * Video Detail response (returns raw real media data)
 */
export function maskVideoDetail(video) {
  return video;
}
