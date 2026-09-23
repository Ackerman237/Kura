<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  BookOpen,
  RotateCcw,
  Check,
  X,
} from 'lucide-vue-next';
import ComicCard from '../components/common/ComicCard.vue';
import ComicSkeleton from '../components/common/ComicSkeleton.vue';
import GenreFilterDropdown from '../components/common/GenreFilterDropdown.vue';
import PaginationBar from '../components/common/PaginationBar.vue';
import { fetchMangaList, fetchMangaGenres } from '../services/api.js';

const props = defineProps({
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  bookmarkedIds: {
    type: Array,
    default: () => [],
  },
  initialType: {
    type: String,
    default: 'all',
  },
});

const emit = defineEmits(['select-comic', 'toggle-bookmark']);

// State
const searchQuery = ref('');
const activeType = ref(props.initialType || 'all');
const activeStatus = ref('all');
const activeSort = ref('latest_chapter'); // 'latest_chapter' | 'views' | 'rating'
const selectedGenres = ref([]);
const currentPage = ref(1);

const comics = ref([]);
const genres = ref([]);
const isLoading = ref(false);
const errorMessage = ref(null);
const totalPages = ref(50);

let searchDebounce = null;

// Filter Options
const TYPE_OPTIONS = [
  { id: 'all', label: 'Semua Tipe' },
  { id: 'manga', label: 'Manga' },
  { id: 'manhwa', label: 'Manhwa' },
  { id: 'manhua', label: 'Manhua' },
  { id: 'doujinshi', label: 'Doujin' },
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Status' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'hiatus', label: 'Hiatus' },
];

const SORT_OPTIONS = [
  { id: 'latest_chapter', label: 'Terbaru' },
  { id: 'views', label: 'Terpopuler' },
  { id: 'rating', label: 'Rating Tertinggi' },
];

// Load catalog data (Server-Side Archive Query)
const loadCatalog = async (page = 1) => {
  isLoading.value = true;
  errorMessage.value = null;
  currentPage.value = page;

  try {
    const genreParam = selectedGenres.value.length > 0 ? selectedGenres.value[0] : undefined;
    const res = await fetchMangaList({
      page,
      limit: 24,
      type: activeType.value === 'all' ? undefined : activeType.value,
      genre: genreParam,
      sort: activeSort.value,
      q: searchQuery.value.trim() || undefined,
    });

    const items = res.items || (Array.isArray(res) ? res : []);
    comics.value = items;

    if (res.totalPages) {
      totalPages.value = res.totalPages;
    } else if (res.total) {
      totalPages.value = Math.max(1, Math.ceil(res.total / 24));
    } else if (items.length >= 24) {
      totalPages.value = Math.max(page + 10, 50);
    } else {
      totalPages.value = page;
    }

    // Scroll to top of catalog smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Failed to load manga catalog:', err);
    errorMessage.value = 'Gagal memuat katalog komik. Silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
};

// Direct symmetrical view
const displayComics = computed(() => {
  return comics.value;
});

// Watchers
watch([activeType, activeSort], () => {
  loadCatalog(1);
});

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    loadCatalog(1);
  }, 400);
});

const changePage = (newPage) => {
  if (newPage < 1) return;
  loadCatalog(newPage);
};

const resetFilters = () => {
  searchQuery.value = '';
  activeType.value = 'all';
  activeStatus.value = 'all';
  activeSort.value = 'latest_chapter';
  selectedGenres.value = [];
  loadCatalog(1);
};

onMounted(async () => {
  loadCatalog(1);
  try {
    const gList = await fetchMangaGenres();
    if (Array.isArray(gList) && gList.length) {
      genres.value = gList;
    }
  } catch (_) {}
});
</script>

<template>
  <div class="kura-catalog-view">
    <!-- Hero Header -->
    <header class="catalog-hero-bar">
      <div class="hero-text-wrap">
        <div class="hero-badge">
          <BookOpen :size="13" />
          <span>KATALOG LENGKAP</span>
        </div>
        <h1 class="catalog-title">Jelajahi Pustaka Komik</h1>
        <p class="catalog-desc">
          Temukan ribuan judul Manga, Manhwa, Manhua, dan Doujinshi dengan filter genre presisi dan navigasi cepat.
        </p>
      </div>

      <!-- Quick Search inside Catalog -->
      <div class="catalog-search-wrap">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari judul komik, pengarang, genre..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-btn"
            @click="searchQuery = ''"
            aria-label="Bersihkan pencarian"
          >
            <X :size="14" />
          </button>
        </div>
      </div>
    </header>

    <!-- Floating Filter Bar (Kura Adaptive Style) -->
    <section class="floating-filter-container">
      <div class="filter-pills-row">
        <!-- Tipe Pills -->
        <div class="pill-group">
          <button
            v-for="opt in TYPE_OPTIONS"
            :key="opt.id"
            type="button"
            class="filter-pill-btn"
            :class="{ active: activeType === opt.id }"
            @click="activeType = opt.id"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="filter-divider"></div>

        <!-- Status Filter -->
        <div class="pill-group">
          <button
            v-for="st in STATUS_OPTIONS"
            :key="st.id"
            type="button"
            class="filter-pill-btn sub-pill"
            :class="{ active: activeStatus === st.id }"
            @click="activeStatus = st.id"
          >
            {{ st.label }}
          </button>
        </div>

        <div class="filter-divider"></div>

        <!-- Sort Filter -->
        <div class="pill-group">
          <button
            v-for="s in SORT_OPTIONS"
            :key="s.id"
            type="button"
            class="filter-pill-btn sub-pill"
            :class="{ active: activeSort === s.id }"
            @click="activeSort = s.id"
          >
            {{ s.label }}
          </button>
        </div>

        <!-- Genre Multi-Select Dropdown (Kura Architecture) -->
        <GenreFilterDropdown
          v-if="genres.length"
          v-model="selectedGenres"
          :genres="genres"
          title="Genre Manga"
          @apply="loadCatalog(1)"
          @reset="loadCatalog(1)"
        />

        <!-- Reset Button -->
        <button
          v-if="activeType !== 'all' || activeSort !== 'latest_chapter' || selectedGenres.length > 0 || searchQuery"
          type="button"
          class="reset-filters-btn"
          @click="resetFilters"
          title="Reset semua filter"
        >
          <RotateCcw :size="13" />
          <span>Reset</span>
        </button>
      </div>

      <!-- Active Filter Chips -->
      <div v-if="selectedGenres.length > 0" class="active-chips-strip">
        <span class="active-chips-title">Genre Aktif:</span>
        <span
          v-for="g in selectedGenres"
          :key="g"
          class="active-genre-pill"
        >
          {{ g }}
          <button type="button" class="del-pill-btn" @click="selectedGenres = []; loadCatalog(1)">×</button>
        </span>
      </div>
    </section>

    <!-- Content Grid -->
    <main class="catalog-content-section">
      <!-- Loading State Skeletons -->
      <div v-if="isLoading" class="catalog-grid">
        <ComicSkeleton v-for="i in 18" :key="i" view-mode="grid" />
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="catalog-state-box error-box">
        <p class="state-text">{{ errorMessage }}</p>
        <button type="button" class="retry-btn" @click="loadCatalog(currentPage)">
          <RotateCcw :size="14" />
          <span>Muat Ulang</span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!displayComics.length" class="catalog-state-box empty-box">
        <p class="state-title">Tidak ada komik yang ditemukan</p>
        <p class="state-sub">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
        <button type="button" class="retry-btn" @click="resetFilters">
          <RotateCcw :size="14" />
          <span>Kembalikan Filter Default</span>
        </button>
      </div>

      <!-- Live Cards Grid -->
      <div v-else class="catalog-grid">
        <ComicCard
          v-for="comic in displayComics"
          :key="comic.slug || comic.id"
          :comic="comic"
          :is-privacy-mode="isPrivacyMode"
          :is-bookmarked="bookmarkedIds.includes(comic.slug || comic.id)"
          view-mode="grid"
          @select="$emit('select-comic', comic)"
          @toggle-bookmark="$emit('toggle-bookmark', comic)"
        />
      </div>

      <!-- Kura Numbered Pagination Bar (< 1 2 3 ... 100 >) -->
      <PaginationBar
        v-if="!isLoading && displayComics.length"
        :current-page="currentPage"
        :total-pages="totalPages"
        :disabled="isLoading"
        @change-page="changePage"
      />
    </main>
  </div>
</template>

<style scoped>
.kura-catalog-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem;
  width: 100%;
}

/* Hero Header */
.catalog-hero-bar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

@media (min-width: 840px) {
  .catalog-hero-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--kura-surface-hover);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-accent);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.catalog-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--kura-text-primary);
  margin: 0 0 0.35rem 0;
  letter-spacing: -0.02em;
}

.catalog-desc {
  font-size: 0.85rem;
  color: var(--kura-text-secondary);
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
}

.catalog-search-wrap {
  min-width: 0;
  max-width: 400px;
  width: 100%;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.5rem 0.85rem;
  transition: all var(--duration-fast);
}

.search-box:focus-within {
  border-color: var(--kura-accent);
  box-shadow: 0 0 0 3px var(--kura-accent-muted, rgba(255, 107, 0, 0.15));
}

.search-icon {
  color: var(--kura-text-dim);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--kura-text-primary);
  font-size: 0.84rem;
  outline: none;
  min-width: 0;
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--kura-text-dim);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: var(--kura-text-primary);
}

/* Floating Filter Container */
.floating-filter-container {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem 1.15rem;
}

.filter-pills-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  min-width: 0;
}

.pill-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.filter-divider {
  width: 1px;
  height: 20px;
  background: var(--kura-border-subtle);
  margin: 0 0.25rem;
}

.filter-pill-btn {
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-secondary);
  padding: 0.35rem 0.8rem;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.filter-pill-btn:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
  border-color: var(--kura-accent);
}

.filter-pill-btn.active {
  background: var(--kura-accent);
  color: #ffffff;
  border-color: var(--kura-accent);
  box-shadow: 0 2px 8px rgba(255, 107, 0, 0.3);
}

.filter-pill-btn.sub-pill {
  font-size: 0.74rem;
  padding: 0.3rem 0.7rem;
}

.reset-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: 1px dashed var(--kura-border-subtle);
  color: var(--kura-text-muted);
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  margin-left: auto;
  transition: all var(--duration-fast);
}

.reset-filters-btn:hover {
  color: var(--kura-accent);
  border-color: var(--kura-accent);
}

/* Genres Horizontal Scroll */
.genre-chips-scroll {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
}

.genre-chip-btn {
  background: transparent;
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-muted);
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.genre-chip-btn:hover {
  color: var(--kura-text-primary);
  border-color: var(--kura-text-dim);
}

.genre-chip-btn.active {
  background: var(--kura-accent-muted, rgba(255, 107, 0, 0.15));
  color: var(--kura-accent);
  border-color: var(--kura-accent-border, var(--kura-accent));
  font-weight: 700;
}

/* Catalog Grid */
.catalog-content-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 100% Symmetrical Grid — full 9-viewport matrix */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

/* 360px */
@media (min-width: 360px) {
  .catalog-grid {
    gap: 12px;
  }
}

/* 480px: 3 col */
@media (min-width: 480px) {
  .catalog-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
}

/* 640px */
@media (min-width: 640px) {
  .catalog-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* 768px: tablet — 4 col */
@media (min-width: 768px) {
  .catalog-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

/* 1024px: laptop — 4 col */
@media (min-width: 1024px) {
  .catalog-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}

/* 1280px: desktop — 5 col */
@media (min-width: 1280px) {
  .catalog-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
  }
}

/* 1440px: large desktop — 6 col */
@media (min-width: 1440px) {
  .catalog-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 22px;
  }
}

/* 1920px+: ultrawide — 8 col */
@media (min-width: 1920px) {
  .catalog-grid {
    grid-template-columns: repeat(8, 1fr);
    gap: 24px;
  }
}

/* Mobile filter: hide divider on small screens */
@media (max-width: 640px) {
  .filter-divider {
    display: none;
  }

  /* Prevent iOS zoom on input focus (font-size must be ≥ 16px) */
  .search-input {
    font-size: 16px !important;
  }

  /* Mobile search box: 44px height for touch */
  .search-box {
    min-height: 44px;
  }

  /* catalog view: tighter padding on mobile */
  .kura-catalog-view {
    padding: 1rem;
    gap: 1rem;
  }

  /* catalog hero bar: tighter */
  .catalog-hero-bar {
    padding: 1rem;
  }

  .catalog-search-wrap {
    max-width: 100%;
  }

  /* filter pills: scrollable horizontally */
  .filter-pills-row {
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }

  .filter-pills-row::-webkit-scrollbar {
    display: none;
  }

  /* make filter pill touch targets meet 44px */
  .filter-pill-btn {
    min-height: 36px;
    white-space: nowrap;
    flex-shrink: 0;
  }
}


.active-chips-strip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  padding-top: 0.4rem;
  border-top: 1px solid var(--kura-border-subtle);
}

.active-chips-title {
  font-size: 0.74rem;
  color: var(--kura-text-dim);
}

.active-genre-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--kura-accent-muted);
  color: var(--kura-accent);
  border: 1px solid var(--kura-accent);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 700;
}

.del-pill-btn {
  background: transparent;
  border: none;
  color: var(--kura-accent);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
}

/* State Boxes */
.catalog-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-lg);
  text-align: center;
}

.state-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--kura-text-primary);
  margin: 0 0 0.5rem 0;
}

.state-sub {
  font-size: 0.85rem;
  color: var(--kura-text-secondary);
  margin: 0 0 1.25rem 0;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--kura-accent);
  color: #fff;
  border: none;
  padding: 0.55rem 1.25rem;
  border-radius: var(--radius-pill);
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.retry-btn:hover {
  opacity: 0.9;
}

/* Pagination Bar */
.catalog-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-primary);
  padding: 0.5rem 1.1rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--kura-surface-hover);
  border-color: var(--kura-accent);
  color: var(--kura-accent);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.84rem;
  color: var(--kura-text-secondary);
}

.current-num {
  color: var(--kura-accent);
  font-weight: 800;
}
</style>
