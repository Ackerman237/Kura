<script setup>
import { ref, computed } from 'vue';
import { ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-vue-next';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
    default: 1,
  },
  totalPages: {
    type: Number,
    required: true,
    default: 1,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  showQuickJump: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['change-page']);

const jumpInput = ref('');

// Generate numeric pagination sequence with smart ellipses (Kura Pagination Engine)
const paginationItems = computed(() => {
  const current = Math.max(1, props.currentPage);
  const total = Math.max(1, props.totalPages);

  if (total <= 1) return [1];

  const pagesSet = new Set();
  pagesSet.add(1);
  pagesSet.add(total);

  // Desktop window: current - 2 to current + 2
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) {
      pagesSet.add(i);
    }
  }

  const sortedPages = Array.from(pagesSet).sort((a, b) => a - b);
  const items = [];

  for (let i = 0; i < sortedPages.length; i++) {
    const pageNum = sortedPages[i];
    if (i > 0) {
      const prevPageNum = sortedPages[i - 1];
      if (pageNum - prevPageNum === 2) {
        items.push({ type: 'page', number: prevPageNum + 1 });
      } else if (pageNum - prevPageNum > 2) {
        items.push({ type: 'ellipsis', key: `ellipsis-${prevPageNum}` });
      }
    }
    items.push({ type: 'page', number: pageNum });
  }

  return items;
});

const handlePageClick = (page) => {
  if (props.disabled || page === props.currentPage || page < 1 || page > props.totalPages) return;
  emit('change-page', page);
};

const handleJumpSubmit = () => {
  const target = parseInt(jumpInput.value, 10);
  if (!isNaN(target) && target >= 1 && target <= props.totalPages && target !== props.currentPage) {
    emit('change-page', target);
    jumpInput.value = '';
  }
};
</script>

<template>
  <nav v-if="totalPages > 1" class="kura-pagination-bar" aria-label="Navigasi Halaman">
    <div class="pagination-controls">
      <!-- Previous Button -->
      <button
        type="button"
        class="nav-arrow-btn"
        :disabled="currentPage <= 1 || disabled"
        title="Halaman Sebelumnya"
        @click="handlePageClick(currentPage - 1)"
      >
        <ChevronLeft :size="16" />
        <span class="btn-text-desktop">Sebelumnya</span>
      </button>

      <!-- Page Numbers & Ellipses -->
      <div class="pages-strip">
        <template v-for="(item, idx) in paginationItems" :key="item.key || item.number || idx">
          <button
            v-if="item.type === 'page'"
            type="button"
            class="page-number-btn"
            :class="{ active: item.number === currentPage }"
            :disabled="disabled"
            @click="handlePageClick(item.number)"
          >
            {{ item.number }}
          </button>

          <span v-else-if="item.type === 'ellipsis'" class="page-ellipsis-span">
            …
          </span>
        </template>
      </div>

      <!-- Next Button -->
      <button
        type="button"
        class="nav-arrow-btn"
        :disabled="currentPage >= totalPages || disabled"
        title="Halaman Berikutnya"
        @click="handlePageClick(currentPage + 1)"
      >
        <span class="btn-text-desktop">Berikutnya</span>
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Quick Jump to Page Box -->
    <div v-if="showQuickJump && totalPages > 4" class="quick-jump-wrap">
      <span class="jump-label">Lompat ke</span>
      <div class="jump-input-box">
        <input
          v-model="jumpInput"
          type="number"
          min="1"
          :max="totalPages"
          placeholder="Hal"
          class="jump-num-input"
          @keyup.enter="handleJumpSubmit"
        />
        <button
          type="button"
          class="jump-go-btn"
          :disabled="!jumpInput || disabled"
          title="Lompat"
          @click="handleJumpSubmit"
        >
          <CornerDownLeft :size="12" />
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.kura-pagination-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 0;
  width: 100%;
  user-select: none;
}

@media (min-width: 640px) {
  .kura-pagination-bar {
    flex-direction: row;
    gap: 1.5rem;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.35rem 0.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.pagination-controls::-webkit-scrollbar {
  display: none;
}

/* Prev / Next Arrows */
.nav-arrow-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: none;
  color: var(--kura-text-secondary);
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast), opacity var(--duration-fast);
  white-space: nowrap;
}

.nav-arrow-btn:hover:not(:disabled) {
  background: var(--kura-surface-hover);
  color: var(--kura-accent);
}

.nav-arrow-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-text-desktop {
  display: none;
}

@media (min-width: 520px) {
  .btn-text-desktop {
    display: inline;
  }
}

/* Page Numbers Strip */
.pages-strip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-number-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  color: var(--kura-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast), opacity var(--duration-fast);
}

.page-number-btn:hover:not(:disabled):not(.active) {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
  border-color: var(--kura-border-subtle);
}

.page-number-btn.active {
  background: var(--kura-accent);
  color: #000000;
  border-color: var(--kura-accent);
  font-weight: 800;
  box-shadow: 0 2px 10px rgba(255, 107, 0, 0.4);
}

.page-number-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.page-ellipsis-span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  color: var(--kura-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

/* Quick Jump */
.quick-jump-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.76rem;
  color: var(--kura-text-muted);
}

.jump-label {
  white-space: nowrap;
}

.jump-input-box {
  display: flex;
  align-items: center;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.2rem 0.3rem 0.2rem 0.6rem;
}

.jump-num-input {
  width: 48px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--kura-text-primary);
  font-size: 0.78rem;
  font-weight: 600;
  -moz-appearance: textfield;
}

.jump-num-input::-webkit-outer-spin-button,
.jump-num-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.jump-go-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--kura-accent);
  color: #000;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast), opacity var(--duration-fast);
}

.jump-go-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: scale(1.05);
}

.jump-go-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
