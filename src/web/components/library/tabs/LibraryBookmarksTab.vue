<script setup>
import { Bookmark, Star, Trash2 } from 'lucide-vue-next';
import CountryFlag from '../../common/CountryFlag.vue';

const props = defineProps({
  bookmarks: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['select-comic', 'remove-bookmark']);
</script>

<template>
  <div class="library-tab-content">
    <div v-if="bookmarks.length === 0" class="empty-state">
      <Bookmark :size="40" class="empty-icon" />
      <h3 class="empty-title">Belum Ada Komik Favorit</h3>
      <p class="empty-desc">Tekan ikon bookmark pada komik atau video apa pun untuk menyimpannya ke pustaka favorit ini.</p>
    </div>

    <div v-else class="bookmarks-grid">
      <div
        v-for="item in bookmarks"
        :key="item.slug || item.id"
        class="bookmark-card"
        @click="emit('select-comic', item)"
      >
        <div class="thumb-box">
          <img :src="item.thumb || item.cover || ''" :alt="item.title" class="thumb-img" loading="lazy" />
          <div class="flag-overlay">
            <CountryFlag :type="item.type" size="xs" />
          </div>
        </div>

        <div class="info-box">
          <h4 class="title" :title="item.title">{{ item.title }}</h4>
          <div class="meta-row">
            <span class="type-tag">{{ item.type || 'Manga' }}</span>
            <span v-if="item.rating || item.score" class="rating-tag">
              <Star :size="10" class="star-icon" />
              {{ item.rating || item.score }}
            </span>
          </div>
        </div>

        <button
          type="button"
          class="remove-btn"
          title="Hapus dari Bookmark"
          @click.stop="emit('remove-bookmark', item)"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library-tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  padding: 64px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--kura-text-muted, #94a3b8);
}

.empty-icon {
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 8px;
}

.empty-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.empty-desc {
  font-size: 0.82rem;
  margin: 0;
  max-width: 400px;
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .bookmarks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .bookmarks-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.bookmark-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.bookmark-card:hover {
  border-color: var(--kura-accent, #e5a93c);
  transform: translateY(-2px);
}

.thumb-box {
  position: relative;
  width: 50px;
  height: 68px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #090a0f;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.flag-overlay {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 2;
}

.info-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-tag {
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
  text-transform: uppercase;
}

.rating-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  color: #fbbf24;
  font-family: var(--kura-font-mono, monospace);
  font-weight: 700;
}

.star-icon {
  fill: currentColor;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--kura-text-muted, #94a3b8);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
}
</style>
