<script setup>
import { ref, onMounted } from 'vue';
import { History, Play, ChevronRight } from 'lucide-vue-next';
import { getReadingProgress } from '../../services/storage.js';

const emit = defineEmits(['select-comic']);

const continueList = ref([]);

const loadProgress = () => {
  try {
    const raw = getReadingProgress() || {};
    continueList.value = Object.values(raw).sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    ).slice(0, 8);
  } catch (e) {
    continueList.value = [];
  }
};

const onImgError = (e, item) => {
  const target = e.target;
  const raw = item.thumb || item.cover || '';
  if (raw && !target.dataset.retried && !raw.includes('/api/image-proxy')) {
    target.dataset.retried = 'true';
    target.src = `/api/image-proxy?url=${encodeURIComponent(raw)}`;
  } else {
    target.src = '/placeholder-cover.svg';
  }
};

onMounted(() => {
  loadProgress();
});
</script>

<template>
  <div v-if="continueList && continueList.length > 0" class="continue-reading-section">
    <div class="section-header-compact">
      <div class="header-left">
        <History :size="16" class="icon-accent" />
        <h3 class="section-title">Lanjutkan Membaca</h3>
      </div>
    </div>

    <div class="continue-rail-viewport">
      <div
        v-for="item in continueList"
        :key="item.mangaSlug || item.id"
        class="continue-card"
        @click="emit('select-comic', { slug: item.mangaSlug || item.id, title: item.title, thumb: item.thumb || item.cover })"
      >
        <div class="continue-thumb-box">
          <img
            :src="item.thumb || item.cover || '/placeholder-cover.svg'"
            :alt="item.title"
            class="continue-thumb"
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="onImgError($event, item)"
          />
          <div class="play-pill">
            <Play :size="10" fill="currentColor" />
          </div>
        </div>

        <div class="continue-info">
          <h4 class="continue-title" :title="item.title">{{ item.title }}</h4>
          <span class="continue-chapter">{{ item.chapterTitle || `Ch. ${item.chapterNumber || 1}` }}</span>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${Math.min(100, Math.max(10, item.page ? (item.page / (item.totalPages || 20)) * 100 : 40))}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.continue-reading-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-accent {
  color: var(--kura-accent, #e5a93c);
}

.section-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.continue-rail-viewport {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
}

.continue-card {
  flex-shrink: 0;
  width: 220px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.continue-card:hover {
  border-color: var(--kura-accent, #e5a93c);
  transform: translateY(-2px);
}

.continue-thumb-box {
  position: relative;
  width: 44px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #090a0f;
}

.continue-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-pill {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.continue-card:hover .play-pill {
  opacity: 1;
}

.continue-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.continue-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.continue-chapter {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.68rem;
  color: var(--kura-accent, #e5a93c);
  font-weight: 700;
}

.progress-track {
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
</style>
