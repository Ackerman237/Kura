<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useVirtualList, useFullscreen } from '@vueuse/core';
import { saveReadingProgress } from '../../services/storage.js';
import {
  ArrowLeft,
  Rows,
  FileText,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  ZoomIn,
  Sliders,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Play,
  Pause,
  LayoutGrid,
  X,
} from 'lucide-vue-next';
import ReaderSettingsModal from './ReaderSettingsModal.vue';

import { useReaderEngine } from '../../composables/useReaderEngine.js';

const props = defineProps({
  mangaSlug: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'Manga Chapter',
  },
  chapterId: {
    type: [Number, String],
    default: '',
  },
  chapterNumber: {
    type: [Number, String],
    default: '1',
  },
  images: {
    type: Array,
    required: true,
  },
  chapterList: {
    type: Array,
    default: () => [],
  },
  thumb: {
    type: String,
    default: '',
  },
  cover: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'nextChapter', 'prevChapter', 'selectChapter']);

// UI State
const showControls = ref(true);
const mode = ref('strip'); // 'strip' (vertical continuous scroll) | 'paged' (single page)
const fitMode = ref('width'); // 'width' | 'height' | 'original'
const currentPage = ref(1);
let hideTimer = null;

// Fullscreen API
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

function goToPage(page) {
  currentPage.value = page;
  if (mode.value === 'strip') {
    scrollTo(page - 1);
  }
}

// Track reading progress
const persistProgress = (page) => {
  if (props.mangaSlug) {
    saveReadingProgress(props.mangaSlug, {
      chapterId: props.chapterId || props.chapterNumber,
      chapterNumber: props.chapterNumber,
      pageIndex: page,
      title: props.title,
      thumb: props.thumb,
      cover: props.cover,
    });
  }
};

watch(currentPage, (val) => {
  persistProgress(val);
});

// Auto-hide chrome timer (4 seconds)
const resetHideTimer = () => {
  showControls.value = true;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    showControls.value = false;
  }, 4000);
};

// Proxy external CDN images through server to bypass CORS & hotlink protection
const formatImageUrl = (src) => {
  if (!src || typeof src !== 'string') return '';
  if (src.startsWith('/api/image-proxy') || src.startsWith('data:')) {
    return src;
  }
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
};

const onPageError = (event, originalSrc) => {
  const target = event.target;
  const attempts = Number(target.getAttribute('data-retry-count') || '0');
  if (attempts < 2) {
    target.setAttribute('data-retry-count', String(attempts + 1));
    const cleanUrl = originalSrc || target.src;
    const retryUrl = cleanUrl.includes('/api/image-proxy')
      ? `${cleanUrl}&retry=${attempts + 1}`
      : `/api/image-proxy?url=${encodeURIComponent(cleanUrl)}&retry=${attempts + 1}`;
    setTimeout(() => {
      target.src = retryUrl;
    }, 1200);
  }
};

const processedImages = computed(() => {
  return props.images.map((src) => formatImageUrl(src));
});

// Virtual List setup for 200+ images (Windowing DOM)
const { list: virtualImages, containerProps, wrapperProps, scrollTo } = useVirtualList(
  computed(() => processedImages.value.map((src, index) => ({ index: index + 1, src }))),
  {
    itemHeight: 1000,
    overscan: 3,
  }
);

// Paged mode state
const currentPagedImage = computed(() => {
  return processedImages.value[currentPage.value - 1] || null;
});

const totalPages = computed(() => processedImages.value.length || 1);

const nextPaged = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  } else {
    emit('nextChapter');
  }
};

const prevPaged = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  } else {
    emit('prevChapter');
  }
};

// Reader Engine (Settings, Auto-Play & Persistence)
const {
  readerSettings,
  isAutoPlaying,
  isSettingsOpen,
  showThumbScrubber,
  toggleAutoPlay,
} = useReaderEngine({
  mode,
  fitMode,
  containerRef: containerProps?.ref,
  onNextPaged: nextPaged,
});

// Page Slider Jump
const onSliderChange = (e) => {
  const page = parseInt(e.target.value, 10);
  currentPage.value = page;
  if (mode.value === 'strip') {
    scrollTo(page - 1);
  }
};

// Chapter dropdown change
const onChapterSelect = (e) => {
  const selectedId = e.target.value;
  const targetCh = props.chapterList.find((c) => (c.id || c.slug) === selectedId);
  if (targetCh) {
    emit('selectChapter', targetCh);
  }
};

// Tap zone interaction for paged mode
const handleCanvasTap = (e) => {
  resetHideTimer();
  if (mode.value !== 'paged') return;

  const width = window.innerWidth;
  const clickX = e.clientX;

  if (clickX < width * 0.3) {
    prevPaged();
  } else if (clickX > width * 0.7) {
    nextPaged();
  } else {
    showControls.value = !showControls.value;
  }
};

const scrollProgress = computed(() => {
  if (mode.value === 'paged') {
    return Math.round((currentPage.value / totalPages.value) * 100);
  }
  return Math.min(100, Math.round((currentPage.value / Math.max(1, totalPages.value)) * 100));
});

// Keyboard navigation
const handleKeydown = (e) => {
  resetHideTimer();
  if (e.key === 'ArrowRight' || e.key === 'd') {
    nextPaged();
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    prevPaged();
  } else if (e.key === ']' || e.key === '}') {
    emit('nextChapter');
  } else if (e.key === '[' || e.key === '{') {
    emit('prevChapter');
  } else if (e.key === 'f') {
    toggleFullscreen();
  } else if (e.key === 'm') {
    mode.value = mode.value === 'strip' ? 'paged' : 'strip';
  } else if (e.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  resetHideTimer();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (hideTimer) clearTimeout(hideTimer);
});
</script>

<template>
  <div
    class="kura-reader-viewport"
    :class="[
      `mode-${mode}`,
      `fit-${fitMode}`,
      { 'controls-hidden': !showControls }
    ]"
    @mousemove="resetHideTimer"
    @click="handleCanvasTap"
  >
    <!-- Reading Progress Indicator -->
    <div class="reader-progress-line" :style="{ width: `${scrollProgress}%` }"></div>

    <!-- 1. TOP FLOATING CONTROL BAR (Kura Immersive HUD Style) -->
    <header class="reader-top-bar" :class="{ visible: showControls }" @click.stop>
      <div class="top-bar-left">
        <button type="button" class="icon-btn back-btn" title="Kembali ke Detail" @click="emit('close')">
          <ArrowLeft :size="18" />
          <span class="btn-label">Kembali</span>
        </button>

        <div class="title-meta-group">
          <h2 class="reader-manga-title">{{ title }}</h2>
          <span class="reader-chapter-badge">Ch. {{ chapterNumber }}</span>
        </div>
      </div>

      <div class="top-bar-right">
        <!-- Chapter Selector Dropdown (if chapterList available) -->
        <div v-if="chapterList && chapterList.length" class="chapter-picker-wrap">
          <select class="chapter-select" :value="chapterId" @change="onChapterSelect">
            <option
              v-for="ch in chapterList"
              :key="ch.id || ch.slug"
              :value="ch.id || ch.slug"
            >
              {{ ch.title || `Chapter ${ch.chapterNumber}` }}
            </option>
          </select>
        </div>

        <!-- Mode Switcher: Long Strip vs Single Page -->
        <div class="mode-toggle-group">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: mode === 'strip' }"
            title="Mode Webtoon (Vertical Long-Strip)"
            @click="mode = 'strip'"
          >
            <Rows :size="15" />
            <span class="hide-mobile">Webtoon</span>
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: mode === 'paged' }"
            title="Mode Halaman Tunggal (Paged)"
            @click="mode = 'paged'"
          >
            <FileText :size="15" />
            <span class="hide-mobile">Halaman</span>
          </button>
        </div>

        <!-- Fit Mode Switcher -->
        <div class="fit-toggle-group hide-mobile">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: fitMode === 'width' }"
            title="Sesuaikan Lebar"
            @click="fitMode = 'width'"
          >
            Lebar
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: fitMode === 'original' }"
            title="Ukuran Asli"
            @click="fitMode = 'original'"
          >
            Asli
          </button>
        </div>

        <!-- Auto-Play Quick Action Button -->
        <button
          type="button"
          class="icon-btn"
          :class="{ active: isAutoPlaying }"
          :title="isAutoPlaying ? 'Jeda Auto-Scroll (Spasi)' : 'Mulai Auto-Scroll (Spasi)'"
          @click="toggleAutoPlay"
        >
          <component :is="isAutoPlaying ? Pause : Play" :size="15" />
          <span class="hide-mobile">{{ isAutoPlaying ? 'Jeda' : 'Auto-Play' }}</span>
        </button>

        <!-- Thumbnail Scrubber Drawer Toggle -->
        <button
          type="button"
          class="icon-btn"
          :class="{ active: showThumbScrubber }"
          title="Daftar Thumbnail Halaman"
          @click="showThumbScrubber = !showThumbScrubber"
        >
          <LayoutGrid :size="15" />
        </button>

        <!-- Reader Settings Modal Trigger (Requested by user) -->
        <button
          type="button"
          class="icon-btn"
          title="Pengaturan Ukuran Gambar & Kecepatan"
          @click="isSettingsOpen = true"
        >
          <Sliders :size="15" />
        </button>

        <!-- Fullscreen Toggle -->
        <button
          type="button"
          class="icon-btn"
          :title="isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'"
          @click="toggleFullscreen"
        >
          <component :is="isFullscreen ? Minimize2 : Maximize2" :size="16" />
        </button>
      </div>
    </header>

    <!-- 2. READING CANVAS -->

    <!-- MODE A: LONG-STRIP / WEBTOON CONTINUOUS VIRTUAL LIST -->
    <main v-if="mode === 'strip'" v-bind="containerProps" class="strip-canvas-container">
      <div v-bind="wrapperProps" class="strip-wrapper">
        <div
          v-for="item in virtualImages"
          :key="item.index"
          class="strip-page-item"
        >
          <img
            :src="item.data.src"
            :alt="`Halaman ${item.data.index}`"
            class="manga-page-img"
            :class="[`comfort-${readerSettings.comfortFilter}`]"
            :style="{
              maxWidth: readerSettings.maxWidthPreset === '100%' ? '100%' : `${readerSettings.customMaxWidth}px`,
            }"
            loading="lazy"
            decoding="async"
            @error="onPageError($event, item.data.src)"
          />
          <div class="page-number-watermark">
            <span>{{ item.data.index }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom End-of-Chapter Card -->
      <div class="end-chapter-card" @click.stop>
        <div class="end-chapter-inner">
          <p class="end-chapter-title">Selesai Membaca Chapter {{ chapterNumber }}</p>
          <p class="end-chapter-sub">Lanjut ke babak berikutnya untuk terus membaca</p>
          <div class="end-chapter-buttons">
            <button
              type="button"
              class="end-btn prev"
              @click.stop="emit('prevChapter')"
            >
              <ChevronLeft :size="16" />
              <span>Chapter Sebelumnya</span>
            </button>
            <button
              type="button"
              class="end-btn next"
              @click.stop="emit('nextChapter')"
            >
              <span>Chapter Selanjutnya</span>
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- MODE B: SINGLE PAGE HORIZONTAL / PAGED CANVAS -->
    <main v-else-if="mode === 'paged'" class="paged-canvas-container">
      <div class="paged-image-wrapper">
        <img
          v-if="currentPagedImage"
          :src="currentPagedImage"
          :alt="`Halaman ${currentPage}`"
          class="manga-page-img paged-img"
          decoding="async"
          @error="onPageError($event, currentPagedImage)"
        />
        <div v-else class="page-error-state">
          <p>Halaman tidak dapat dimuat</p>
        </div>
      </div>

      <!-- Quick Left/Right Arrow Overlays -->
      <button
        type="button"
        class="page-nav-arrow left"
        :disabled="currentPage <= 1"
        @click.stop="prevPaged"
      >
        <ChevronLeft :size="28" />
      </button>
      <button
        type="button"
        class="page-nav-arrow right"
        :disabled="currentPage >= totalPages"
        @click.stop="nextPaged"
      >
        <ChevronRight :size="28" />
      </button>
    </main>

    <!-- 3. BOTTOM FLOATING CONTROL BAR (Slider & Chapter Jumpers) -->
    <footer class="reader-bottom-bar" :class="{ visible: showControls }" @click.stop>
      <div class="bottom-bar-content">
        <!-- Prev Chapter Button -->
        <button
          type="button"
          class="chapter-nav-btn"
          title="Chapter Sebelumnya"
          @click="emit('prevChapter')"
        >
          <SkipBack :size="16" />
          <span class="hide-mobile">Chapter Sebelumnya</span>
        </button>

        <!-- Quick Page Slider -->
        <div class="page-slider-track">
          <span class="slider-val">1</span>
          <input
            type="range"
            min="1"
            :max="totalPages"
            :value="currentPage"
            class="page-range-input"
            @input="onSliderChange"
          />
          <span class="slider-val">{{ totalPages }}</span>
        </div>

        <!-- Next Chapter Button -->
        <button
          type="button"
          class="chapter-nav-btn highlight"
          title="Chapter Selanjutnya"
          @click="emit('nextChapter')"
        >
          <span class="hide-mobile">Chapter Selanjutnya</span>
          <SkipForward :size="16" />
        </button>
      </div>
    </footer>

    <!-- Floating Auto-Play HUD -->
    <Transition name="fade-hud">
      <div v-if="isAutoPlaying" class="floating-auto-hud" @click.stop="toggleAutoPlay">
        <Pause :size="14" />
        <span>Auto-Scroll ({{ readerSettings.autoScrollSpeed }}px/s) ÔÇó Jeda</span>
      </div>
    </Transition>

    <!-- Thumbnail Visual Scrubber Drawer -->
    <Transition name="slide-scrubber">
      <div v-if="showThumbScrubber" class="thumb-scrubber-drawer" @click.stop>
        <div class="scrubber-header">
          <span>Navigasi Cepat Halaman ({{ totalPages }} Halaman)</span>
          <button type="button" class="scrubber-close-btn" @click="showThumbScrubber = false">
            <X :size="14" />
          </button>
        </div>
        <div class="scrubber-track">
          <div
            v-for="(img, idx) in processedImages"
            :key="idx"
            class="scrubber-item"
            :class="{ active: currentPage === idx + 1 }"
            @click="goToPage(idx + 1)"
          >
            <img :src="img" class="scrubber-thumb-img" loading="lazy" />
            <span class="scrubber-num">{{ idx + 1 }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Reader Settings Modal -->
    <ReaderSettingsModal
      :is-open="isSettingsOpen"
      :settings="readerSettings"
      @close="isSettingsOpen = false"
      @update:settings="(s) => { readerSettings = s; if (s.readerMode) mode = s.readerMode; if (s.fitMode) fitMode = s.fitMode; }"
      @reset-settings="loadSavedSettings"
    />
  </div>
</template>

<style scoped>
.kura-reader-viewport {
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: #050507;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* 1. Top Control Bar */
.reader-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 56px;
  background: rgba(14, 15, 18, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  transform: translateY(0);
  transition: transform 0.25s var(--ease-spring);
}

.reader-top-bar:not(.visible) {
  transform: translateY(-100%);
}

.top-bar-left,
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  color: #fff;
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), transform var(--duration-fast);
}

.icon-btn:hover {
  background: var(--kura-surface-hover);
  border-color: var(--kura-accent);
  color: var(--kura-accent);
}

.title-meta-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reader-manga-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #fff;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reader-chapter-badge {
  background: var(--kura-accent);
  color: #000;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 800;
}

.chapter-picker-wrap {
  position: relative;
}

.chapter-select {
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  color: #fff;
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

.chapter-select:focus {
  border-color: var(--kura-accent);
}

.mode-toggle-group,
.fit-toggle-group {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-pill);
  padding: 2px;
  border: 1px solid var(--kura-border-subtle);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: none;
  color: var(--kura-text-muted);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast);
}

.toggle-btn.active {
  background: var(--kura-surface-active);
  color: var(--kura-accent);
}

.page-counter-pill {
  background: rgba(255, 255, 255, 0.08);
  color: var(--kura-text-secondary);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-pill);
}

/* 2. Reading Canvases */
.strip-canvas-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: #050507;
  scroll-behavior: smooth;
}

.strip-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding-top: 56px;
  padding-bottom: 72px;
}

.fit-width .strip-wrapper {
  max-width: 960px;
}

.fit-original .strip-wrapper {
  max-width: 1200px;
}

.strip-page-item {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2px;
}

.manga-page-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.page-number-watermark {
  position: absolute;
  bottom: 8px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  opacity: 0.5;
}

/* Paged Mode */
.paged-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 0 72px;
}

.paged-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paged-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.page-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  width: 44px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast), opacity var(--duration-fast);
  z-index: 40;
}

.page-nav-arrow:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.85);
  color: var(--kura-accent);
}

.page-nav-arrow:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.page-nav-arrow.left {
  left: 1rem;
}

.page-nav-arrow.right {
  right: 1rem;
}

/* 3. Bottom Control Bar */
.reader-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 64px;
  background: rgba(14, 15, 18, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.5rem;
  transform: translateY(0);
  transition: transform 0.25s var(--ease-spring);
}

.reader-bottom-bar:not(.visible) {
  transform: translateY(100%);
}

.bottom-bar-content {
  max-width: 900px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.chapter-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  color: #fff;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast), opacity var(--duration-fast);
  white-space: nowrap;
}

.chapter-nav-btn:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-accent);
  border-color: var(--kura-accent);
}

.chapter-nav-btn.highlight {
  background: var(--kura-accent);
  color: #000;
  border-color: var(--kura-accent);
  font-weight: 700;
}

.page-slider-track {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-val {
  font-size: 0.75rem;
  color: var(--kura-text-muted);
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.page-range-input {
  flex: 1;
  accent-color: var(--kura-accent);
  cursor: pointer;
}

@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
}

/* Reading Progress Indicator */
.reader-progress-line {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--kura-accent);
  z-index: 1000;
  transition: width 0.2s ease;
  box-shadow: 0 0 8px var(--kura-accent);
}

/* End-of-Chapter Card */
.end-chapter-card {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 3rem 1.5rem 6rem;
  background: #000;
}

.end-chapter-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-lg);
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

.end-chapter-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--kura-text-primary);
  margin: 0;
}

.end-chapter-sub {
  font-size: 0.84rem;
  color: var(--kura-text-secondary);
  margin: 0;
}

.end-chapter-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.end-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast), opacity var(--duration-fast);
}

.end-btn.prev {
  background: var(--kura-surface-hover);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-secondary);
}

.end-btn.prev:hover {
  color: var(--kura-text-primary);
  border-color: var(--kura-text-dim);
}

.end-btn.next {
  background: var(--kura-accent);
  border: 1px solid var(--kura-accent);
  color: #fff;
  font-weight: 700;
}

.end-btn.next:hover {
  opacity: 0.9;
  box-shadow: 0 4px 14px rgba(255, 107, 0, 0.4);
}

/* Comfort Filters */
.manga-page-img.comfort-warm {
  filter: sepia(0.35) contrast(0.95);
}

.manga-page-img.comfort-dim {
  filter: brightness(0.78) contrast(1.05);
}

.manga-page-img.comfort-invert {
  filter: invert(1) hue-rotate(180deg);
}

/* Floating Auto HUD */
.floating-auto-hud {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--kura-accent);
  color: #000;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 107, 0, 0.5);
  animation: pulse-hud 2s infinite;
}

@keyframes pulse-hud {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.fade-hud-enter-active,
.fade-hud-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-hud-enter-from,
.fade-hud-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Thumbnail Visual Scrubber Drawer */
.thumb-scrubber-drawer {
  position: fixed;
  bottom: 74px;
  left: 1rem;
  right: 1rem;
  max-width: 900px;
  margin: 0 auto;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-lg);
  padding: 0.75rem;
  z-index: 550;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(16px);
}

.scrubber-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--kura-text-muted);
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}

.scrubber-close-btn {
  background: transparent;
  border: none;
  color: var(--kura-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.scrubber-track {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: thin;
  padding-bottom: 0.25rem;
}

.scrubber-item {
  position: relative;
  width: 52px;
  height: 74px;
  border-radius: var(--radius-xs);
  overflow: hidden;
  border: 2px solid transparent;
  flex-shrink: 0;
  cursor: pointer;
  background: #000;
  transition: color var(--duration-fast), background-color var(--duration-fast), border-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast), opacity var(--duration-fast);
}

.scrubber-item:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
}

.scrubber-item.active {
  border-color: var(--kura-accent);
  box-shadow: 0 0 10px var(--kura-accent-glow);
}

.scrubber-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scrubber-num {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.05rem 0.25rem;
  border-radius: 2px;
}

.slide-scrubber-enter-active,
.slide-scrubber-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-scrubber-enter-from,
.slide-scrubber-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* Responsive Mobile Fixes */
@media (max-width: 640px) {
  .btn-label {
    display: none !important;
  }
  .reader-manga-title {
    max-width: 130px !important;
  }
  .chapter-picker-wrap {
    max-width: 120px;
  }
  .chapter-select {
    font-size: 0.72rem;
    padding: 0.25rem 0.4rem;
  }
}
</style>
