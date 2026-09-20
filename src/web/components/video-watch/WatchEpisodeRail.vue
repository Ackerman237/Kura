<script setup>
import { Play } from 'lucide-vue-next';

const props = defineProps({
  episodes: {
    type: Array,
    default: () => [],
  },
  currentEpisodeSlug: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select-episode']);
</script>

<template>
  <div v-if="episodes && episodes.length > 1" class="watch-episode-rail">
    <div class="rail-header">
      <h3 class="rail-title">Daftar Episode Serial</h3>
      <span class="episode-count">{{ episodes.length }} Episode</span>
    </div>

    <div class="episode-grid">
      <button
        v-for="(ep, idx) in episodes"
        :key="ep.slug || ep.id || idx"
        type="button"
        class="episode-btn"
        :class="{ active: (ep.slug || ep.id) === currentEpisodeSlug }"
        @click="emit('select-episode', ep)"
      >
        <Play :size="12" :fill="(ep.slug || ep.id) === currentEpisodeSlug ? 'currentColor' : 'none'" />
        <span class="ep-label">{{ ep.title || `Episode ${idx + 1}` }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.watch-episode-rail {
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rail-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.episode-count {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  color: var(--kura-text-muted, #94a3b8);
}

.episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}

.episode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--kura-text-secondary, #cbd5e1);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.episode-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.episode-btn.active {
  background: rgba(229, 169, 60, 0.18);
  border-color: var(--kura-accent, #e5a93c);
  color: var(--kura-accent, #e5a93c);
}

.ep-label {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
