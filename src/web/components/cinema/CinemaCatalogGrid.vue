<script setup>
import { Film } from 'lucide-vue-next';
import VideoCard from '../common/VideoCard.vue';
import GenreFilterDropdown from '../common/GenreFilterDropdown.vue';
import PaginationBar from '../common/PaginationBar.vue';

const props = defineProps({
  videos: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  genres: {
    type: Array,
    default: () => [],
  },
  selectedGenre: {
    type: String,
    default: '',
  },
  provider: {
    type: String,
    default: 'htv',
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 50,
  },
});

const emit = defineEmits(['select-video', 'select-genre', 'change-page', 'retry']);
</script>

<template>
  <div class="cinema-catalog-section">
    <!-- Header & Filter Row -->
    <div class="catalog-header-row">
      <div class="header-title-box">
        <Film :size="16" class="icon-accent" />
        <h3 class="catalog-title">Katalog Sinema Lengkap</h3>
      </div>

      <div class="header-filter-box">
        <GenreFilterDropdown
          :genres="genres"
          :selected-genres="selectedGenre ? [selectedGenre] : []"
          placeholder="Filter Genre Video..."
          @apply="(list) => emit('select-genre', list[0] || '')"
          @clear="emit('select-genre', '')"
        />
      </div>
    </div>

    <!-- Skeletons Loading -->
    <div v-if="loading" class="video-grid-symmetrical">
      <div v-for="n in 12" :key="n" class="video-skeleton shimmer"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="state-box error-box">
      <p>{{ error }}</p>
      <button type="button" class="retry-btn" @click="emit('retry')">Coba Lagi</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="videos.length === 0" class="state-box empty-box">
      <p>Tidak ada video ditemukan untuk kategori ini.</p>
    </div>

    <!-- Symmetrical Video Grid (2, 3, 4, 6 columns) -->
    <div v-else class="video-grid-symmetrical">
      <VideoCard
        v-for="v in videos"
        :key="v.slug || v.id"
        :video="v"
        :provider="provider"
        :is-privacy-mode="isPrivacyMode"
        @select="emit('select-video', v)"
      />
    </div>

    <!-- Dynamic Pagination -->
    <div v-if="videos.length && !loading" class="pagination-container">
      <PaginationBar
        :current-page="page"
        :total-pages="totalPages"
        :loading="loading"
        @change-page="(p) => emit('change-page', p)"
      />
    </div>
  </div>
</template>

<style scoped>
.cinema-catalog-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.catalog-header-row {
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

.catalog-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.video-grid-symmetrical {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .video-grid-symmetrical {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .video-grid-symmetrical {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }
}

@media (min-width: 1400px) {
  .video-grid-symmetrical {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 20px;
  }
}

.video-skeleton {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md, 8px);
  background: #14151a;
}

.shimmer {
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 0.9; }
  100% { opacity: 0.5; }
}

.state-box {
  padding: 48px 24px;
  text-align: center;
  border-radius: var(--radius-md, 8px);
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--kura-text-muted, #94a3b8);
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 18px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
</style>
