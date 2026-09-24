<script setup>
import { ref } from 'vue';
import { Film, ArrowUp } from 'lucide-vue-next';
import VideoCard from '../common/VideoCard.vue';

const props = defineProps({
  videos: {
    type: Array,
    default: () => [],
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

const sidebarScrollRef = ref(null);

const scrollToTop = () => {
  if (sidebarScrollRef.value) {
    sidebarScrollRef.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
</script>

<template>
  <aside class="watch-related-sidebar">
    <div class="sidebar-header-sticky">
      <div class="header-left">
        <Film :size="15" class="icon-accent" />
        <h3 class="sidebar-title">Rekomendasi Video Serupa</h3>
      </div>
      <div class="header-actions">
        <span class="video-counter">{{ videos.length }} Video</span>
        <button
          type="button"
          class="scroll-top-btn"
          title="Gulir ke paling atas"
          @click="scrollToTop"
        >
          <ArrowUp :size="13" />
        </button>
      </div>
    </div>

    <div ref="sidebarScrollRef" class="sidebar-scroll-viewport">
      <div v-if="videos.length === 0" class="empty-related">
        <p>Tidak ada rekomendasi video lain.</p>
      </div>

      <div v-else class="related-cards-grid">
        <VideoCard
          v-for="v in videos"
          :key="v.slug || v.id"
          :video="v"
          :provider="provider"
          :is-privacy-mode="isPrivacyMode"
          @select="emit('select-video', v)"
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.watch-related-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  height: 100%;
  max-height: calc(100vh - 96px);
}

.sidebar-header-sticky {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(20, 21, 26, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-accent {
  color: var(--kura-accent, #e5a93c);
}

.sidebar-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-counter {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}

.scroll-top-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: var(--kura-text-muted, #94a3b8);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.scroll-top-btn:hover {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}

.sidebar-scroll-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  scrollbar-width: thin;
  overscroll-behavior: contain;
}

.related-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-related {
  padding: 32px 16px;
  text-align: center;
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.78rem;
}
</style>
