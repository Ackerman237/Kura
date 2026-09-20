<script setup>
import { computed } from 'vue';
import { Play, Tv, Eye, Star } from 'lucide-vue-next';

const props = defineProps({
  video: {
    type: Object,
    default: null,
  },
  provider: {
    type: String,
    default: 'htv',
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-video']);
</script>

<template>
  <div v-if="video" class="cinema-hero-billboard" @click="emit('select-video', video)">
    <div
      class="hero-ambient-backdrop"
      :class="{ 'privacy-blur': isPrivacyMode }"
      :style="{ backgroundImage: `url(${video.thumb || video.poster || ''})` }"
      aria-hidden="true"
    ></div>
    <div class="hero-backdrop-scrim"></div>

    <div class="hero-content">
      <div class="hero-meta">
        <div class="hero-tag-row">
          <div class="provider-badge">
            <Tv :size="12" />
            <span>{{ provider === 'neko' ? 'NekoPoi' : provider === 'htv' ? 'HentaiTV' : 'Tube' }}</span>
          </div>
          <span class="spotlight-pill">PREMIERE SPOTLIGHT</span>
        </div>

        <h2 class="hero-title" :title="isPrivacyMode ? 'Judul Terproteksi' : video.title">
          <span v-if="isPrivacyMode" class="privacy-censored-dots">••••••••••••••••••••</span>
          <span v-else>{{ video.title }}</span>
        </h2>

        <div class="hero-stats-row">
          <span v-if="video.views" class="stat-item">
            <Eye :size="13" />
            {{ video.views }}
          </span>
          <span v-if="video.rating" class="stat-item rating">
            <Star :size="13" class="star-icon" />
            {{ video.rating }}
          </span>
          <span v-if="video.duration" class="stat-item">{{ video.duration }}</span>
        </div>

        <button type="button" class="play-hero-cta" @click.stop="emit('select-video', video)">
          <Play :size="16" fill="currentColor" />
          <span>Putar Sekarang</span>
        </button>
      </div>

      <div
        class="hero-poster-preview"
        :style="isPrivacyMode ? 'filter: blur(24px) brightness(0.7); overflow: hidden;' : ''"
      >
        <img :src="video.thumb || video.poster || ''" :alt="video.title" class="poster-img" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cinema-hero-billboard {
  position: relative;
  width: 100%;
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  background: #090a0f;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.7);
  cursor: pointer;
}

.hero-ambient-backdrop {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(48px) brightness(0.3) saturate(1.4);
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

.hero-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.hero-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.provider-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(229, 169, 60, 0.2);
  border: 1px solid rgba(229, 169, 60, 0.4);
  color: var(--kura-accent, #e5a93c);
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.spotlight-pill {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

.hero-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--kura-text-primary, #ffffff);
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.74rem;
  color: var(--kura-text-muted, #94a3b8);
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stat-item.rating {
  color: #fbbf24;
  font-weight: 700;
}

.star-icon {
  fill: currentColor;
}

.play-hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 18px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  font-size: 0.82rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s ease;
}

.play-hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(229, 169, 60, 0.4);
}

.hero-poster-preview {
  flex-shrink: 0;
  width: 220px;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .hero-content {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-poster-preview {
    display: none;
  }
  .hero-title {
    font-size: 1.2rem;
  }
}

.privacy-censored-dots {
  letter-spacing: 2px;
  filter: blur(1.5px);
  opacity: 0.6;
  user-select: none;
}

.poster-img.privacy-blur,
.hero-poster-preview.privacy-blur .poster-img,
.hero-ambient-backdrop.privacy-blur {
  filter: blur(20px) brightness(0.7) !important;
  transform: scale(1.1) !important;
}
</style>
