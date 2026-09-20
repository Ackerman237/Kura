<script setup>
import { HardDrive, Play, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  chapters: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['read-chapter', 'delete-chapter']);
</script>

<template>
  <div class="library-tab-content">
    <div v-if="chapters.length === 0" class="empty-state">
      <HardDrive :size="40" class="empty-icon" />
      <h3 class="empty-title">Belum Ada Bab Tersimpan Offline</h3>
      <p class="empty-desc">Unduh bab dari halaman detail manga agar dapat dibaca kapan saja tanpa koneksi internet.</p>
    </div>

    <div v-else class="offline-grid">
      <div
        v-for="ch in chapters"
        :key="ch.chapterId"
        class="offline-card"
        @click="emit('read-chapter', ch)"
      >
        <div class="thumb-box">
          <img :src="ch.thumb || ''" :alt="ch.title" class="thumb-img" loading="lazy" />
        </div>

        <div class="info-box">
          <h4 class="manga-name" :title="ch.title">{{ ch.title }}</h4>
          <span class="chapter-badge">Bab {{ ch.chapterNumber || ch.chapterTitle }}</span>
          <span v-if="ch.imageCount" class="page-count">{{ ch.imageCount }} Halaman Tersimpan</span>
        </div>

        <div class="card-actions">
          <button
            type="button"
            class="action-btn delete"
            title="Hapus dari Penyimpanan Offline"
            @click.stop="emit('delete-chapter', ch)"
          >
            <Trash2 :size="14" />
          </button>
          <button
            type="button"
            class="action-btn play"
            title="Baca Bab Offline"
          >
            <Play :size="14" fill="currentColor" />
          </button>
        </div>
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

.offline-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .offline-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .offline-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.offline-card {
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

.offline-card:hover {
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

.manga-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-badge {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 700;
  color: #34d399;
}

.page-count {
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: #ffffff;
}

.action-btn.play {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.offline-card:hover .action-btn.play {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}
</style>
