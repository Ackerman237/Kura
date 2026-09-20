<script setup>
import { ref, computed, onMounted } from 'vue';
import { ArrowLeft, Bookmark, Share2 } from 'lucide-vue-next';
import { getReadingProgress, toggleBookmark, isBookmarked } from '../services/storage.js';
import { downloadChapterForOffline, isChapterOffline, exportChapterAsCbz } from '../services/offline.js';
import { useDownloadQueue, buildFilename } from '../services/download.js';
import { useToast } from '../composables/useToast.js';
import DetailHeroBillboard from '../components/manga-detail/DetailHeroBillboard.vue';
import DetailSynopsis from '../components/manga-detail/DetailSynopsis.vue';
import DetailChapterList from '../components/manga-detail/DetailChapterList.vue';

const props = defineProps({
  manga: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['back', 'select-chapter', 'toggle-bookmark', 'open-queue']);

const bookmarked = ref(false);
const offlineMap = ref({});

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const slug = props.manga.slug || props.manga.id;
  bookmarked.value = isBookmarked(slug);

  const list = props.manga.chapters || props.manga.chapterList || [];
  for (const ch of list.slice(0, 30)) {
    const id = ch.id || ch.slug;
    if (id) {
      offlineMap.value[id] = await isChapterOffline(id);
    }
  }
});

const coverImage = computed(() => {
  return (
    props.manga.thumb ||
    props.manga.cover ||
    props.manga.cover_url ||
    props.manga.image ||
    ''
  );
});

const readingProgress = computed(() => {
  return getReadingProgress(props.manga.slug || props.manga.id);
});

const chapters = computed(() => {
  return props.manga.chapters || props.manga.chapterList || [];
});

const firstChapter = computed(() => {
  if (!chapters.value.length) return null;
  return chapters.value[chapters.value.length - 1];
});

const continueChapter = computed(() => {
  if (!readingProgress.value) return null;
  return chapters.value.find((ch) => (ch.id || ch.slug) === readingProgress.value.chapterId);
});

const handleToggleBookmark = () => {
  bookmarked.value = toggleBookmark({
    id: props.manga.slug || props.manga.id,
    slug: props.manga.slug,
    title: props.manga.title,
    thumb: coverImage.value,
    type: props.manga.type,
  });
  emit('toggle-bookmark', props.manga);
};

const { addMangaDownload, settings } = useDownloadQueue();

const toast = useToast();

const handleDownloadChapter = async (chapter) => {
  const chapterId = chapter.id || chapter.slug;
  if (!chapterId) return;

  try {
    await downloadChapterForOffline({
      manga: props.manga,
      chapter,
    });
    offlineMap.value[chapterId] = true;
    toast.success(
      `Bab "${chapter.title || chapter.chapterNumber}" berhasil diunduh dan tersimpan di IndexedDB browser untuk dibaca offline!`,
      'Unduhan Berhasil'
    );
  } catch (err) {
    toast.error(`Gagal mengunduh bab: ${err.message}`);
  }
};

const handleExportCbz = (chapter) => {
  const chapterId = chapter.id || chapter.slug;
  if (!chapterId) return;

  const chNum = chapter.chapterNumber || chapter.number || '1';
  const meta = {
    manga: props.manga.title,
    chapter: chNum,
    title: chapter.title || '',
    year: new Date().getFullYear(),
    date: new Date().toISOString().slice(0, 10),
  };

  const template = settings?.value?.mangaTemplate || '{manga} - Ch.{chapter_padded}';
  const filename = `${buildFilename(template, meta)}.cbz`;

  addMangaDownload({
    filename,
    meta: {
      title: chapter.title || `Chapter ${chNum}`,
      manga: props.manga.title,
      chapter: chNum,
      type: 'manga-chapter',
    },
    exportFn: async (onProgress) => {
      await exportChapterAsCbz(
        chapterId,
        {
          manga: props.manga,
          chapter,
          title: chapter.title || '',
          filename,
        },
        onProgress
      );
      offlineMap.value[chapterId] = true;
    },
  });

  emit('open-queue');
};

const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: props.manga.title,
      url: window.location.href,
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Tautan komik berhasil disalin ke clipboard!');
  }
};
</script>

<template>
  <div class="kura-manga-detail-view">
    <!-- 1. Sticky Nav Sub-Header -->
    <div class="detail-nav-bar">
      <button type="button" class="back-btn" @click="emit('back')">
        <ArrowLeft :size="16" />
        <span>Kembali ke Katalog</span>
      </button>

      <div class="nav-actions">
        <button
          type="button"
          class="nav-action-btn"
          :class="{ 'is-bookmarked': bookmarked }"
          :title="bookmarked ? 'Hapus Bookmark' : 'Simpan ke Bookmark'"
          @click="handleToggleBookmark"
        >
          <Bookmark :size="15" :fill="bookmarked ? 'currentColor' : 'none'" />
          <span>{{ bookmarked ? 'Tersimpan' : 'Bookmark' }}</span>
        </button>

        <button type="button" class="nav-action-btn" title="Bagikan Komik" @click="handleShare">
          <Share2 :size="15" />
        </button>
      </div>
    </div>

    <!-- 2. Hero Billboard (Cover Art, Flags, Stats, CTAs) -->
    <DetailHeroBillboard
      :manga="manga"
      :cover-image="coverImage"
      :is-privacy-mode="isPrivacyMode"
      :bookmarked="bookmarked"
      :reading-progress="readingProgress"
      :first-chapter="firstChapter"
      :continue-chapter="continueChapter"
      @select-chapter="(payload) => emit('select-chapter', payload)"
      @toggle-bookmark="handleToggleBookmark"
    />

    <!-- 3. Synopsis Section -->
    <DetailSynopsis :synopsis="manga.synopsis" />

    <!-- 4. Chapter List Section -->
    <DetailChapterList
      :chapters="chapters"
      :manga="manga"
      :reading-progress="readingProgress"
      :offline-map="offlineMap"
      @select-chapter="(payload) => emit('select-chapter', payload)"
      @download-chapter="handleDownloadChapter"
      @export-cbz="handleExportCbz"
    />
  </div>
</template>

<style scoped>
.kura-manga-detail-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.detail-nav-bar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(14, 15, 18, 0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--kura-text-muted, #94a3b8);
  font-family: var(--kura-font-sans, sans-serif);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: var(--kura-accent, #e5a93c);
  transform: translateX(-2px);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-action-btn:hover {
  border-color: #ffffff;
  color: #ffffff;
}

.nav-action-btn.is-bookmarked {
  color: var(--kura-accent, #e5a93c);
  border-color: rgba(229, 169, 60, 0.4);
}
</style>
