<script setup>
import { History, Play, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['select-comic', 'clear-item']);
</script>

<template>
  <div class="library-tab-content">
    <div v-if="items.length === 0" class="empty-state">
      <History :size="40" class="empty-icon" />
      <h3 class="empty-title">Belum Ada Riwayat Bacaan</h3>
      <p class="empty-desc">Komik yang Anda baca akan otomatis tercatat di sini beserta bab terakhirnya.</p>
    </div>

    <div v-else class="history-grid">
      <div
        v-for="item in items"
        :key="item.mangaSlug || item.id"
        class="history-card"
        @click="emit('select-comic', { slug: item.mangaSlug || item.id, title: item.title, thumb: item.thumb })"
      >
        <div class="thumb-box">
          <img :src="item.thumb || ''" :alt="item.title" class="thumb-img" loading="lazy" />
        </div>

        <div class="info-box">
          <h4 class="title" :title="item.title">{{ item.title }}</h4>
          <span class="chapter-label">{{ item.chapterTitle || `Ch. ${item.chapterNumber || 1}` }}</span>
          <div class="progress-bar-wrap">
            <div
              class="progress-fill"
              :style="{ width: `${Math.min(100, Math.max(10, item.page ? (item.page / (item.totalPages || 20)) * 100 : 40))}%` }"
            ></div>
          </div>
        </div>

        <button
          type="button"
          class="play-btn"
          title="Lanjutkan Membaca"
        >
          <Play :size="14" fill="currentColor" />
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

.history-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .history-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .history-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.history-card {
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

.history-card:hover {
  border-color: var(--kura-accent, #e5a93c);
  transform: translateY(-2px);
}

.thumb-box {
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

.chapter-label {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--kura-accent, #e5a93c);
}

.progress-bar-wrap {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background: var(--kura-accent, #e5a93c);
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.history-card:hover .play-btn {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}
</style>
