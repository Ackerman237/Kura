<script setup>
import { computed } from 'vue';
import { Flame, Play, Clock, Eye } from 'lucide-vue-next';

const props = defineProps({
  videos: {
    type: Array,
    default: () => [],
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-video']);

const trendingVideos = computed(() => {
  return props.videos.slice(0, 8);
});

const handleImageError = (e) => {
  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect fill='%23121318' width='320' height='180'/%3E%3Ctext fill='%23555566' font-family='sans-serif' font-size='12' dy='10.5' font-weight='600' x='50%25' y='50%25' text-anchor='middle'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";
};
</script>

<template>
  <div v-if="trendingVideos.length" class="cinema-trending-section">
    <div class="rail-header">
      <div class="header-left">
        <Flame :size="16" class="flame-icon" />
        <h3 class="rail-title">Top Trending Video Hari Ini</h3>
      </div>
    </div>

    <div class="trending-rail-track">
      <div
        v-for="(v, index) in trendingVideos"
        :key="v.slug || v.id || index"
        class="trending-video-card"
        @click="emit('select-video', v)"
      >
        <div class="medal-badge" :class="[`medal-${index + 1}`]">
          #{{ index + 1 }}
        </div>

        <div class="thumb-container" :class="{ 'privacy-blur': isPrivacyMode }">
          <img
            :src="v.thumb || v.poster || ''"
            :alt="v.title"
            class="thumb-img"
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="handleImageError"
          />
          <div class="play-overlay">
            <Play :size="14" fill="currentColor" />
          </div>
          <span v-if="v.duration" class="duration-tag">{{ v.duration }}</span>
        </div>

        <div class="video-meta">
          <h4 class="video-title" :title="isPrivacyMode ? 'Judul Terproteksi' : v.title">
            <span v-if="isPrivacyMode" class="privacy-censored-dots">••••••••••••••••••••</span>
            <span v-else>{{ v.title }}</span>
          </h4>
          <span v-if="v.views" class="views-tag">
            <Eye :size="11" />
            {{ v.views }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cinema-trending-section {
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

.trending-rail-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
}

.trending-video-card {
  position: relative;
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.trending-video-card:hover {
  transform: translateY(-3px);
}

.medal-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.7rem;
  font-weight: 900;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.medal-badge.medal-1 {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000000;
  border-color: #fde68a;
}

.medal-badge.medal-2 {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  color: #ffffff;
  border-color: #e2e8f0;
}

.medal-badge.medal-3 {
  background: linear-gradient(135deg, #b45309, #78350f);
  color: #ffffff;
  border-color: #fcd34d;
}

.thumb-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  background: #090a0f;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
}

.thumb-container.privacy-blur img {
  filter: blur(14px);
}

.thumb-img {
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
  background: rgba(0, 0, 0, 0.4);
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.trending-video-card:hover .play-overlay {
  opacity: 1;
}

.duration-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-title {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.3em;
}

.views-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}

.privacy-censored-dots {
  letter-spacing: 2px;
  filter: blur(1.5px);
  opacity: 0.6;
  user-select: none;
}
</style>
