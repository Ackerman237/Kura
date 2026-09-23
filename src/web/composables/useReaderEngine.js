import { ref, onMounted, onUnmounted } from 'vue';

export const DEFAULT_READER_SETTINGS = {
  maxWidthPreset: '1000px',
  customMaxWidth: 1000,
  zoomScale: 100,
  fitMode: 'width',
  readerMode: 'strip',
  direction: 'ltr',
  autoScrollSpeed: 30,
  pagedInterval: 5,
  comfortFilter: 'normal',
};

export function useReaderEngine({ mode, fitMode, containerRef, onNextPaged }) {
  const readerSettings = ref({ ...DEFAULT_READER_SETTINGS });
  const isAutoPlaying = ref(false);
  const isSettingsOpen = ref(false);
  const showThumbScrubber = ref(false);

  let autoPlayFrame = null;
  let pagedAutoTimer = null;

  function loadSavedSettings() {
    try {
      const raw = localStorage.getItem('kura_reader_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        readerSettings.value = { ...DEFAULT_READER_SETTINGS, ...parsed };
        if (parsed.readerMode && mode) mode.value = parsed.readerMode;
        if (parsed.fitMode && fitMode) fitMode.value = parsed.fitMode;
      }
    } catch (_) {}
  }

  function startAutoPlay() {
    isAutoPlaying.value = true;
    if (mode && mode.value === 'strip') {
      let lastTime = performance.now();
      const scrollStep = (time) => {
        if (!isAutoPlaying.value) return;
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        const distance = (readerSettings.value.autoScrollSpeed || 30) * delta;
        const containerEl = containerRef?.value;
        if (containerEl) {
          containerEl.scrollTop += distance;
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
        if (typeof onNextPaged === 'function') {
          onNextPaged();
        }
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

  onMounted(() => {
    loadSavedSettings();
  });

  onUnmounted(() => {
    stopAutoPlay();
  });

  return {
    readerSettings,
    isAutoPlaying,
    isSettingsOpen,
    showThumbScrubber,
    loadSavedSettings,
    startAutoPlay,
    stopAutoPlay,
    toggleAutoPlay,
  };
}
