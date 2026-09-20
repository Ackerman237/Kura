<script setup>
import { ref, computed } from 'vue';
import { Layers, ChevronRight, Grid, List } from 'lucide-vue-next';
import ComicCard from '../common/ComicCard.vue';
import ComicSkeleton from '../common/ComicSkeleton.vue';

const props = defineProps({
  comics: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  bookmarkedIds: {
    type: Array,
    default: () => [],
  },
});

import { fetchMangaList } from '../../services/api.js';

const emit = defineEmits(['select-comic', 'toggle-bookmark', 'navigate-catalog']);

const selectedType = ref('all');
const viewMode = ref('grid'); // 'grid' | 'list'
const isTypeLoading = ref(false);
const remoteTypeCache = ref({});

const typeFilters = [
  { id: 'all', label: 'Semua Tipe' },
  { id: 'manga', label: 'Manga (JP)' },
  { id: 'manhwa', label: 'Manhwa (KR)' },
  { id: 'manhua', label: 'Manhua (CN)' },
];

const selectType = async (typeId) => {
  selectedType.value = typeId;
  if (typeId === 'all') return;
  if (remoteTypeCache.value[typeId]) return;

  isTypeLoading.value = true;
  try {
    const res = await fetchMangaList({ page: 1, limit: 24, type: typeId });
    const items = res.items || (Array.isArray(res) ? res : []);
    remoteTypeCache.value[typeId] = items;
  } catch (err) {
    console.warn(`[Home] Failed to load ${typeId} releases:`, err);
  } finally {
    isTypeLoading.value = false;
  }
};

const filteredComics = computed(() => {
  if (selectedType.value === 'all') return props.comics;
  if (remoteTypeCache.value[selectedType.value] && remoteTypeCache.value[selectedType.value].length > 0) {
    return remoteTypeCache.value[selectedType.value];
  }
  return props.comics.filter((c) => {
    const t = (c.type || 'manga').toLowerCase();
    return t === selectedType.value;
  });
});

const isGridLoading = computed(() => props.isLoading || isTypeLoading.value);
</script>

<template>
  <div class="latest-releases-section">
    <!-- Section Header & Filter Strip -->
    <div class="releases-header-row">
      <div class="header-title-box">
        <Layers :size="16" class="icon-accent" />
        <h3 class="releases-title">Koleksi Rilis Terbaru</h3>
      </div>

      <div class="header-controls">
        <!-- Type Filter Chips -->
        <div class="type-chips-pill">
          <button
            v-for="f in typeFilters"
            :key="f.id"
            type="button"
            class="filter-tab"
            :class="{ active: selectedType === f.id }"
            @click="selectType(f.id)"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- View Mode Toggle -->
        <div class="view-toggle-box">
          <button
            type="button"
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            title="Tampilan Grid"
            @click="viewMode = 'grid'"
          >
            <Grid :size="14" />
          </button>
          <button
            type="button"
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            title="Tampilan List"
            @click="viewMode = 'list'"
          >
            <List :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Comics Grid / List -->
    <div v-if="isGridLoading" class="comics-render-grid">
      <ComicSkeleton v-for="n in 12" :key="n" :view-mode="viewMode" />
    </div>

    <div v-else-if="filteredComics.length === 0" class="empty-state">
      <p>Tidak ada komik untuk filter ini.</p>
    </div>

    <div v-else :class="['comics-render-grid', `view-${viewMode}`]">
      <ComicCard
        v-for="comic in filteredComics"
        :key="comic.slug || comic.id"
        :comic="comic"
        :view-mode="viewMode"
        :is-privacy-mode="isPrivacyMode"
        :is-bookmarked="bookmarkedIds.includes(comic.slug || comic.id)"
        @select="emit('select-comic', comic)"
        @toggle-bookmark="emit('toggle-bookmark', comic)"
      />
    </div>

    <!-- View All in Catalog Button -->
    <div class="view-catalog-footer">
      <button
        type="button"
        class="browse-all-btn"
        @click="emit('navigate-catalog')"
      >
        <span>Jelajahi Seluruh Arsip Katalog Komik</span>
        <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.latest-releases-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.releases-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-accent {
  color: var(--kura-accent, #e5a93c);
}

.releases-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-chips-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-pill, 9999px);
  padding: 3px 4px;
}

.filter-tab {
  background: transparent;
  border: none;
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-pill, 9999px);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-tab:hover {
  color: #ffffff;
}

.filter-tab.active {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}

.view-toggle-box {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 6px;
  padding: 2px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--kura-text-muted, #94a3b8);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-btn:hover {
  color: #ffffff;
}

.view-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--kura-accent, #e5a93c);
}

.comics-render-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .comics-render-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (min-width: 768px) {
  .comics-render-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }
}

@media (min-width: 1200px) {
  .comics-render-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 20px;
  }
}

.comics-render-grid.view-list {
  grid-template-columns: 1fr !important;
  gap: 12px;
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.85rem;
}

.view-catalog-footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.browse-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 24px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--kura-text-primary, #ffffff);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.browse-all-btn:hover {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  border-color: var(--kura-accent, #e5a93c);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(229, 169, 60, 0.25);
}
</style>
