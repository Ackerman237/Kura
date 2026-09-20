<script setup>
import { computed } from 'vue';
import { Star, Clock, EyeOff, Bookmark, Palette } from 'lucide-vue-next';
import Badge from './Badge.vue';
import CountryFlag from './CountryFlag.vue';
import { getComicCover } from '../../utils/media.js';
import { getComicTypeMeta } from '../../utils/comicType.js';
import { useImageFallback } from '../../composables/useImageFallback.js';
import { usePrivacyPeek } from '../../composables/usePrivacyPeek.js';

const props = defineProps({
  comic: {
    type: Object,
    required: true,
  },
  viewMode: {
    type: String,
    default: 'grid', // 'grid' | 'list'
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select', 'toggle-bookmark']);

const { isPeeking, triggerPeek } = usePrivacyPeek();
const { handleImageError } = useImageFallback();

const coverImage = computed(() => getComicCover(props.comic));
const typeMeta = computed(() => getComicTypeMeta(props.comic.type));

const handleCoverClick = (e) => {
  if (props.isPrivacyMode) {
    e.stopPropagation();
    triggerPeek();
    return;
  }
  emit('select', props.comic);
};

const handleCardClick = () => {
  emit('select', props.comic);
};
</script>

<template>
  <article
    class="kura-comic-card"
    :class="[
      `view-${viewMode}`,
      { 'privacy-active': isPrivacyMode && !isPeeking }
    ]"
    @click="handleCardClick"
  >
    <!-- Real Manga Poster Cover Container -->
    <div class="cover-container" @click="handleCoverClick">
      <img
        :src="coverImage"
        :alt="comic.title"
        class="poster-img"
        :class="{
          'privacy-blur': isPrivacyMode && !isPeeking,
          'peek-active': isPeeking
        }"
        loading="lazy"
        decoding="async"
        @error="handleImageError($event, 'cover')"
      />

      <!-- Ambient Scrim Gradient -->
      <div class="scrim-overlay"></div>

      <!-- Overlays -->
      <div class="cover-overlays">
        <div class="overlay-top">
          <div class="top-badges">
            <CountryFlag :type="comic.type" size="xs" />
            <Badge :variant="typeMeta.variant" size="xs" pill>
              {{ typeMeta.label }}
            </Badge>
          </div>
          <div v-if="comic.rating || comic.score" class="rating-chip">
            <Star :size="10" class="star-icon" />
            <span>{{ (comic.rating || comic.score || 0).toFixed ? (comic.rating || comic.score).toFixed(1) : comic.rating || comic.score }}</span>
          </div>
        </div>

        <div class="overlay-bottom">
          <span v-if="comic.latestChapter || comic.latest_chapter" class="chapter-badge">
            Ch. {{ comic.latestChapter || comic.latest_chapter }}
          </span>
          <span v-if="comic.badges?.includes('Warna')" class="color-badge" title="Full Color">
            <Palette :size="11" />
          </span>
        </div>
      </div>

      <!-- Privacy Mask Indicator -->
      <div v-if="isPrivacyMode && !isPeeking" class="privacy-overlay" title="Mode Sensor SFW Aktif (Ketuk gambar untuk intip 2 detik)">
        <EyeOff :size="18" />
        <span class="privacy-label">Ketuk Intip</span>
      </div>
    </div>

    <!-- Metadata Body -->
    <div class="card-content">
      <div class="title-row">
        <h3 class="comic-title" :title="isPrivacyMode && !isPeeking ? 'Judul Terproteksi' : comic.title">
          <span v-if="isPrivacyMode && !isPeeking" class="privacy-censored-dots">••••••••••••••••••••</span>
          <span v-else>{{ comic.title }}</span>
        </h3>
        <button
          type="button"
          class="bookmark-btn"
          :class="{ 'is-bookmarked': isBookmarked }"
          :title="isBookmarked ? 'Hapus Bookmark' : 'Simpan ke Bookmark'"
          @click.stop="emit('toggle-bookmark', comic)"
        >
          <Bookmark :size="14" :fill="isBookmarked ? 'currentColor' : 'none'" />
        </button>
      </div>

      <p v-if="viewMode === 'list' && comic.synopsis" class="comic-synopsis">
        {{ comic.synopsis }}
      </p>

      <div class="meta-row">
        <span class="release-time">
          <Clock :size="11" />
          {{ comic.releasedAt || comic.upload_date || 'Terbaru' }}
        </span>
        <span v-if="comic.status" class="status-indicator" :class="comic.status.toLowerCase()">
          {{ comic.status === 'Completed' ? 'Tamat' : 'Berjalan' }}
        </span>
      </div>

      <div v-if="comic.genres && comic.genres.length" class="genres-row">
        <span v-for="genre in comic.genres.slice(0, 3)" :key="genre" class="genre-tag">
          {{ genre.name || genre }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.kura-comic-card {
  position: relative;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out);
  user-select: none;
}

.kura-comic-card:hover {
  transform: translateY(-4px);
  border-color: var(--kura-border-strong);
  box-shadow: var(--shadow-md);
}

/* ================= Grid View ================= */
.view-grid {
  display: flex;
  flex-direction: column;
}

.view-grid .cover-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: #111216;
  isolation: isolate;
}

.view-grid .poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform var(--duration-normal) var(--ease-out), filter 0.25s ease;
}

.poster-img.privacy-blur {
  filter: blur(14px) !important;
  transform: scale(1.08) !important;
}

.poster-img.peek-active {
  filter: blur(0px) !important;
  transform: scale(1.0) !important;
}

.kura-comic-card:hover .poster-img:not(.privacy-blur) {
  transform: scale(1.05);
}

.scrim-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.5) 0%,
    transparent 35%,
    transparent 65%,
    rgba(0, 0, 0, 0.85) 100%
  );
  pointer-events: none;
}

.cover-overlays {
  position: absolute;
  inset: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  z-index: 2;
}

.overlay-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.top-badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

.flag-icon {
  width: 14px;
  height: 10px;
  border-radius: 1px;
  object-fit: cover;
}

.overlay-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.rating-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: #fbbf24;
  font-family: var(--kura-font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(251, 191, 36, 0.25);
}

.chapter-badge {
  background: rgba(14, 15, 18, 0.88);
  backdrop-filter: blur(6px);
  color: #f4f4f6;
  font-family: var(--kura-font-mono);
  font-size: var(--text-2xs);
  font-weight: 600;
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.color-badge {
  font-size: 11px;
}

.view-grid .card-content {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.view-grid .comic-title {
  font-family: var(--kura-font-heading);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--kura-text-primary);
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  transition: color var(--duration-fast);
}

.kura-comic-card:hover .comic-title {
  color: var(--kura-accent);
}

/* ================= List View ================= */
.view-list {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  gap: 14px;
}

.view-list:hover {
  transform: translateX(4px);
}

.view-list .cover-container {
  position: relative;
  width: 72px;
  height: 108px;
  flex-shrink: 0;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-xs);
  overflow: hidden;
  background: #111216;
  border: 1px solid var(--kura-border-subtle);
}

.view-list .poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.view-list .card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-list .comic-title {
  font-family: var(--kura-font-heading);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--kura-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comic-synopsis {
  font-size: var(--text-xs);
  color: var(--kura-text-muted);
  margin: 2px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

/* ================= Privacy Mode / SFW Blur ================= */
.privacy-active .poster-img {
  filter: blur(14px);
  transition: filter var(--duration-fast);
}

.privacy-active:hover .poster-img {
  filter: blur(0px);
}

.privacy-active .comic-title {
  filter: blur(6px);
  user-select: none;
  opacity: 0.65;
}

.privacy-censored-dots {
  letter-spacing: 2px;
  filter: blur(1.5px);
  opacity: 0.6;
  user-select: none;
}

.privacy-active .comic-synopsis {
  filter: blur(5px);
  user-select: none;
  opacity: 0.5;
}

.privacy-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(14, 15, 18, 0.45);
  backdrop-filter: blur(4px);
  color: var(--kura-text-muted);
  font-family: var(--kura-font-sans);
  font-size: var(--text-2xs);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: opacity var(--duration-fast);
  z-index: 3;
}

.privacy-active:hover .privacy-overlay {
  opacity: 0;
  pointer-events: none;
}

/* ================= Content Rows ================= */
.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.bookmark-btn {
  background: transparent;
  border: none;
  color: var(--kura-text-dim);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all var(--duration-fast);
}

.bookmark-btn:hover {
  color: var(--kura-accent);
}

.bookmark-btn.is-bookmarked {
  color: var(--kura-accent);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--kura-font-sans);
  font-size: var(--text-2xs);
  color: var(--kura-text-muted);
}

.release-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--kura-text-dim);
}

.status-indicator {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.5625rem;
  padding: 1px 5px;
  border-radius: 3px;
}

.status-indicator.ongoing {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
}

.status-indicator.completed {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}

.genres-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.genre-tag {
  font-size: 0.5625rem;
  color: var(--kura-text-dim);
  background: var(--kura-surface-hover);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--kura-border-subtle);
}
</style>
