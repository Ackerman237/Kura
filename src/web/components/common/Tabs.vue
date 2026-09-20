<script setup>
defineProps({
  items: {
    type: Array,
    required: true, // [{ id: 'today', label: 'Hari ini' }, ...]
  },
  modelValue: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'sm', // 'sm' | 'md'
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

function selectTab(id) {
  emit('update:modelValue', id);
  emit('change', id);
}
</script>

<template>
  <div class="kura-tabs" :class="`size-${size}`" role="tablist">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.id"
      class="tab-btn"
      :class="{ 'is-active': modelValue === item.id }"
      @click="selectTab(item.id)"
    >
      <component :is="item.icon" v-if="item.icon" :size="14" class="tab-icon" />
      <span>{{ item.label }}</span>
      <span v-if="item.count" class="tab-badge">{{ item.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.kura-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-pill);
  padding: 3px;
  user-select: none;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--kura-text-muted);
  font-family: var(--kura-font-sans);
  font-weight: 500;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  white-space: nowrap;
}

.size-sm .tab-btn {
  font-size: var(--text-xs);
  padding: 5px 12px;
  height: 28px;
}

.size-md .tab-btn {
  font-size: var(--text-sm);
  padding: 6px 16px;
  height: 34px;
}

.tab-btn:hover {
  color: var(--kura-text-primary);
}

.tab-btn.is-active {
  background: var(--kura-surface-hover);
  color: var(--kura-accent);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.tab-badge {
  font-size: 0.625rem;
  padding: 1px 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-pill);
}

.tab-btn.is-active .tab-badge {
  background: var(--kura-accent);
  color: var(--kura-text-inverse, #0c0d10);
}
</style>
