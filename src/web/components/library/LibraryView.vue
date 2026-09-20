<script setup>
import { ref, onMounted } from 'vue';
import { History, HardDrive, Bookmark } from 'lucide-vue-next';
import { getReadingProgress, getBookmarks, toggleBookmark } from '../../services/storage.js';
import { getAllOfflineChapters, deleteOfflineChapter } from '../../services/offline.js';
import LibraryHistoryTab from './tabs/LibraryHistoryTab.vue';
import LibraryOfflineTab from './tabs/LibraryOfflineTab.vue';
import LibraryBookmarksTab from './tabs/LibraryBookmarksTab.vue';

const emit = defineEmits([
  'readManga',
  'readOfflineChapter',
  'openVideo',
  'selectMangaDetail',
  'openLocalManga',
  'openLocalVideo',
]);

const activeTab = ref('progress'); // 'progress' | 'offline' | 'bookmarks'
const readingProgressList = ref([]);
const offlineChapters = ref([]);
const bookmarksList = ref([]);

const loadData = async () => {
  try {
    const progressStore = getReadingProgress() || {};
    readingProgressList.value = Object.values(progressStore).sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );
    offlineChapters.value = await getAllOfflineChapters();
    bookmarksList.value = getBookmarks();
  } catch (err) {
    console.error('Failed to load library data:', err);
  }
};

const handleDeleteOffline = async (ch) => {
  if (confirm(`Hapus unduhan bab "${ch.chapterTitle || ch.chapterNumber}" dari penyimpanan lokal?`)) {
    await deleteOfflineChapter(ch.chapterId);
    offlineChapters.value = await getAllOfflineChapters();
  }
};

const handleRemoveBookmark = (item) => {
  toggleBookmark(item);
  bookmarksList.value = getBookmarks();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="kura-library-view container">
    <!-- Header & Tab Navigation -->
    <header class="library-header">
      <div>
        <h2 class="section-title">Pustaka Pribadi</h2>
        <p class="section-subtitle">Kelola riwayat bacaan, komik tersimpan offline, dan konten favorit Anda.</p>
      </div>

      <nav class="sub-tabs-pill">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'progress' }"
          @click="activeTab = 'progress'"
        >
          <History :size="14" />
          <span>Riwayat ({{ readingProgressList.length }})</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'offline' }"
          @click="activeTab = 'offline'"
        >
          <HardDrive :size="14" />
          <span>Offline ({{ offlineChapters.length }})</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'bookmarks' }"
          @click="activeTab = 'bookmarks'"
        >
          <Bookmark :size="14" />
          <span>Favorit ({{ bookmarksList.length }})</span>
        </button>
      </nav>
    </header>

    <!-- Tab Viewports -->
    <LibraryHistoryTab
      v-if="activeTab === 'progress'"
      :items="readingProgressList"
      @select-comic="(comic) => emit('selectMangaDetail', comic)"
    />

    <LibraryOfflineTab
      v-else-if="activeTab === 'offline'"
      :chapters="offlineChapters"
      @read-chapter="(ch) => emit('readOfflineChapter', { chapter: ch, manga: { slug: ch.mangaSlug, title: ch.title } })"
      @delete-chapter="handleDeleteOffline"
      @open-local-manga="(payload) => emit('openLocalManga', payload)"
      @open-local-video="(payload) => emit('openLocalVideo', payload)"
    />

    <LibraryBookmarksTab
      v-else-if="activeTab === 'bookmarks'"
      :bookmarks="bookmarksList"
      @select-comic="(comic) => emit('selectMangaDetail', comic)"
      @remove-bookmark="handleRemoveBookmark"
    />
  </div>
</template>

<style scoped>
.kura-library-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 24px;
  padding-bottom: 56px;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  padding-bottom: 16px;
}

.section-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.section-subtitle {
  font-size: 0.84rem;
  color: var(--kura-text-muted, #94a3b8);
  margin: 4px 0 0;
}

.sub-tabs-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-pill, 9999px);
  padding: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: var(--radius-pill, 9999px);
  background: transparent;
  border: none;
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: #ffffff;
}

.tab-btn.active {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}
</style>
