<script setup>
import { ref } from 'vue';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-vue-next';

const props = defineProps({
  synopsis: {
    type: String,
    default: '',
  },
});

const isExpanded = ref(false);
</script>

<template>
  <div v-if="synopsis" class="detail-synopsis-section container">
    <div class="synopsis-card">
      <div class="synopsis-header">
        <div class="header-left">
          <BookOpen :size="16" class="icon-accent" />
          <h3 class="synopsis-title">Sinopsis & Alur Cerita</h3>
        </div>
      </div>

      <div class="synopsis-body" :class="{ collapsed: !isExpanded }">
        <p class="synopsis-text">{{ synopsis }}</p>
      </div>

      <button
        type="button"
        class="toggle-expand-btn"
        @click="isExpanded = !isExpanded"
      >
        <span>{{ isExpanded ? 'Tutup Ringkasan' : 'Baca Selengkapnya' }}</span>
        <component :is="isExpanded ? ChevronUp : ChevronDown" :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.detail-synopsis-section {
  padding-top: 20px;
}

.synopsis-card {
  background: transparent;
  border-top: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-bottom: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.synopsis-header {
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

.synopsis-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.synopsis-body {
  position: relative;
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
}

.synopsis-body.collapsed {
  max-height: 4.8em;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(180deg, #000 60%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 60%, transparent 100%);
}

.synopsis-text {
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
}

.toggle-expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--kura-accent, #e5a93c);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
  align-self: flex-start;
}

.toggle-expand-btn:hover {
  text-decoration: underline;
}
</style>
