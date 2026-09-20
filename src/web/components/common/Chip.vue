<script setup>
import { X } from 'lucide-vue-next';

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  count: {
    type: [Number, String],
    default: null,
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click', 'dismiss']);
</script>

<template>
  <button
    type="button"
    class="kura-chip"
    :class="{ 'is-active': active }"
    @click="emit('click')"
  >
    <span class="chip-label">
      <slot />
    </span>

    <span v-if="count !== null" class="chip-count">
      {{ count }}
    </span>

    <span
      v-if="dismissible"
      class="chip-dismiss"
      role="button"
      tabindex="0"
      @click.stop="emit('dismiss')"
    >
      <X :size="12" />
    </span>
  </button>
</template>

<style scoped>
.kura-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  font-family: var(--kura-font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--kura-text-muted);
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-pill);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: all var(--duration-fast) var(--ease-out);
}

.kura-chip:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
  border-color: var(--kura-border-strong);
  transform: translateY(-1px);
}

.kura-chip.is-active {
  background: var(--kura-text-primary);
  color: var(--kura-text-inverse, #0c0d10);
  border-color: var(--kura-text-primary);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.15);
}

.chip-count {
  font-size: var(--text-2xs);
  padding: 1px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-pill);
  opacity: 0.8;
}

.is-active .chip-count {
  background: rgba(0, 0, 0, 0.15);
  color: var(--kura-text-inverse, #0c0d10);
}

.chip-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity var(--duration-fast);
}

.chip-dismiss:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.2);
}
</style>
