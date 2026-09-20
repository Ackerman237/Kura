<script setup>
import { computed } from 'vue';
import { Star } from 'lucide-vue-next';

const props = defineProps({
  manga: {
    type: Object,
    required: true,
  },
});

defineEmits(['select']);

const flagSrc = computed(() => {
  const t = (props.manga.type || '').toLowerCase();
  if (t === 'manhwa') return '/assets/flags/kr.svg';
  if (t === 'manhua') return '/assets/flags/cn.svg';
  if (t === 'manga' || t === 'doujinshi') return '/assets/flags/jp.svg';
  return null;
});

const typeLabel = computed(() => {
  const t = (props.manga.type || 'manga').toLowerCase();
  return t.toUpperCase();
});

function onImgError(event) {
  const currentSrc = event.target.src || '';
  if (currentSrc.startsWith('http') && !currentSrc.includes('/api/image-proxy')) {
    event.target.src = `/api/image-proxy?url=${encodeURIComponent(currentSrc)}`;
  } else {
    event.target.style.opacity = '0';
  }
}
</script>

<template>
  <article class="manga-card" @click="$emit('select', manga)">
    <!-- Poster Container with 3:4.5 aspect ratio -->
    <div class="poster-wrap">
      <img
        :src="manga.thumb || manga.cover_url || ''"
        :alt="manga.title"
        class="poster-img"
        loading="lazy"
        decoding="async"
        @error="onImgError"
      />

      <!-- Country Flag Badge -->
      <div v-if="flagSrc" class="flag-badge" :title="`Asal: ${typeLabel}`">
        <img :src="flagSrc" :alt="typeLabel" class="flag-icon" />
      </div>

      <!-- Type Pill Badge -->
      <span class="type-pill">{{ typeLabel }}</span>

      <!-- Latest Chapter Tag -->
      <span v-if="manga.latestChapter" class="chapter-tag">
        Ch. {{ manga.latestChapter }}
      </span>

      <!-- Scrim gradient -->
      <div class="scrim-overlay"></div>
    </div>

    <!-- Info Block -->
    <div class="card-info">
      <h3 class="manga-title" :title="manga.title">{{ manga.title }}</h3>

      <div class="meta-row">
        <span v-if="manga.rating" class="rating-badge">
          <Star :size="12" class="star-icon" />
          {{ manga.rating }}
        </span>
        <span v-if="manga.status" class="status-text">{{ manga.status }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.manga-card {
  display: flex;
  flex-direction: column;
  background-color: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-md);
  padding: 6px;
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal),
              box-shadow var(--duration-normal),
              background-color var(--duration-normal);
  user-select: none;
}

.manga-card:hover {
  transform: translateY(-3px) scale(1.01);
  border-color: var(--kura-accent);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5);
  background-color: var(--kura-surface-hover);
}

.manga-card:hover .manga-title {
  color: var(--kura-accent);
}

.poster-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.5;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: #121316;
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-normal) var(--ease-out);
}

.manga-card:hover .poster-img {
  transform: scale(1.04);
}

/* Country Flag Badge */
.flag-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.25);
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.6);
}

.flag-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Type Pill */
.type-pill {
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: rgba(14, 15, 18, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--kura-text-primary);
  font-size: var(--text-2xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--kura-border-subtle);
  z-index: 2;
  letter-spacing: 0.04em;
}

/* Chapter Tag */
.chapter-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #FFA048;
  font-size: var(--text-xs);
  font-family: var(--kura-font-mono);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(255, 160, 72, 0.3);
  z-index: 2;
}

.scrim-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(14, 15, 18, 0) 65%, rgba(14, 15, 18, 0.85) 100%);
  pointer-events: none;
}

/* Info */
.card-info {
  display: flex;
  flex-direction: column;
  padding: 8px 4px 4px;
  gap: 4px;
}

.manga-title {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.35;
  color: var(--kura-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--duration-fast);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  font-size: var(--text-2xs);
}

.rating-badge {
  color: var(--kura-warning);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.star-icon {
  fill: currentColor;
}

.status-text {
  color: var(--kura-text-dim);
  text-transform: capitalize;
}
</style>
