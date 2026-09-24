<script setup>
import { ChevronRight } from 'lucide-vue-next';

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  badge: {
    type: [String, Number],
    default: null,
  },
  actionText: {
    type: String,
    default: '',
  },
  actionHref: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['action-click']);
</script>

<template>
  <div class="kura-section-header">
    <div class="header-left">
      <div class="title-wrap">
        <h2 class="section-title">{{ title }}</h2>
        <span v-if="badge !== null" class="section-badge">{{ badge }}</span>
      </div>
      <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
    </div>

    <div class="header-right">
      <slot name="actions" />
      <button
        v-if="actionText"
        type="button"
        class="action-link"
        @click="emit('action-click')"
      >
        <span>{{ actionText }}</span>
        <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.kura-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--kura-border-subtle);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-family: var(--kura-font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--kura-text-primary);
  letter-spacing: -0.01em;
  margin: 0;
}

.section-badge {
  font-family: var(--kura-font-mono);
  font-size: var(--text-2xs);
  font-weight: 600;
  color: var(--kura-accent);
  background: rgba(229, 169, 60, 0.12);
  border: 1px solid rgba(229, 169, 60, 0.25);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

.section-subtitle {
  font-family: var(--kura-font-sans);
  font-size: var(--text-xs);
  color: var(--kura-text-muted);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--kura-text-muted);
  font-family: var(--kura-font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out);
}

.action-link:hover {
  color: var(--kura-accent);
  transform: translateX(2px);
}
</style>
