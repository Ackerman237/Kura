<script setup>
import { ref, computed } from 'vue';
import { Layers, Play, RefreshCw, AlertCircle, Sparkles } from 'lucide-vue-next';

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
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-video', 'retry']);

const filterType = ref('all'); // 'all' | 'anime' | 'live_action'

const filteredVideos = computed(() => {
  if (filterType.value === 'all') return props.videos;
  return props.videos.filter((v) => v.type === filterType.value);
});

const handleImageError = (e) => {
  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect fill='%23121318' width='320' height='180'/%3E%3Ctext fill='%23555566' font-family='sans-serif' font-size='12' dy='10.5' font-weight='600' x='50%25' y='50%25' text-anchor='middle'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";
};

const getProviderBadge = (provider) => {
  switch (provider) {
    case 'htv':
      return { label: 'HTV', class: 'badge-htv' };
    case 'neko':
      return { label: 'Neko', class: 'badge-neko' };
    case 'tube':
      return { label: 'Tube', class: 'badge-tube' };
    default:
      return { label: provider.toUpperCase(), class: 'badge-generic' };
  }
};
</script>

<template>
  <div class="cinema-unified-section">
    <!-- Header Row -->
    <div class="unified-header-row">
      <div class="header-title-box">
        <Layers :size="16" class="icon-accent" />
        <h3 class="catalog-title">Semua Studio (Layar Gabungan)</h3>
        <span class="count-badge" v-if="!loading && filteredVideos.length">
          {{ filteredVideos.length }} Judul
        </span>
      </div>

      <!-- Type Filter Pills -->
      <div class="type-filter-group">
        <button
          type="button"
          class="type-pill"
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          Semua
        </button>
        <button
          type="button"
          class="type-pill"
          :class="{ active: filterType === 'anime' }"
          @click="filterType = 'anime'"
        >
          Anime
        </button>
        <button
          type="button"
          class="type-pill"
          :class="{ active: filterType === 'live_action' }"
          @click="filterType = 'live_action'"
        >
          Live Action
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner">
      <AlertCircle :size="16" />
      <span>{{ error }}</span>
      <button type="button" class="retry-btn" @click="emit('retry')">
        <RefreshCw :size="12" /> Coba Lagi
      </button>
    </div>

    <!-- Loading Skeleton Grid -->
    <div v-else-if="loading" class="unified-grid">
      <div v-for="n in 8" :key="n" class="skeleton-card">
        <div class="skeleton-thumb shimmer"></div>
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line short shimmer"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredVideos.length === 0" class="empty-unified-box">
      <Sparkles :size="32" class="empty-icon" />
      <p class="empty-text">Tidak ada konten yang tersedia di filter ini.</p>
    </div>

    <!-- Unified Video Grid -->
    <div v-else class="unified-grid">
      <div
        v-for="v in filteredVideos"
        :key="v.slug || v.title"
        class="unified-card"
        @click="emit('select-video', { slug: v.slug, provider: v.provider, title: v.title, thumb: v.thumb })"
      >
        <div class="thumb-wrapper" :class="{ 'privacy-blur': isPrivacyMode }">
          <img
            :src="v.thumb || ''"
            :alt="v.title"
            class="card-img"
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="handleImageError"
          />
          <div class="play-overlay">
            <Play :size="16" fill="currentColor" />
          </div>

          <!-- Multiple Source Badges -->
          <div class="sources-ribbon">
            <button
              v-for="s in v.sources"
              :key="s.provider"
              type="button"
              class="source-chip"
              :class="getProviderBadge(s.provider).class"
              :title="`Buka dari ${s.provider.toUpperCase()}`"
              @click.stop="emit('select-video', { slug: s.slug, provider: s.provider, title: v.title, thumb: s.thumb || v.thumb })"
            >
              {{ getProviderBadge(s.provider).label }}
            </button>
          </div>

          <span v-if="v.duration" class="duration-chip">{{ v.duration }}</span>
        </div>

        <div class="card-meta">
          <h4 class="card-title" :title="isPrivacyMode ? 'Judul Terproteksi' : v.title">
            <span v-if="isPrivacyMode" class="privacy-dots">••••••••••••••••</span>
            <span v-else>{{ v.title }}</span>
          </h4>
          <div class="card-sub-info">
            <span class="type-tag">{{ v.type === 'live_action' ? 'Live Action' : 'Anime' }}</span>
            <span v-if="v.views" class="views-info">{{ v.views }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cinema-unified-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.unified-header-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 640px) {
  .unified-header-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-accent {
  color: var(--kura-accent, #ff6b00);
}

.catalog-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.count-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-surface-active, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-muted, #aaaaaa);
}

.type-filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-pill {
  padding: 4px 12px;
  border-radius: var(--radius-pill, 9999px);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--kura-surface, #17181c);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--kura-text-muted, #9ca3af);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.type-pill:hover {
  background: var(--kura-surface-hover, #22242a);
  color: #ffffff;
}

.type-pill.active {
  background: var(--kura-accent, #ff6b00);
  color: #ffffff;
  border-color: var(--kura-accent, #ff6b00);
  font-weight: 700;
}

.unified-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 640px) {
  .unified-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .unified-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

.unified-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  border-radius: var(--radius-md, 8px);
  background: var(--kura-surface, #17181c);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.07));
  padding: 8px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.unified-card:hover {
  transform: translateY(-3px);
  border-color: var(--kura-accent-border, rgba(255, 107, 0, 0.35));
}

.thumb-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm, 6px);
  overflow: hidden;
  background: #090a0f;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.unified-card:hover .play-overlay {
  opacity: 1;
}

.sources-ribbon {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.source-chip {
  font-size: 0.625rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  color: #ffffff;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  transition: transform 0.15s ease;
}

.source-chip:hover {
  transform: scale(1.1);
}

.badge-htv {
  background: #dc2626;
}

.badge-neko {
  background: #0284c7;
}

.badge-tube {
  background: #d97706;
}

.badge-generic {
  background: #4b5563;
}

.duration-chip {
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 3px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.2em;
}

.card-sub-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  color: var(--kura-text-muted, #9ca3af);
}

.type-tag {
  text-transform: capitalize;
}

.privacy-blur img {
  filter: blur(14px);
}

.privacy-dots {
  letter-spacing: 2px;
  filter: blur(1.5px);
  opacity: 0.6;
}

/* Skeleton Loading */
.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--kura-surface, #17181c);
  border-radius: var(--radius-md, 8px);
  padding: 8px;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.05));
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm, 6px);
  background: var(--kura-surface-active, #2b2e36);
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: var(--kura-surface-active, #2b2e36);
  width: 90%;
}

.skeleton-line.short {
  width: 50%;
}

.shimmer {
  animation: shimmerAnim 1.5s infinite linear;
  background: linear-gradient(90deg, #17181c 0%, #2b2e36 50%, #17181c 100%);
  background-size: 200% 100%;
}

@keyframes shimmerAnim {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-unified-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--kura-text-muted, #9ca3af);
  gap: 12px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md, 8px);
  color: #ef4444;
  font-size: 0.85rem;
}

.retry-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-pill, 9999px);
  background: #ef4444;
  color: #ffffff;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
