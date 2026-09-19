<script setup>
import { computed } from 'vue';

const props = defineProps({
  manga: {
    type: Object,
    required: true,
  },
});

defineEmits(['select']);

// Derive flag SVG path from manga type
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
</script>

<template>
  <article class="manga-card" @click="$emit('select', manga)">
    <!-- Poster Container with Concentric Radius -->
    <div class="poster-wrap">
      <img
        :src="manga.thumb"
        :alt="manga.title"
        class="poster-img"
        loading="lazy"
        decoding="async"
      />

      <!-- Country Flag Badge (JP / KR / CN) -->
      <div v-if="flagSrc" class="flag-badge" :title="`Asal: ${typeLabel}`">
        <img :src="flagSrc" :alt="typeLabel" class="flag-icon" />
      </div>

      <!-- Type Pill Badge -->
      <span class="type-pill">{{ typeLabel }}</span>

      <!-- Latest Chapter Tag -->
      <span v-if="manga.latestChapter" class="chapter-tag">
        Ch. {{ manga.latestChapter }}
      </span>

      <!-- Scrim gradient for text contrast -->
      <div class="scrim-overlay"></div>
    </div>

    <!-- Info Block -->
    <div class="card-info">
      <h3 class="manga-title" :title="manga.title">{{ manga.title }}</h3>
      
      <!-- CJK Alternate Title (Kanji, Hangul, Hanzi) -->
      <p v-if="manga.altTitle" class="manga-alttitle" :title="manga.altTitle">
        {{ manga.altTitle }}
      </p>

      <div class="meta-row">
        <span v-if="manga.rating" class="rating-badge">★ {{ manga.rating }}</span>
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
  border-radius: var(--radius-lg);
  padding: var(--space-2);
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
  user-select: none;
}

.manga-card:hover {
  transform: translateY(-4px);
  border-color: var(--kura-accent);
  box-shadow: var(--shadow-md);
  background-color: var(--kura-surface-hover);
}

.poster-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  border-radius: var(--radius-md); /* Concentric: 12px outer - 4px padding = 8px */
  overflow: hidden;
  background-color: #121316;
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.manga-card:hover .poster-img {
  transform: scale(1.04);
}

/* Country Flag Badge */
.flag-badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  width: 22px;
  height: 22px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.5);
}

.flag-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Type Pill */
.type-pill {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background-color: rgba(23, 24, 28, 0.85);
  backdrop-filter: blur(4px);
  color: var(--kura-text-primary);
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--kura-border-subtle);
  z-index: 2;
}

/* Chapter Tag */
.chapter-tag {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-2);
  background-color: var(--kura-accent);
  color: var(--kura-text-inverse);
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  z-index: 2;
}

.scrim-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(23, 24, 28, 0) 60%, rgba(23, 24, 28, 0.8) 100%);
  pointer-events: none;
}

/* Info */
.card-info {
  display: flex;
  flex-direction: column;
  padding: var(--space-2) var(--space-1) var(--space-1);
  gap: 2px;
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
}

/* Pan-CJK Alt Title */
.manga-alttitle {
  font-size: var(--text-xs);
  color: var(--kura-text-muted);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--kura-font-sans);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 4px;
  font-size: var(--text-xs);
}

.rating-badge {
  color: var(--kura-warning);
  font-weight: 700;
}

.status-text {
  color: var(--kura-text-muted);
}
</style>
