<script setup>
import { ref } from 'vue';
import { Search, X } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Cari komik, manhwa, genre (tekan Ctrl+K)...',
  },
  showShortcut: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'search', 'clear']);

const inputRef = ref(null);

function handleInput(e) {
  emit('update:modelValue', e.target.value);
}

function handleFormSubmit(e) {
  e.preventDefault();
  emit('search', props.modelValue);
}

function handleClear() {
  emit('update:modelValue', '');
  emit('clear');
  if (inputRef.value) {
    inputRef.value.focus();
  }
}

function focus() {
  if (inputRef.value) {
    inputRef.value.focus();
  }
}

defineExpose({ focus, inputRef });
</script>

<template>
  <form class="kura-search-bar" role="search" @submit="handleFormSubmit">
    <!-- Clickable Search Submit Button -->
    <button
      type="submit"
      class="search-submit-btn"
      title="Mulai Pencarian"
      aria-label="Cari"
    >
      <Search :size="16" />
    </button>

    <!-- Search Input Field -->
    <input
      ref="inputRef"
      type="text"
      class="search-input"
      :value="modelValue"
      :placeholder="placeholder"
      aria-label="Pencarian"
      @input="handleInput"
    />

    <!-- Clear Query Button (X) -->
    <button
      v-if="modelValue"
      type="button"
      class="search-clear-btn"
      title="Hapus pencarian"
      aria-label="Hapus kata kunci pencarian"
      @click="handleClear"
    >
      <X :size="14" />
    </button>

    <!-- Desktop Shortcut Pill -->
    <span v-else-if="showShortcut" class="search-shortcut-pill" aria-hidden="true">
      Ctrl K
    </span>
  </form>
</template>

<style scoped>
.kura-search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 38px;
  background: var(--kura-surface, rgba(22, 24, 30, 0.75));
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-pill, 9999px);
  padding: 0 10px 0 6px;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.kura-search-bar:focus-within {
  border-color: var(--kura-accent, #e5a93c);
  background: var(--kura-surface-hover, rgba(30, 33, 42, 0.95));
  box-shadow: 0 0 0 3px var(--kura-accent-glow, rgba(229, 169, 60, 0.2));
}

.search-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--kura-text-muted, #888888);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  padding: 0;
}

.search-submit-btn:hover {
  color: var(--kura-accent, #e5a93c);
  background: rgba(255, 255, 255, 0.08);
}

.search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: var(--kura-text-primary, #ffffff);
  font-family: var(--kura-font-sans, system-ui, sans-serif);
  font-size: 0.85rem;
  padding: 0 8px;
  outline: none;
}

.search-input::placeholder {
  color: var(--kura-text-muted, #777777);
  font-size: 0.82rem;
}

.search-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: var(--kura-text-muted, #aaaaaa);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  padding: 0;
}

.search-clear-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.search-shortcut-pill {
  font-family: var(--kura-font-mono, monospace);
  font-size: 10px;
  color: var(--kura-text-muted, #777777);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  user-select: none;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .search-shortcut-pill {
    display: none;
  }
}
</style>
