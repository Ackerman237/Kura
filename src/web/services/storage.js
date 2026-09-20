/**
 * Kura Storage Service
 * LocalStorage management for Reading Progress, Bookmarks, and Settings.
 */

const STORAGE_KEYS = {
  READING_PROGRESS: 'kura_reading_progress',
  BOOKMARKS: 'kura_bookmarks',
  SETTINGS: 'kura_settings',
};

// ---------------------------------------------------------------------------
// Reading Progress
// ---------------------------------------------------------------------------
export function getReadingProgress(mangaSlug) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    const store = raw ? JSON.parse(raw) : {};
    return mangaSlug ? store[mangaSlug] || null : store;
  } catch (e) {
    console.warn('[Storage] Failed to get reading progress', e);
    return null;
  }
}

export function saveReadingProgress(mangaSlug, { chapterId, chapterNumber, pageIndex = 1, title = '' }) {
  if (!mangaSlug) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    const store = raw ? JSON.parse(raw) : {};
    store[mangaSlug] = {
      mangaSlug,
      title,
      chapterId,
      chapterNumber,
      pageIndex,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(store));
  } catch (e) {
    console.warn('[Storage] Failed to save reading progress', e);
  }
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------
export function getBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isBookmarked(id) {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.id === id);
}

export function toggleBookmark(item) {
  try {
    const bookmarks = getBookmarks();
    const index = bookmarks.findIndex((b) => b.id === item.id);
    let updated;
    if (index >= 0) {
      updated = bookmarks.filter((b) => b.id !== item.id);
    } else {
      updated = [
        {
          id: item.id || item.slug,
          title: item.title,
          thumb: item.thumb,
          type: item.type || 'manga',
          category: item.category || 'manga',
          savedAt: new Date().toISOString(),
        },
        ...bookmarks,
      ];
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    return index < 0; // returns true if added, false if removed
  } catch (e) {
    console.warn('[Storage] Failed to toggle bookmark', e);
    return false;
  }
}
