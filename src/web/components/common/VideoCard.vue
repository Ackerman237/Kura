<script setup>
import { computed } from 'vue';
import { Play, Eye, Star, Clock, EyeOff } from 'lucide-vue-next';
import { getVideoThumb } from '../../utils/media.js';
import { useImageFallback } from '../../composables/useImageFallback.js';
import { usePrivacyPeek } from '../../composables/usePrivacyPeek.js';

const props = defineProps({
  video: {
    type: Object,
    required: true,
  },
  provider: {
    type: String,
    default: 'htv', // 'neko' | 'htv' | 'tube'
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select']);

const { isPeeking, triggerPeek } = usePrivacyPeek();
const { handleImageError } = useImageFallback();

const thumbUrl = computed(() => getVideoThumb(props.video));

const handleThumbClick = (e) => {
  if (props.isPrivacyMode) {
    e.stopPropagation();
    triggerPeek();
    return;
  }
  emit('select', props.video);
};

const handleCardClick = () => {
  emit('select', props.video);
};
</script>

<template>
  <article
    class="video-card"
    :class="{ 'privacy-active': isPrivacyMode && !isPeeking }"
    @click="handleCardClick"
  >
    <!-- Thumbnail Canvas with 16:9 aspect ratio -->
    <div class="thumb-container" @click="handleThumbClick">
      <img
        :src="thumbUrl"
        :alt="video.title"
        class="video-thumb"
        :class="{
          'privacy-blur': isPrivacyMode && !isPeeking,
          'peek-active': isPeeking
        }"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        @error="handleImageError($event, 'thumbnail')"
      />

      <!-- Privacy Mask Indicator -->
      <div v-if="isPrivacyMode && !isPeeking" class="privacy-badge">
        <EyeOff :size="14" />
        <span>Ketuk Intip</span>
      </div>

      <!-- Hover Play Overlay -->
      <div v-if="!isPrivacyMode || isPeeking" class="play-overlay">
        <div class="play-icon-circle">
          <Play :size="20" class="play-svg" />
        </div>
      </div>

      <!-- Duration Badge -->
      <span v-if="video.duration || video.length" class="badge-duration">
        <Clock :size="10" />
        {{ video.duration || video.length }}
      </span>

      <!-- Quality Badge -->
      <span v-if="video.quality || video.hd" class="badge-quality">
        {{ video.quality || (video.hd ? 'HD' : '') }}
      </span>

      <!-- Provider Tag -->
      <span class="badge-provider" :data-provider="provider">
        {{ provider === 'neko' ? 'NekoPoi' : provider === 'htv' ? 'HentaiTV' : 'Tube' }}
      </span>
    </div>

    <!-- Metadata Content -->
    <div class="video-meta">
      <h3 class="video-title" :title="isPrivacyMode && !isPeeking ? 'Judul Terproteksi' : video.title">
        <span v-if="isPrivacyMode && !isPeeking" class="privacy-censored-dots">••••••••••••••••••••</span>
        <span v-else>{{ video.title }}</span>
      </h3>
      <div class="meta-bottom">
        <span v-if="video.views" class="meta-views">
          <Eye :size="12" />
          {{ video.views }}
        </span>
        <span v-if="video.date || video.added" class="meta-date">{{ video.date || video.added }}</span>
        <span v-if="video.rating" class="meta-rating">
          <Star :size="12" class="star-icon" />
          {{ video.rating }}
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.video-card {
  display: flex;
  flex-direction: column;
  background-color: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal),
              border-color var(--duration-normal);
  user-select: none;
}

.video-card:hover {
  transform: translateY(-3px) scale(1.01);
  border-color: var(--kura-accent);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5);
}

.video-card:hover .video-title {
  color: var(--kura-accent);
}

.privacy-active .video-title {
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

.thumb-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #0E0F12;
  overflow: hidden;
  isolation: isolate;
}

.video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-normal) var(--ease-out), filter 0.25s ease;
}

.video-thumb.privacy-blur {
  filter: blur(14px) !important;
  transform: scale(1.08) !important;
}

.video-thumb.peek-active {
  filter: blur(0px) !important;
  transform: scale(1.0) !important;
}

.privacy-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 5;
}

.video-card:hover .video-thumb:not(.privacy-blur) {
  transform: scale(1.04);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--duration-fast);
}

@media (max-width: 640px) {
  .video-meta {
    padding: 8px 10px !important;
    gap: 4px !important;
  }
  .video-title {
    font-size: 0.78rem !important;
    line-height: 1.25 !important;
    -webkit-line-clamp: 2 !important;
    min-height: 2.5em !important;
  }
  .meta-bottom {
    font-size: 0.68rem !important;
    gap: 6px !important;
  }
  .badge-duration, .badge-quality, .badge-provider {
    font-size: 0.62rem !important;
    padding: 1px 4px !important;
  }
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  background-color: var(--kura-accent);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px var(--kura-accent-glow);
  transform: scale(0.85);
  transition: transform var(--duration-normal) var(--ease-spring);
}

.play-svg {
  fill: currentColor;
  margin-left: 2px;
}

.video-card:hover .play-icon-circle {
  transform: scale(1);
}

.badge-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #FFFFFF;
  font-size: var(--text-2xs);
  font-family: var(--kura-font-mono);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.badge-quality {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(239, 68, 68, 0.9);
  color: #FFFFFF;
  font-size: var(--text-2xs);
  font-weight: 800;
  padding: 2px 5px;
  border-radius: var(--radius-xs);
  letter-spacing: 0.05em;
}

.badge-provider {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: var(--text-2xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  color: #FFFFFF;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.badge-provider[data-provider="neko"] {
  background: rgba(236, 72, 153, 0.85);
}

.badge-provider[data-provider="htv"] {
  background: rgba(147, 51, 234, 0.85);
}

.badge-provider[data-provider="tube"] {
  background: rgba(234, 88, 12, 0.85);
}

.video-meta {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.video-title {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.35;
  color: var(--kura-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  min-height: 2.7em;
  transition: color var(--duration-fast);
}

.meta-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
  font-size: var(--text-2xs);
  color: var(--kura-text-muted);
}

.meta-views, .meta-rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.meta-rating {
  color: var(--kura-warning);
  font-weight: 700;
}

.star-icon {
  fill: currentColor;
}
</style>
