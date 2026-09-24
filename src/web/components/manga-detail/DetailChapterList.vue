<script setup>
import { ref, computed } from 'vue';
import { Search, ArrowUpDown, Clock, Download, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps({
  chapters: {
    type: Array,
    default: () => [],
  },
  manga: {
    type: Object,
    required: true,
  },
  readingProgress: {
    type: Object,
    default: null,
  },
  offlineMap: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['select-chapter', 'download-chapter', 'export-cbz']);

const searchQuery = ref('');
const sortAsc = ref(false); // default: newest first

function getChapterNum(ch) {
  if (!ch) return 0;
  if (ch.number != null && !isNaN(Number(ch.number))) return Number(ch.number);
  if (ch.chapterNumber != null && !isNaN(Number(ch.chapterNumber))) return Number(ch.chapterNumber);
  const m = String(ch.title || '').match(/(?:chapter|ch\.?|ep\.?)\s*(\d+(?:\.\d+)?)/i)
    || String(ch.slug || ch.id || '').match(/(?:chapter|ch-?)(\d+(?:\.\d+)?)/i);
  if (m) return parseFloat(m[1]);
  return 0;
}

const filteredChapters = computed(() => {
  let list = props.chapters;
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((ch) =>
      (ch.title && ch.title.toLowerCase().includes(q)) ||
      (ch.chapterNumber && String(ch.chapterNumber).includes(q)) ||
      (ch.id && String(ch.id).toLowerCase().includes(q))
    );
  }
  return [...list].sort((a, b) => {
    const na = getChapterNum(a);
    const nb = getChapterNum(b);
    return sortAsc.value ? na - nb : nb - na;
  });
});

const isCurrentReading = (ch) => {
  if (!props.readingProgress) return false;
  return (ch.id || ch.slug) === props.readingProgress.chapterId;
};
</script>

<template>
  <div class="detail-chapters-section container">
    <!-- Chapter Header & Search/Sort Bar -->
    <div class="chapters-header-bar">
      <div class="header-left">
        <h3 class="section-heading">Daftar Bab / Chapter</h3>
        <span class="chapter-count-tag">{{ chapters.length }} Bab Tersedia</span>
      </div>

      <div class="header-controls">
        <!-- Live Search Box -->
        <div class="chapter-search-box">
          <Search :size="14" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari bab..."
            class="search-input"
          />
        </div>

        <!-- Sort Toggle Button -->
        <button
          type="button"
          class="sort-toggle-btn"
          :title="sortAsc ? 'Urutan: Terlama dahulu' : 'Urutan: Terbaru dahulu'"
          @click="sortAsc = !sortAsc"
        >
          <ArrowUpDown :size="14" />
          <span>{{ sortAsc ? 'Terlama' : 'Terbaru' }}</span>
        </button>
      </div>
    </div>

    <!-- Chapter Grid Rows -->
    <div v-if="filteredChapters.length === 0" class="empty-chapters">
      <p>Tidak ada chapter yang cocok dengan pencarian "{{ searchQuery }}".</p>
    </div>

    <div v-else class="chapters-grid">
      <div
        v-for="ch in filteredChapters"
        :key="ch.id || ch.slug"
        class="chapter-card-row"
        :class="{ 'reading-active': isCurrentReading(ch) }"
        @click="emit('select-chapter', { chapter: ch, manga })"
      >
        <div class="chapter-info-left">
          <span class="chapter-num-tag">
            Ch. {{ ch.chapterNumber || ch.number || getChapterNum(ch) || '1' }}
          </span>
          <div class="chapter-title-wrap">
            <span class="chapter-name" :title="ch.title || `Chapter ${ch.chapterNumber}`">
              {{ ch.title || `Chapter ${ch.chapterNumber || ''}` }}
            </span>
            <span v-if="ch.date || ch.releasedAt" class="chapter-date">
              <Clock :size="11" />
              {{ ch.date || ch.releasedAt }}
            </span>
          </div>
        </div>

        <div class="chapter-actions-right">
          <span v-if="isCurrentReading(ch)" class="reading-indicator-pill">
            Sedang Dibaca
          </span>

          <button
            type="button"
            class="download-action-btn"
            :class="{ 'is-offline': offlineMap[ch.id || ch.slug] }"
            :title="offlineMap[ch.id || ch.slug] ? 'Sudah Tersimpan Offline' : 'Unduh Bab untuk Dibaca Offline'"
            @click.stop="emit('download-chapter', ch)"
          >
            <component :is="offlineMap[ch.id || ch.slug] ? CheckCircle2 : Download" :size="14" />
          </button>

          <button
            type="button"
            class="download-action-btn cbz-btn"
            title="Ekspor Bab ini sebagai Berkas .CBZ"
            @click.stop="emit('export-cbz', ch)"
          >
            <span class="cbz-tag">CBZ</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-chapters-section {
  padding-top: 24px;
  padding-bottom: 56px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapters-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-heading {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.chapter-count-tag {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.12);
  border: 1px solid rgba(229, 169, 60, 0.25);
  padding: 2px 8px;
  border-radius: var(--radius-pill, 9999px);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapter-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--kura-text-muted, #94a3b8);
  pointer-events: none;
}

.search-input {
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-pill, 9999px);
  color: #ffffff;
  font-size: 0.76rem;
  padding: 6px 12px 6px 30px;
  width: 140px;
  transition: width 0.2s ease, border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  width: 190px;
  border-color: var(--kura-accent, #e5a93c);
}

.sort-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-secondary, #cbd5e1);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.sort-toggle-btn:hover {
  border-color: var(--kura-accent, #e5a93c);
  color: #ffffff;
}

.chapters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

@media (min-width: 768px) {
  .chapters-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.chapter-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: transparent;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.chapter-card-row:hover {
  background: var(--kura-surface, #14151a);
  border-color: var(--kura-accent, #e5a93c);
}

.chapter-card-row.reading-active {
  border-color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.08);
}

.chapter-info-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.chapter-num-tag {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--kura-accent, #e5a93c);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(229, 169, 60, 0.3);
  padding: 3px 7px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
}

.chapter-title-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.chapter-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--kura-text-primary, #ffffff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  color: var(--kura-text-muted, #94a3b8);
}

.chapter-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.reading-indicator-pill {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.15);
  padding: 2px 6px;
  border-radius: 3px;
}

.download-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-muted, #94a3b8);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.download-action-btn:hover {
  border-color: #ffffff;
  color: #ffffff;
}

.download-action-btn.is-offline {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.4);
  background: rgba(52, 211, 153, 0.1);
}

.cbz-btn {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  width: auto;
  padding: 0 6px;
  color: var(--kura-accent, #e5a93c);
  border-color: rgba(229, 169, 60, 0.3);
}

.cbz-btn:hover {
  background: rgba(229, 169, 60, 0.15);
  border-color: var(--kura-accent, #e5a93c);
  color: #ffffff;
}

.cbz-tag {
  letter-spacing: 0.04em;
}

.empty-chapters {
  padding: 32px;
  text-align: center;
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.82rem;
}
</style>
