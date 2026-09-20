<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Play, Bookmark, Star, ChevronLeft, ChevronRight, Layers } from 'lucide-vue-next';
import CountryFlag from '../common/CountryFlag.vue';

const props = defineProps({
  comics: {
    type: Array,
    default: () => [],
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

const emit = defineEmits(['select-comic', 'toggle-bookmark']);

const activeIndex = ref(0);
let autoTimer = null;

const displayComics = computed(() => {
  return props.comics.slice(0, 5);
});

const currentComic = computed(() => {
  if (!displayComics.value.length) return null;
  return displayComics.value[activeIndex.value] || displayComics.value[0];
});

const nextSlide = () => {
  if (!displayComics.value.length) return;
  activeIndex.value = (activeIndex.value + 1) % displayComics.value.length;
};

const prevSlide = () => {
  if (!displayComics.value.length) return;
  activeIndex.value = (activeIndex.value - 1 + displayComics.value.length) % displayComics.value.length;
};

const isCurrentBookmarked = computed(() => {
  if (!currentComic.value) return false;
  const id = currentComic.value.id || currentComic.value.slug;
  return props.bookmarkedIds.includes(id);
});

onMounted(() => {
  autoTimer = setInterval(nextSlide, 7000);
});

onUnmounted(() => {
  if (autoTimer) clearInterval(autoTimer);
});
</script>

<template>
  <div v-if="currentComic" class="home-hero-billboard">
    <!-- Ambient Backdrop Art -->
    <div
      class="hero-ambient-backdrop"
      :style="{ backgroundImage: `url(${currentComic.thumb || currentComic.cover || ''})` }"
      aria-hidden="true"
    ></div>
    <div class="hero-backdrop-scrim"></div>

    <!-- Content Container -->
    <div class="hero-content">
      <div class="hero-meta-column">
        <div class="hero-badge-row">
          <CountryFlag :type="currentComic.type" size="sm" show-label />
          <span class="spotlight-tag">SOROTAN UTAMA #{{ activeIndex + 1 }}</span>
          <div v-if="currentComic.rating || currentComic.score" class="rating-badge">
            <Star :size="12" class="star-icon" />
            <span>{{ (currentComic.rating || currentComic.score || 9.2).toFixed ? (currentComic.rating || currentComic.score || 9.2).toFixed(1) : (currentComic.rating || currentComic.score || '9.2') }}</span>
          </div>
        </div>

        <h2 class="hero-title" :class="{ 'privacy-blur-text': isPrivacyMode }" :title="currentComic.title">
          {{ currentComic.title }}
        </h2>

        <p v-if="currentComic.synopsis" class="hero-synopsis" :class="{ 'privacy-blur-text': isPrivacyMode }">
          {{ currentComic.synopsis }}
        </p>

        <!-- Genre Tags -->
        <div v-if="currentComic.genres && currentComic.genres.length" class="hero-genres-wrap">
          <span
            v-for="g in currentComic.genres.slice(0, 4)"
            :key="typeof g === 'string' ? g : g.name"
            class="genre-chip"
          >
            {{ typeof g === 'string' ? g : g.name }}
          </span>
        </div>

        <!-- Action CTAs -->
        <div class="hero-actions-row">
          <button
            type="button"
            class="hero-cta-btn primary"
            @click="emit('select-comic', currentComic)"
          >
            <Play :size="16" fill="currentColor" />
            <span>Mulai Baca Sekarang</span>
          </button>

          <button
            type="button"
            class="hero-cta-btn secondary"
            :class="{ active: isCurrentBookmarked }"
            @click="emit('toggle-bookmark', currentComic)"
          >
            <Bookmark :size="16" :fill="isCurrentBookmarked ? 'currentColor' : 'none'" />
            <span>{{ isCurrentBookmarked ? 'Tersimpan' : 'Bookmark' }}</span>
          </button>
        </div>
      </div>

      <!-- Poster Card -->
      <div
        class="hero-poster-column"
        :class="{ 'privacy-blur': isPrivacyMode }"
        @click="emit('select-comic', currentComic)"
      >
        <img
          :src="currentComic.thumb || currentComic.cover || ''"
          :alt="currentComic.title"
          class="hero-poster-img"
          loading="eager"
        />
      </div>
    </div>

    <!-- Carousel Nav Buttons -->
    <div class="carousel-nav-arrows">
      <button type="button" class="arrow-btn" title="Sorotan Sebelumnya" @click="prevSlide">
        <ChevronLeft :size="18" />
      </button>
      <button type="button" class="arrow-btn" title="Sorotan Berikutnya" @click="nextSlide">
        <ChevronRight :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-hero-billboard {
  position: relative;
  width: 100%;
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  background: #090a0f;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.7);
  min-height: 280px;
}

.hero-ambient-backdrop {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center 20%;
  filter: blur(48px) brightness(0.28) saturate(1.4);
  transform: scale(1.1);
  z-index: 1;
}

.hero-backdrop-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(14, 15, 18, 0.95) 0%,
    rgba(14, 15, 18, 0.8) 55%,
    rgba(14, 15, 18, 0.4) 100%
  );
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  gap: 28px;
}

.hero-meta-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.hero-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.spotlight-tag {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.15);
  border: 1px solid rgba(229, 169, 60, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
}

.rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fbbf24;
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.star-icon {
  fill: currentColor;
}

.hero-title {
  font-family: var(--kura-font-heading);
  font-size: clamp(1.4rem, 3.5vw, 2.2rem);
  font-weight: 700;
  color: #f4f4f6;
  margin: 0;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.privacy-blur-text {
  filter: blur(7px) !important;
  user-select: none !important;
  opacity: 0.65 !important;
}

.hero-synopsis {
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 620px;
}

.hero-genres-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.genre-chip {
  font-size: 0.7rem;
  color: var(--kura-text-secondary, #cbd5e1);
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.hero-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.hero-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border-radius: var(--radius-pill, 9999px);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hero-cta-btn.primary {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  border: none;
}

.hero-cta-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(229, 169, 60, 0.35);
}

.hero-cta-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.15));
  color: #ffffff;
}

.hero-cta-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.16);
}

.hero-cta-btn.secondary.active {
  color: var(--kura-accent, #e5a93c);
  border-color: rgba(229, 169, 60, 0.4);
}

.hero-poster-column {
  flex-shrink: 0;
  width: 140px;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7);
  cursor: pointer;
  transition: transform 0.25s ease;
}

.hero-poster-column:hover {
  transform: scale(1.04);
}

.hero-poster-column.privacy-blur img {
  filter: blur(14px);
}

.hero-poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-nav-arrows {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 6px;
}

.arrow-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.arrow-btn:hover {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}

@media (max-width: 640px) {
  .hero-content {
    padding: 18px;
    flex-direction: column-reverse;
    align-items: flex-start;
  }
  .hero-poster-column {
    display: none;
  }
  .hero-title {
    font-size: 1.25rem;
  }
}
</style>
