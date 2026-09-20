<script setup>
import { LayoutGrid, List } from 'lucide-vue-next';

defineProps({
  modelValue: {
    type: String,
    default: 'grid', // 'grid' | 'list'
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

function setMode(mode) {
  emit('update:modelValue', mode);
  emit('change', mode);
}
</script>

<template>
  <div class="kura-view-toggle" role="group" aria-label="Pilihan Tampilan">
    <button
      type="button"
      class="toggle-btn"
      :class="{ 'is-active': modelValue === 'grid' }"
      title="Tampilan Grid (Kotak)"
      aria-label="Tampilan Grid"
      @click="setMode('grid')"
    >
      <LayoutGrid :size="16" />
    </button>
    <button
      type="button"
      class="toggle-btn"
      :class="{ 'is-active': modelValue === 'list' }"
      title="Tampilan List (Daftar)"
      aria-label="Tampilan List"
      @click="setMode('list')"
    >
      <List :size="16" />
    </button>
  </div>
</template>

<style scoped>
.kura-view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--kura-text-muted);
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.toggle-btn:hover {
  color: var(--kura-text-primary);
}

.toggle-btn.is-active {
  background: var(--kura-surface-hover);
  color: var(--kura-accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
</style>
