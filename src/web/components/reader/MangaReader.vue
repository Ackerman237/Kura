<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useFullscreen } from '@vueuse/core';
import { saveReadingProgress } from '../../services/storage.js';
import { STORAGE_KEYS } from '../../config/storageKeys.js';
import { resolveProxyUrl } from '../../utils/media.js';
import { ChevronLeft, ChevronRight, RotateCw, AlertCircle } from 'lucide-vue-next';

import ReaderTopBar from './ReaderTopBar.vue';
import ReaderBottomBar from './ReaderBottomBar.vue';
import ReaderScrubberDrawer from './ReaderScrubberDrawer.vue';
import ReaderSettingsModal from './ReaderSettingsModal.vue';

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
const mode = ref('strip'); // 'strip' (webtoon) | 'paged' (single page)
const currentPage = ref(1);
const stripContainerRef = ref(null);
const isSettingsOpen = ref(false);
const showThumbScrubber = ref(false);
const isAutoPlaying = ref(false);
let hideTimer = null;

// Page Image States
const loadedPages = ref({});
const failedPages = ref({});
const retryKeys = ref({});

// Reader Settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  customMaxWidth: 800,
  maxWidthPreset: '800px',
  comfortFilter: 'normal',
  autoScrollSpeed: 30,
  pagedInterval: 5,
  preloadCount: 3,
};

const readerSettings = ref({ ...DEFAULT_SETTINGS });

function loadReaderSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READER_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      readerSettings.value = { ...DEFAULT_SETTINGS, ...parsed };
      if (parsed.readerMode) mode.value = parsed.readerMode;
    }
  } catch (_) {}
}

let autoPlayFrame = null;
let pagedAutoTimer = null;

function startAutoPlay() {
  isAutoPlaying.value = true;
  if (mode.value === 'strip') {
    let lastTime = performance.now();
    const scrollStep = (time) => {
      if (!isAutoPlaying.value) return;
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      const distance = (readerSettings.value.autoScrollSpeed || 30) * delta;
      if (stripContainerRef.value) {
        stripContainerRef.value.scrollBy(0, distance);
      } else {
        window.scrollBy(0, distance);
      }
      autoPlayFrame = requestAnimationFrame(scrollStep);
    };
    autoPlayFrame = requestAnimationFrame(scrollStep);
  } else {
    if (pagedAutoTimer) clearInterval(pagedAutoTimer);
    pagedAutoTimer = setInterval(() => {
      if (!isAutoPlaying.value) return;
      nextPaged();
    }, (readerSettings.value.pagedInterval || 5) * 1000);
  }
}

function stopAutoPlay() {
  isAutoPlaying.value = false;
  if (autoPlayFrame) cancelAnimationFrame(autoPlayFrame);
  if (pagedAutoTimer) clearInterval(pagedAutoTimer);
  autoPlayFrame = null;
  pagedAutoTimer = null;
}

function toggleAutoPlay() {
  if (isAutoPlaying.value) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

// Fullscreen API
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

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

// Controls visibility toggle
const resetHideTimer = () => {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    showControls.value = false;
  }, 5000);
};

const toggleControls = (forceVal) => {
  const nextVal = typeof forceVal === 'boolean' ? forceVal : !showControls.value;
  showControls.value = nextVal;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (nextVal) {
    resetHideTimer();
  }
};

const onMouseMove = (e) => {
  if (showControls.value) {
    resetHideTimer();
  } else if (e.clientY < 65 || e.clientY > window.innerHeight - 80) {
    showControls.value = true;
    resetHideTimer();
  }
};

const handleCanvasTap = (e) => {
  if (mode.value === 'paged') {
    const width = window.innerWidth;
    if (e.clientX < width * 0.25) {
      prevPaged();
    } else if (e.clientX > width * 0.75) {
      nextPaged();
    } else {
      toggleControls();
    }
  } else {
    toggleControls();
  }
};

// Process images through proxy URL
const processedImages = computed(() => {
  return props.images.map((src, idx) => {
    const base = resolveProxyUrl(src);
    const key = retryKeys.value[idx + 1];
    return key ? `${base}&retry=${key}` : base;
  });
});

const onImageLoaded = (pageIndex) => {
  loadedPages.value[pageIndex] = true;
  delete failedPages.value[pageIndex];
};

const onImageError = (pageIndex) => {
  failedPages.value[pageIndex] = true;
};

const retryPage = (pageIndex) => {
  delete failedPages.value[pageIndex];
  loadedPages.value[pageIndex] = false;
  retryKeys.value[pageIndex] = Date.now();
};

const totalPages = computed(() => props.images.length || 1);

// Strip Mode scroll tracking
const onStripScroll = () => {
  if (!stripContainerRef.value || mode.value !== 'strip') return;
  const container = stripContainerRef.value;
  const { scrollTop, clientHeight } = container;

  const pageElements = container.querySelectorAll('.strip-page-item');
  const anchorY = scrollTop + clientHeight * 0.35;
  for (let i = 0; i < pageElements.length; i++) {
    const el = pageElements[i];
    if (el.offsetTop <= anchorY && el.offsetTop + el.offsetHeight > anchorY) {
      currentPage.value = i + 1;
      break;
    }
  }
};

function scrollToPage(page) {
  currentPage.value = page;
  if (mode.value === 'strip' && stripContainerRef.value) {
    const targetEl = stripContainerRef.value.querySelector(`.strip-page-item[data-page="${page}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// Paged mode navigation
const currentPagedImage = computed(() => {
  return processedImages.value[currentPage.value - 1] || null;
});

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

// Chapter Select from TopBar
function handleChapterSelect(selectedId) {
  const targetCh = props.chapterList.find((c) => String(c.id || c.slug) === String(selectedId));
  if (targetCh) {
    emit('selectChapter', targetCh);
  }
}

// Keyboard shortcuts
const handleKeydown = (e) => {
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    nextPaged();
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    prevPaged();
  } else if (e.key === ']' || e.key === '}') {
    emit('nextChapter');
  } else if (e.key === '[' || e.key === '{') {
    emit('prevChapter');
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  } else if (e.key === 'm' || e.key === 'M') {
    mode.value = mode.value === 'strip' ? 'paged' : 'strip';
  } else if (e.key === 'h' || e.key === 'H') {
    toggleControls();
  } else if (e.key === ' ') {
    e.preventDefault();
    toggleAutoPlay();
  } else if (e.key === 'Escape') {
    emit('close');
  }
};

// Reset on chapter change
watch(
  () => props.chapterId,
  () => {
    currentPage.value = 1;
    loadedPages.value = {};
    failedPages.value = {};
    retryKeys.value = {};
    nextTick(() => {
      if (stripContainerRef.value) {
        stripContainerRef.value.scrollTop = 0;
      }
    });
  }
);

onMounted(() => {
  loadReaderSettings();
  window.addEventListener('keydown', handleKeydown);
  resetHideTimer();
});

onUnmounted(() => {
  stopAutoPlay();
  if (hideTimer) clearTimeout(hideTimer);
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    class="manga-reader-root"
    :class="[`reader-theme-${readerSettings.theme}`]"
    @mousemove="onMouseMove"
  >
    <!-- 1. TOP BAR -->
    <ReaderTopBar
      :title="title"
      :chapter-number="chapterNumber"
      :chapter-id="chapterId"
      :chapter-list="chapterList"
      :is-fullscreen="isFullscreen"
      :visible="showControls"
      @close="emit('close')"
      @select-chapter="handleChapterSelect"
      @prev-chapter="emit('prevChapter')"
      @next-chapter="emit('nextChapter')"
      @toggle-fullscreen="toggleFullscreen"
    />

    <!-- 2. CANVAS VIEWPORT -->
    <!-- Mode A: Webtoon Strip (Continuous Vertical Scroll) -->
    <main
      v-if="mode === 'strip'"
      ref="stripContainerRef"
      class="strip-canvas-container"
      @scroll.passive="onStripScroll"
      @click="handleCanvasTap"
    >
      <div class="strip-wrapper">
        <div
          v-for="(imgSrc, index) in processedImages"
          :key="index"
          class="strip-page-item"
          :data-page="index + 1"
        >
          <!-- Shimmer skeleton while loading -->
          <div
            v-if="!loadedPages[index + 1] && !failedPages[index + 1]"
            class="page-shimmer-placeholder"
          >
            <div class="shimmer-pulse"></div>
            <span class="shimmer-page-label">Memuat Halaman {{ index + 1 }}...</span>
          </div>

          <!-- Page Image -->
          <img
            v-show="!failedPages[index + 1]"
            :src="imgSrc"
            :alt="`Halaman ${index + 1}`"
            class="manga-page-img"
            :class="[
              `comfort-${readerSettings.comfortFilter}`,
              { 'img-loaded': loadedPages[index + 1] },
            ]"
            :style="{
              maxWidth: readerSettings.maxWidthPreset === '100%' ? '100%' : `${readerSettings.customMaxWidth}px`,
            }"
            loading="lazy"
            decoding="async"
            @load="onImageLoaded(index + 1)"
            @error="onImageError(index + 1)"
          />

          <!-- Failed Page Card -->
          <div
            v-if="failedPages[index + 1]"
            class="page-retry-card"
            @click.stop="retryPage(index + 1)"
          >
            <AlertCircle :size="28" class="retry-warn-icon" />
            <p class="retry-msg">Gagal memuat halaman {{ index + 1 }}</p>
            <button type="button" class="retry-action-btn">
              <RotateCw :size="14" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>

          <div class="page-number-watermark">
            <span>{{ index + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- End-of-Chapter Card -->
      <div class="end-chapter-card" @click.stop>
        <div class="end-chapter-inner">
          <p class="end-chapter-title">Selesai Membaca Bab {{ chapterNumber }}</p>
          <div class="end-chapter-buttons">
            <button
              type="button"
              class="end-btn prev"
              @click.stop="emit('prevChapter')"
            >
              <ChevronLeft :size="16" />
              <span>Bab Sebelumnya</span>
            </button>
            <button
              type="button"
              class="end-btn next"
              @click.stop="emit('nextChapter')"
            >
              <span>Bab Selanjutnya</span>
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Mode B: Single Paged Canvas (Fixed blank image bug by attaching @load and .img-loaded) -->
    <main
      v-else-if="mode === 'paged'"
      class="paged-canvas-container"
      @click="handleCanvasTap"
    >
      <div class="paged-image-wrapper">
        <!-- Shimmer placeholder while loading paged image -->
        <div
          v-if="!loadedPages[currentPage] && !failedPages[currentPage]"
          class="page-shimmer-placeholder paged-shimmer"
        >
          <div class="shimmer-pulse"></div>
          <span class="shimmer-page-label">Memuat Halaman {{ currentPage }}...</span>
        </div>

        <img
          v-if="currentPagedImage && !failedPages[currentPage]"
          :src="currentPagedImage"
          :alt="`Halaman ${currentPage}`"
          class="manga-page-img paged-img"
          :class="[
            `comfort-${readerSettings.comfortFilter}`,
            { 'img-loaded': loadedPages[currentPage] },
          ]"
          decoding="async"
          @load="onImageLoaded(currentPage)"
          @error="onImageError(currentPage)"
        />

        <div
          v-else-if="failedPages[currentPage]"
          class="page-retry-card"
          @click.stop="retryPage(currentPage)"
        >
          <AlertCircle :size="32" class="retry-warn-icon" />
          <p class="retry-msg">Gagal memuat halaman {{ currentPage }}</p>
          <button type="button" class="retry-action-btn">
            <RotateCw :size="14" />
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      </div>

      <!-- Quick Nav Arrows -->
      <button
        type="button"
        class="page-nav-arrow left"
        :disabled="currentPage <= 1"
        title="Halaman Sebelumnya (A / ←)"
        @click.stop="prevPaged"
      >
        <ChevronLeft :size="28" />
      </button>
      <button
        type="button"
        class="page-nav-arrow right"
        :disabled="currentPage >= totalPages"
        title="Halaman Selanjutnya (D / →)"
        @click.stop="nextPaged"
      >
        <ChevronRight :size="28" />
      </button>
    </main>

    <!-- 3. BOTTOM DOCK -->
    <ReaderBottomBar
      v-model:currentPage="currentPage"
      v-model:mode="mode"
      :total-pages="totalPages"
      :is-auto-playing="isAutoPlaying"
      :show-scrubber="showThumbScrubber"
      :visible="showControls"
      @toggle-autoplay="toggleAutoPlay"
      @toggle-scrubber="showThumbScrubber = !showThumbScrubber"
      @open-settings="isSettingsOpen = true"
    />

    <!-- 4. SCRUBBER DRAWER -->
    <ReaderScrubberDrawer
      :images="processedImages"
      :current-page="currentPage"
      :visible="showThumbScrubber"
      @select-page="scrollToPage"
      @close="showThumbScrubber = false"
    />

    <!-- 5. SETTINGS MODAL -->
    <ReaderSettingsModal
      v-model:isOpen="isSettingsOpen"
      v-model:settings="readerSettings"
      @close="isSettingsOpen = false"
    />
  </div>
</template>

<style scoped>
.manga-reader-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #0b0c10;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* Strip Mode Canvas */
.strip-canvas-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  padding-top: 52px;
  padding-bottom: 80px;
}

.strip-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.strip-page-item {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 0;
}

.manga-page-img {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.manga-page-img.img-loaded {
  opacity: 1;
}

/* Paged Mode Canvas */
.paged-canvas-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 48px 80px;
  height: calc(100vh - 60px);
}

.paged-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}

.paged-img {
  max-height: calc(100vh - 140px);
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.page-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 80px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-nav-arrow:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.7);
  border-color: var(--kura-accent, #e5a93c);
  color: var(--kura-accent, #e5a93c);
}

.page-nav-arrow:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.page-nav-arrow.left {
  left: 16px;
}

.page-nav-arrow.right {
  right: 16px;
}

/* Shimmer Loading & Error Cards */
.page-shimmer-placeholder {
  min-height: 480px;
  width: 100%;
  max-width: 700px;
  background: #14161f;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin: 12px 0;
  position: relative;
  overflow: hidden;
}

.page-shimmer-placeholder.paged-shimmer {
  min-height: 70vh;
  min-width: 50vw;
}

.shimmer-pulse {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  animation: shimmer 1.5s infinite;
}

.shimmer-page-label {
  position: relative;
  z-index: 2;
  font-size: 0.85rem;
  color: #888888;
}

.page-retry-card {
  min-height: 320px;
  width: 100%;
  max-width: 600px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px dashed rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  margin: 12px 0;
}

.retry-warn-icon {
  color: #f87171;
}

.retry-msg {
  font-size: 0.85rem;
  color: #cccccc;
}

.retry-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.page-number-watermark {
  position: absolute;
  bottom: 8px;
  right: 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0.5;
}

.end-chapter-card {
  display: flex;
  justify-content: center;
  padding: 32px 16px 48px;
}

.end-chapter-inner {
  text-align: center;
  max-width: 480px;
  width: 100%;
  padding: 24px;
  border-radius: 12px;
  background: rgba(22, 25, 33, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.end-chapter-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.end-chapter-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.end-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transition: all 0.15s ease;
}

.end-btn.next {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  font-weight: 700;
}

.end-btn:hover {
  transform: translateY(-2px);
}

/* Comfort filters */
.comfort-warm {
  filter: sepia(0.25) saturate(1.1);
}
.comfort-cool {
  filter: hue-rotate(180deg) invert(0.05);
}
.comfort-invert {
  filter: invert(0.9) hue-rotate(180deg);
}

@media (max-width: 600px) {
  .paged-canvas-container {
    padding: 56px 8px 80px;
  }
  .page-nav-arrow {
    display: none;
  }
}
</style>
