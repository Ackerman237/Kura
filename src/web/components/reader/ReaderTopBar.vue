<script setup>
import { computed } from 'vue';
import { ArrowLeft, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps({
  title: {
    type: String,
    default: 'Manga Chapter',
  },
  chapterNumber: {
    type: [Number, String],
    default: '1',
  },
  chapterId: {
    type: [Number, String],
    default: '',
  },
  chapterList: {
    type: Array,
    default: () => [],
  },
  isFullscreen: {
    type: Boolean,
    default: false,
  },
  visible: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'close',
  'select-chapter',
  'prev-chapter',
  'next-chapter',
  'toggle-fullscreen',
]);

const cleanTitle = computed(() => {
  return (props.title || 'Manga Chapter').trim();
});
</script>

<template>
  <header
    class="reader-topbar"
    :class="{ 'bar-hidden': !visible }"
    @click.stop
  >
    <!-- Left Navigation & Title -->
    <div class="topbar-left">
      <button
        type="button"
        class="topbar-btn back-btn"
        title="Kembali (Esc)"
        aria-label="Kembali"
        @click="emit('close')"
      >
        <ArrowLeft :size="18" />
      </button>

      <div class="title-wrap">
        <h1 class="reader-comic-title" :title="cleanTitle">
          {{ cleanTitle }}
        </h1>
        <span class="chapter-badge">Bab {{ chapterNumber }}</span>
      </div>
    </div>

    <!-- Center / Right: Chapter Select & Fullscreen -->
    <div class="topbar-right">
      <!-- Chapter Jump Dropdown -->
      <div v-if="chapterList && chapterList.length > 1" class="chapter-selector-wrap">
        <select
          class="chapter-select-dropdown"
          :value="chapterId"
          aria-label="Pilih Bab"
          @change="emit('select-chapter', $event.target.value)"
        >
          <option
            v-for="ch in chapterList"
            :key="ch.id || ch.chapterNumber"
            :value="ch.id || ch.chapterNumber"
          >
            {{ ch.title || `Bab ${ch.chapterNumber}` }}
          </option>
        </select>
      </div>

      <!-- Quick Prev/Next Chapter Buttons -->
      <div class="quick-chapter-nav">
        <button
          type="button"
          class="topbar-btn icon-only"
          title="Bab Sebelumnya"
          @click="emit('prev-chapter')"
        >
          <ChevronLeft :size="16" />
        </button>
        <button
          type="button"
          class="topbar-btn icon-only"
          title="Bab Selanjutnya"
          @click="emit('next-chapter')"
        >
          <ChevronRight :size="16" />
        </button>
      </div>

      <!-- Fullscreen Toggle -->
      <button
        type="button"
        class="topbar-btn icon-only"
        :title="isFullscreen ? 'Keluar Layar Penuh (F)' : 'Layar Penuh (F)'"
        @click="emit('toggle-fullscreen')"
      >
        <component :is="isFullscreen ? Minimize2 : Maximize2" :size="16" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.reader-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: rgba(14, 16, 22, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.reader-topbar.bar-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.reader-comic-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380px;
  line-height: 1.2;
}

.chapter-badge {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(229, 169, 60, 0.15);
  color: var(--kura-accent, #e5a93c);
  border: 1px solid rgba(229, 169, 60, 0.3);
}

.topbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border-radius: var(--radius-md, 8px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--kura-text-muted, #aaaaaa);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.topbar-btn.icon-only {
  width: 34px;
  padding: 0;
}

.topbar-btn.back-btn {
  width: 34px;
  padding: 0;
}

.topbar-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.chapter-selector-wrap {
  position: relative;
}

.chapter-select-dropdown {
  height: 34px;
  padding: 0 10px;
  border-radius: var(--radius-md, 8px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-family: inherit;
  font-size: 0.8rem;
  outline: none;
  cursor: pointer;
  max-width: 150px;
}

.chapter-select-dropdown:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.chapter-select-dropdown option {
  background: #181a20;
  color: #ffffff;
}

.quick-chapter-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .reader-comic-title {
    max-width: 160px;
    font-size: 0.82rem;
  }
  .chapter-badge {
    display: none;
  }
  .quick-chapter-nav {
    display: none;
  }
  .chapter-select-dropdown {
    max-width: 100px;
    font-size: 0.75rem;
    padding: 0 6px;
  }
}
</style>
