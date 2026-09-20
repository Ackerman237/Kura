<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Filter, Search, Check, X, RotateCcw, ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  genres: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'Genre',
  },
  placeholder: {
    type: String,
    default: 'Cari genre...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'apply', 'reset']);

const isOpen = ref(false);
const searchQuery = ref('');
const dropdownRef = ref(null);

// Local staged selection before user clicks "Terapkan"
const selectedGenres = ref([...props.modelValue]);

const activeCount = computed(() => props.modelValue.length);

const filteredGenres = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.genres;
  return props.genres.filter((g) => {
    const name = (typeof g === 'string' ? g : g.name || g.slug || '').toLowerCase();
    return name.includes(q);
  });
});

const isSelected = (genre) => {
  const slug = typeof genre === 'string' ? genre : genre.slug || genre.name;
  return selectedGenres.value.includes(slug);
};

const toggleGenre = (genre) => {
  const slug = typeof genre === 'string' ? genre : genre.slug || genre.name;
  const idx = selectedGenres.value.indexOf(slug);
  if (idx >= 0) {
    selectedGenres.value.splice(idx, 1);
  } else {
    selectedGenres.value.push(slug);
  }
};

const clearAll = () => {
  selectedGenres.value = [];
};

const applyFilter = () => {
  emit('update:modelValue', [...selectedGenres.value]);
  emit('apply', [...selectedGenres.value]);
  isOpen.value = false;
};

const resetAndApply = () => {
  selectedGenres.value = [];
  emit('update:modelValue', []);
  emit('reset');
  emit('apply', []);
  isOpen.value = false;
};

const toggleDropdown = () => {
  if (props.disabled) return;
  if (!isOpen.value) {
    selectedGenres.value = [...props.modelValue];
    searchQuery.value = '';
  }
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

const handleKeydown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div ref="dropdownRef" class="genre-filter-dropdown">
    <!-- Trigger Button -->
    <button
      type="button"
      class="genre-trigger-btn"
      :class="{
        'is-active': activeCount > 0,
        'is-open': isOpen,
      }"
      :disabled="disabled"
      @click="toggleDropdown"
    >
      <Filter :size="14" class="trigger-icon" />
      <span class="trigger-label">
        {{ title }}
        <span v-if="activeCount > 0" class="genre-count-badge">{{ activeCount }}</span>
      </span>
      <ChevronDown :size="13" class="chevron-icon" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Floating Dropdown Panel -->
    <Transition name="dropdown-pop">
      <div v-if="isOpen" class="genre-panel-card" @click.stop>
        <!-- Panel Header & Search -->
        <div class="panel-header">
          <div class="header-top-row">
            <span class="panel-title">Filter {{ title }}</span>
            <div class="header-actions">
              <button
                v-if="selectedGenres.length > 0"
                type="button"
                class="header-clear-btn"
                @click="clearAll"
              >
                <RotateCcw :size="12" />
                <span>Bersihkan</span>
              </button>
              <button type="button" class="close-panel-btn" @click="isOpen = false">
                <X :size="14" />
              </button>
            </div>
          </div>

          <!-- Quick Search -->
          <div class="genre-search-wrap">
            <Search :size="14" class="search-svg" />
            <input
              v-model="searchQuery"
              type="text"
              class="genre-search-input"
              :placeholder="placeholder"
              autofocus
            />
            <button
              v-if="searchQuery"
              type="button"
              class="clear-search-btn"
              @click="searchQuery = ''"
            >
              <X :size="12" />
            </button>
          </div>
        </div>

        <!-- Genres Checkbox / Tag Cloud -->
        <div class="panel-body">
          <div v-if="filteredGenres.length === 0" class="empty-genres">
            Tidak ada genre "{{ searchQuery }}"
          </div>

          <div v-else class="genres-grid">
            <button
              v-for="g in filteredGenres"
              :key="typeof g === 'string' ? g : g.slug || g.name"
              type="button"
              class="genre-check-pill"
              :class="{ selected: isSelected(g) }"
              @click="toggleGenre(g)"
            >
              <span class="custom-checkbox">
                <Check v-if="isSelected(g)" :size="11" />
              </span>
              <span class="genre-text">
                {{ typeof g === 'string' ? g : g.name || g.slug }}
              </span>
              <span v-if="typeof g === 'object' && g.count" class="genre-badge-count">
                {{ g.count }}
              </span>
            </button>
          </div>
        </div>

        <!-- Panel Footer with Action Buttons -->
        <div class="panel-footer">
          <span class="selected-status-text">
            {{ selectedGenres.length }} dipilih
          </span>

          <div class="footer-btn-group">
            <button
              type="button"
              class="btn-reset"
              @click="resetAndApply"
            >
              Reset
            </button>
            <button
              type="button"
              class="btn-apply"
              @click="applyFilter"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.genre-filter-dropdown {
  position: relative;
  display: inline-block;
}

/* Trigger Button */
.genre-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-secondary);
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
  user-select: none;
}

.genre-trigger-btn:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
  border-color: var(--kura-border-strong);
}

.genre-trigger-btn.is-active {
  background: var(--kura-accent-muted, rgba(255, 107, 0, 0.12));
  color: var(--kura-accent);
  border-color: var(--kura-accent);
  box-shadow: 0 0 10px rgba(255, 107, 0, 0.15);
}

.genre-trigger-btn.is-open {
  border-color: var(--kura-accent);
}

.genre-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--kura-accent);
  color: #000;
  font-size: 0.65rem;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--radius-pill);
  margin-left: 0.25rem;
}

.chevron-icon {
  transition: transform var(--duration-fast);
  color: var(--kura-text-muted);
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Floating Dropdown Panel */
.genre-panel-card {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 340px;
  max-width: 90vw;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  z-index: 80;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 480px) {
  .genre-panel-card {
    position: fixed;
    top: auto;
    bottom: 20px;
    left: 16px;
    right: 16px;
    width: auto;
    max-height: 80vh;
  }
}

/* Header */
.panel-header {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--kura-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: rgba(0, 0, 0, 0.15);
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--kura-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: none;
  color: var(--kura-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast);
}

.header-clear-btn:hover {
  color: var(--kura-accent);
}

.close-panel-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: transparent;
  border: none;
  color: var(--kura-text-muted);
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.close-panel-btn:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
}

/* Search input */
.genre-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-md);
  padding: 0.4rem 0.65rem;
  transition: border-color var(--duration-fast);
}

.genre-search-wrap:focus-within {
  border-color: var(--kura-accent);
}

.search-svg {
  color: var(--kura-text-muted);
  flex-shrink: 0;
}

.genre-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--kura-text-primary);
  font-size: 0.8rem;
  min-width: 0;
}

.clear-search-btn {
  background: transparent;
  border: none;
  color: var(--kura-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* Body / List */
.panel-body {
  padding: 0.85rem;
  max-height: 260px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.empty-genres {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.78rem;
  color: var(--kura-text-muted);
}

.genres-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.genre-check-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-secondary);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: 0.74rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.genre-check-pill:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
  border-color: var(--kura-border-strong);
}

.genre-check-pill.selected {
  background: var(--kura-accent-muted, rgba(255, 107, 0, 0.15));
  color: var(--kura-accent);
  border-color: var(--kura-accent);
  font-weight: 600;
}

.custom-checkbox {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  border: 1px solid var(--kura-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  flex-shrink: 0;
}

.genre-check-pill.selected .custom-checkbox {
  background: var(--kura-accent);
  border-color: var(--kura-accent);
  color: #000;
}

.genre-badge-count {
  font-size: 0.65rem;
  opacity: 0.6;
}

/* Footer */
.panel-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--kura-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
}

.selected-status-text {
  font-size: 0.74rem;
  color: var(--kura-text-muted);
}

.footer-btn-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-reset {
  background: transparent;
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-secondary);
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-pill);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.btn-reset:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
}

.btn-apply {
  background: var(--kura-accent);
  color: #000;
  border: none;
  padding: 0.35rem 0.9rem;
  border-radius: var(--radius-pill);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 107, 0, 0.3);
  transition: all var(--duration-fast);
}

.btn-apply:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* Animations */
.dropdown-pop-enter-active,
.dropdown-pop-leave-active {
  transition: opacity 0.18s var(--ease-out), transform 0.18s var(--ease-out);
}

.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
