import { ref, computed, onMounted } from 'vue';

const BOOKMARKS_STORAGE_KEY = 'kura_bookmarks';

export function useBookmarks() {
  const bookmarkedComics = ref([]);

  const loadBookmarks = () => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      bookmarkedComics.value = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
      bookmarkedComics.value = [];
    }
  };

  const saveBookmarks = () => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedComics.value));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  };

  const bookmarkedIds = computed(() =>
    bookmarkedComics.value.map((c) => c.id || c.slug)
  );

  const isBookmarked = (idOrSlug) => {
    if (!idOrSlug) return false;
    return bookmarkedIds.value.includes(idOrSlug);
  };

  const toggleBookmark = (comic) => {
    if (!comic) return false;
    const id = comic.id || comic.slug;
    const idx = bookmarkedComics.value.findIndex((c) => (c.id || c.slug) === id);

    let result = false;
    if (idx >= 0) {
      bookmarkedComics.value.splice(idx, 1);
      result = false;
    } else {
      bookmarkedComics.value.push({
        id,
        slug: comic.slug || id,
        title: comic.title,
        altTitle: comic.altTitle || comic.native_title,
        thumb: comic.thumb || comic.cover || comic.cover_url || comic.image,
        type: comic.type || 'manga',
        status: comic.status,
        rating: comic.rating || comic.score,
        latestChapter: comic.latestChapter || comic.latest_chapter,
        genres: comic.genres || [],
        savedAt: new Date().toISOString(),
      });
      result = true;
    }
    saveBookmarks();
    return result;
  };

  onMounted(() => {
    loadBookmarks();
  });

  return {
    bookmarkedComics,
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    loadBookmarks,
  };
}
