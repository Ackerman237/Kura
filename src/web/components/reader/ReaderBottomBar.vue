<script setup>
import { Rows, FileText, Play, Pause, LayoutGrid, Sliders } from 'lucide-vue-next';

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  mode: {
    type: String,
    default: 'strip', // 'strip' | 'paged'
  },
  isAutoPlaying: {
    type: Boolean,
    default: false,
  },
  showScrubber: {
    type: Boolean,
    default: false,
  },
  visible: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'update:currentPage',
  'update:mode',
  'toggle-autoplay',
  'toggle-scrubber',
  'open-settings',
]);

function handleSliderChange(e) {
  emit('update:currentPage', parseInt(e.target.value, 10));
}
</script>

<template>
  <nav
    class="reader-bottom-dock"
    :class="{ 'bar-hidden': !visible }"
    @click.stop
  >
    <div class="dock-inner">
      <!-- Page Slider & Number Indicator -->
      <div class="page-slider-group">
        <span class="page-indicator-text">
          <span class="curr-num">{{ currentPage }}</span> / {{ totalPages }}
        </span>
        <input
          type="range"
          min="1"
          :max="totalPages"
          :value="currentPage"
          class="page-range-slider"
          aria-label="Penggeser Halaman"
          @input="handleSliderChange"
        />
      </div>

      <div class="dock-divider"></div>

      <!-- Mode Switcher (Webtoon / Halaman) -->
      <div class="mode-toggle-group">
        <button
          type="button"
          class="mode-btn"
          :class="{ active: mode === 'strip' }"
          title="Mode Webtoon (Vertikal)"
          @click="emit('update:mode', 'strip')"
        >
          <Rows :size="15" />
          <span class="hide-mobile">Webtoon</span>
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ active: mode === 'paged' }"
          title="Mode Halaman (Per Lembar)"
          @click="emit('update:mode', 'paged')"
        >
          <FileText :size="15" />
          <span class="hide-mobile">Halaman</span>
        </button>
      </div>

      <div class="dock-divider"></div>

      <!-- Autoplay Button -->
      <button
        type="button"
        class="dock-icon-btn"
        :class="{ active: isAutoPlaying }"
        :title="isAutoPlaying ? 'Jeda Auto-Play (Spasi)' : 'Mulai Auto-Play (Spasi)'"
        @click="emit('toggle-autoplay')"
      >
        <component :is="isAutoPlaying ? Pause : Play" :size="16" />
      </button>

      <!-- Scrubber Drawer Button -->
      <button
        type="button"
        class="dock-icon-btn"
        :class="{ active: showScrubber }"
        title="Buka Laci Thumbnail Halaman"
        @click="emit('toggle-scrubber')"
      >
        <LayoutGrid :size="16" />
      </button>

      <!-- Settings Button -->
      <button
        type="button"
        class="dock-icon-btn"
        title="Pengaturan Tampilan & Kecepatan"
        @click="emit('open-settings')"
      >
        <Sliders :size="16" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.reader-bottom-dock {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.reader-bottom-dock.bar-hidden {
  transform: translate(-50%, calc(100% + 32px));
  opacity: 0;
  pointer-events: none;
}

.dock-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(18, 20, 26, 0.9);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2);
}

.page-slider-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-indicator-text {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.8rem;
  color: var(--kura-text-muted, #aaaaaa);
  white-space: nowrap;
}

.page-indicator-text .curr-num {
  color: #ffffff;
  font-weight: 700;
}

.page-range-slider {
  width: 100px;
  height: 4px;
  accent-color: var(--kura-accent, #e5a93c);
  cursor: pointer;
}

.dock-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.12);
}

.mode-toggle-group {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px;
  border-radius: var(--radius-pill, 9999px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-pill, 9999px);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--kura-text-muted, #aaaaaa);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.mode-btn:hover {
  color: #ffffff;
}

.mode-btn.active {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}

.dock-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--kura-text-muted, #aaaaaa);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.dock-icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.dock-icon-btn.active {
  background: rgba(229, 169, 60, 0.2);
  border-color: rgba(229, 169, 60, 0.5);
  color: var(--kura-accent, #e5a93c);
}

@media (max-width: 600px) {
  .page-range-slider {
    width: 60px;
  }
  .hide-mobile {
    display: none;
  }
  .dock-inner {
    gap: 6px;
    padding: 6px 10px;
  }
}
</style>
