<script setup>
import { computed } from 'vue';
import { Star, Play, Bookmark, Clock, User, Tag } from 'lucide-vue-next';
import CountryFlag from '../common/CountryFlag.vue';
import Badge from '../common/Badge.vue';
import { getComicTypeMeta } from '../../utils/comicType.js';
import { useImageFallback } from '../../composables/useImageFallback.js';

const props = defineProps({
  manga: {
    type: Object,
    required: true,
  },
  coverImage: {
    type: String,
    default: '',
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  bookmarked: {
    type: Boolean,
    default: false,
  },
  readingProgress: {
    type: Object,
    default: null,
  },
  firstChapter: {
    type: Object,
    default: null,
  },
  continueChapter: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['select-chapter', 'toggle-bookmark']);

const { handleImageError } = useImageFallback();
const typeMeta = computed(() => getComicTypeMeta(props.manga.type));
</script>

<template>
  <div class="detail-hero-section">
    <!-- Ambient blurred backdrop image -->
    <div
      class="ambient-backdrop"
      :style="{ backgroundImage: `url(${coverImage})` }"
      aria-hidden="true"
    ></div>
    <div class="backdrop-scrim"></div>

    <div class="hero-content-container">
      <!-- Poster Column -->
      <div class="poster-column">
        <div class="poster-frame" :class="{ 'privacy-blur': isPrivacyMode }">
          <img
            :src="coverImage"
            :alt="manga.title"
            class="poster-image"
            @error="handleImageError($event, 'cover')"
          />
          <div class="poster-badge-overlay">
            <div class="type-flag-wrap">
              <CountryFlag :type="manga.type" size="xs" />
              <Badge :variant="typeMeta.variant" size="xs" pill>{{ typeMeta.label }}</Badge>
            </div>
            <span v-if="manga.status" class="status-pill" :class="manga.status.toLowerCase()">
              {{ manga.status === 'Completed' ? 'Tamat' : 'Berjalan' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Metadata Column -->
      <div class="meta-column">
        <div class="meta-top">
          <h1 class="manga-title" :class="{ 'privacy-blur-text': isPrivacyMode }">{{ manga.title }}</h1>
          <p v-if="manga.altTitle || manga.native_title" class="manga-alt-title" :class="{ 'privacy-blur-text': isPrivacyMode }">
            {{ manga.altTitle || manga.native_title }}
          </p>
        </div>

        <!-- Rating & Stat Strip -->
        <div class="stat-strip">
          <div class="stat-item rating">
            <Star :size="16" class="star-icon" />
            <span class="stat-value">{{ (manga.rating || manga.score || 9.2).toFixed ? (manga.rating || manga.score || 9.2).toFixed(1) : (manga.rating || manga.score || '9.2') }}</span>
            <span class="stat-label">/ 10</span>
          </div>

          <div class="stat-divider"></div>

          <div class="stat-item">
            <span class="stat-value">{{ manga.chapters?.length || manga.chapterList?.length || '24+' }}</span>
            <span class="stat-label">Chapter</span>
          </div>

          <div class="stat-divider"></div>

          <div class="stat-item">
            <span class="stat-value">{{ manga.views || '1.2M' }}</span>
            <span class="stat-label">Dibaca</span>
          </div>
        </div>

        <!-- Authors & Artists Credits -->
        <div class="author-credits-grid">
          <div class="credit-row">
            <span class="credit-key">Penulis / Circle:</span>
            <span class="credit-val">{{ manga.author || manga.authorName || 'Tidak diketahui' }}</span>
          </div>
          <div class="credit-row">
            <span class="credit-key">Artis:</span>
            <span class="credit-val">{{ manga.artist || manga.artistName || manga.author || 'Studio' }}</span>
          </div>
          <div class="credit-row">
            <span class="credit-key">Pembaruan:</span>
            <span class="credit-val">{{ manga.releasedAt || manga.upload_date || 'Terbaru' }}</span>
          </div>
        </div>

        <!-- Genre Tags -->
        <div v-if="manga.genres && manga.genres.length" class="genres-wrap">
          <span
            v-for="g in manga.genres"
            :key="typeof g === 'string' ? g : g.name"
            class="genre-chip"
          >
            {{ typeof g === 'string' ? g : g.name }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="cta-actions-row">
          <button
            v-if="continueChapter"
            type="button"
            class="primary-cta-btn continue"
            @click="emit('select-chapter', { chapter: continueChapter, manga })"
          >
            <Play :size="18" fill="currentColor" />
            <span>Lanjutkan {{ continueChapter.title || `Ch. ${continueChapter.chapterNumber}` }}</span>
          </button>

          <button
            v-else-if="firstChapter"
            type="button"
            class="primary-cta-btn"
            @click="emit('select-chapter', { chapter: firstChapter, manga })"
          >
            <Play :size="18" fill="currentColor" />
            <span>Mulai Baca (Ch. 1)</span>
          </button>

          <button
            type="button"
            class="secondary-cta-btn"
            :class="{ 'is-bookmarked': bookmarked }"
            @click="emit('toggle-bookmark')"
          >
            <Bookmark :size="18" :fill="bookmarked ? 'currentColor' : 'none'" />
            <span>{{ bookmarked ? 'Tersimpan di Pustaka' : 'Tambah ke Bookmark' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-hero-section {
  position: relative;
  width: 100%;
  padding: 32px var(--space-4, 16px) 40px;
  overflow: hidden;
  border-bottom: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
}

.ambient-backdrop {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(48px) brightness(0.28) saturate(1.4);
  transform: scale(1.1);
  z-index: 1;
}

.backdrop-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(14, 15, 18, 0.4) 0%,
    rgba(14, 15, 18, 0.85) 75%,
    var(--kura-bg, #0e0f12) 100%
  );
  z-index: 2;
}

.hero-content-container {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: var(--max-content-width, 1400px);
  margin: 0 auto;
  display: flex;
  gap: 32px;
}

.poster-column {
  flex-shrink: 0;
  width: 220px;
}

.poster-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #121318;
}

.poster-frame.privacy-blur img {
  filter: blur(14px);
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.poster-badge-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
}

.type-flag-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-pill {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.5625rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
}

.status-pill.ongoing {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.status-pill.completed {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.meta-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.manga-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--kura-text-primary, #ffffff);
  line-height: 1.25;
  margin: 0;
  letter-spacing: -0.01em;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.privacy-blur-text {
  filter: blur(7px) !important;
  user-select: none !important;
  opacity: 0.65 !important;
}

.manga-alt-title {
  font-family: var(--kura-font-sans, sans-serif);
  font-size: var(--text-sm, 0.875rem);
  color: var(--kura-text-muted, #94a3b8);
  margin: 4px 0 0;
}

.stat-strip {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  padding: 8px 16px;
  border-radius: var(--radius-sm, 6px);
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-item.rating {
  color: var(--kura-warning, #fbbf24);
}

.star-icon {
  fill: currentColor;
  margin-right: 2px;
}

.stat-value {
  font-family: var(--kura-font-mono, monospace);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.stat-label {
  font-size: 0.72rem;
  color: var(--kura-text-muted, #94a3b8);
}

.stat-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.15);
}

.author-credits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  font-size: 0.8rem;
}

.credit-row {
  display: flex;
  gap: 6px;
}

.credit-key {
  color: var(--kura-text-muted, #94a3b8);
}

.credit-val {
  color: var(--kura-text-primary, #ffffff);
  font-weight: 600;
}

.genres-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.genre-chip {
  font-size: 0.72rem;
  color: var(--kura-text-secondary, #cbd5e1);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  padding: 3px 10px;
  border-radius: var(--radius-pill, 9999px);
}

.cta-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.primary-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 20px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  font-size: 0.85rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(229, 169, 60, 0.4);
}

.secondary-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.12));
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-cta-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.secondary-cta-btn.is-bookmarked {
  color: var(--kura-accent, #e5a93c);
  border-color: rgba(229, 169, 60, 0.4);
}

@media (max-width: 768px) {
  .hero-content-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .poster-column {
    width: 170px;
  }
  .stat-strip {
    margin: 0 auto;
  }
  .genres-wrap {
    justify-content: center;
  }
  .cta-actions-row {
    flex-direction: column;
    width: 100%;
  }
  .primary-cta-btn, .secondary-cta-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
