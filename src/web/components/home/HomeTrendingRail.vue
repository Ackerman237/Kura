<script setup>
import { computed } from 'vue';
import { Flame, Star } from 'lucide-vue-next';
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
});

const emit = defineEmits(['select-comic']);

const trendingComics = computed(() => {
  return props.comics.slice(0, 10);
});
</script>

<template>
  <div v-if="trendingComics.length" class="trending-rail-section">
    <div class="rail-header">
      <div class="header-left">
        <Flame :size="16" class="flame-icon" />
        <h3 class="rail-title">Top 10 Komik Terpopuler Minggu Ini</h3>
      </div>
    </div>

    <div class="trending-scroll-track">
      <div
        v-for="(comic, index) in trendingComics"
        :key="comic.slug || comic.id || index"
        class="trending-card"
        @click="emit('select-comic', comic)"
      >
        <!-- Ranking Medal Badge -->
        <div class="rank-medal" :class="[`rank-${index + 1}`]">
          <span>#{{ index + 1 }}</span>
        </div>

        <div class="card-cover-box" :class="{ 'privacy-blur': isPrivacyMode }">
          <img
            :src="comic.thumb || comic.cover || ''"
            :alt="comic.title"
            class="cover-img"
            loading="lazy"
          />
          <div class="flag-overlay">
            <CountryFlag :type="comic.type" size="xs" />
          </div>
        </div>

        <div class="card-meta">
          <h4 class="card-title" :title="comic.title">{{ comic.title }}</h4>
          <div class="card-bottom">
            <span class="chapter-tag">{{ comic.latestChapter ? `Ch. ${comic.latestChapter}` : (comic.type || 'Manga') }}</span>
            <span v-if="comic.rating || comic.score" class="rating-tag">
              <Star :size="10" class="star-icon" />
              {{ (comic.rating || comic.score || 9.0).toFixed ? (comic.rating || comic.score || 9.0).toFixed(1) : comic.rating }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trending-rail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flame-icon {
  color: #f97316;
}

.rail-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.trending-scroll-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  padding-left: max(0px, var(--safe-area-left, 0px));
  padding-right: max(0px, var(--safe-area-right, 0px));
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.trending-card {
  position: relative;
  flex-shrink: 0;
  width: clamp(110px, 35vw, 160px); /* fluid width: 110px on 320px, 160px on wide */
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  touch-action: manipulation;
}

@media (min-width: 768px) {
  .trending-card {
    width: clamp(130px, 16vw, 180px);
  }
}

@media (min-width: 1280px) {
  .trending-card {
    width: 160px;
  }
}


.trending-card:hover {
  transform: translateY(-4px);
}

.rank-medal {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 900;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.rank-medal.rank-1 {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000000;
  border-color: #fde68a;
}

.rank-medal.rank-2 {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  color: #ffffff;
  border-color: #e2e8f0;
}

.rank-medal.rank-3 {
  background: linear-gradient(135deg, #b45309, #78350f);
  color: #ffffff;
  border-color: #fcd34d;
}

.card-cover-box {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  background: #090a0f;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
}

.card-cover-box.privacy-blur img {
  filter: blur(14px);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.flag-overlay {
  position: absolute;
  bottom: 6px;
  right: 6px;
  z-index: 2;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 0.78rem;
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

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}

.chapter-tag {
  font-family: var(--kura-font-mono, monospace);
}

.rating-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #fbbf24;
  font-family: var(--kura-font-mono, monospace);
  font-weight: 700;
}

.star-icon {
  fill: currentColor;
}
</style>
