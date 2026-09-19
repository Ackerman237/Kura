<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useVirtualList } from '@vueuse/core';
import { I18N } from '../../config/strings.js';

const props = defineProps({
  title: {
    type: String,
    default: 'Manga Chapter',
  },
  chapterNumber: {
    type: [Number, String],
    default: '1',
  },
  images: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['close', 'nextChapter', 'prevChapter']);

// UI State
const showControls = ref(true);
const mode = ref('strip'); // 'strip' (vertical virtual scroll) | 'paged' (single page)
const currentPage = ref(1);
let hideTimer = null;

// Auto-hide chrome timer (3 seconds)
const resetHideTimer = () => {
  showControls.value = true;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    showControls.value = false;
  }, 3200);
};

// Virtual List setup for 200+ images (Windowing DOM)
// itemHeight estimate is 1100px (standard vertical manhwa panel height)
const { list: virtualImages, containerProps, wrapperProps, scrollTo } = useVirtualList(
  computed(() => props.images.map((src, index) => ({ index: index + 1, src }))),
  {
    itemHeight: 1050,
    overscan: 2, // Only render 2 images above and 2 images below viewport!
  }
);

// Paged mode state
const currentPagedImage = computed(() => {
  return props.images[currentPage.value - 1] || null;
});

const nextPaged = () => {
  if (currentPage.value < props.images.length) {
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

// Tap zone interaction (Left 30% / Center 40% / Right 30%)
const handleTapZone = (event) => {
  const width = window.innerWidth;
  const x = event.clientX;
  const ratio = x / width;

  if (ratio < 0.3) {
    // Left zone: Back / Previous
    if (mode.value === 'paged') {
      prevPaged();
    } else {
      window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
    }
  } else if (ratio > 0.7) {
    // Right zone: Forward / Next
    if (mode.value === 'paged') {
      nextPaged();
    } else {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
    }
  } else {
    // Center zone: Toggle controls
    showControls.value = !showControls.value;
    if (showControls.value) resetHideTimer();
  }
};

onMounted(() => {
  resetHideTimer();
  window.addEventListener('mousemove', resetHideTimer);
});

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer);
  window.removeEventListener('mousemove', resetHideTimer);
});
</script>

<template>
  <div class="kura-reader-wrapper" :class="{ 'hud-hidden': !showControls }">
    <!-- Top HUD Header -->
    <header class="reader-header" :class="{ visible: showControls }">
      <div class="header-left">
        <button class="icon-btn" @click="$emit('close')" :title="I18N.reader.backToDetail">
          ←
        </button>
        <div class="header-titles">
          <h2 class="reader-series-title">{{ title }}</h2>
          <span class="reader-chapter-pill">Bab {{ chapterNumber }}</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Mode Switcher -->
        <button
          class="mode-toggle-btn"
          @click="mode = mode === 'strip' ? 'paged' : 'strip'"
          :title="mode === 'strip' ? I18N.reader.modePaged : I18N.reader.modeStrip"
        >
          {{ mode === 'strip' ? '📜 Strip' : '📖 Halaman' }}
        </button>
      </div>
    </header>

    <!-- Tap Interaction Layer -->
    <div class="reader-tap-layer" @click="handleTapZone"></div>

    <!-- CANVAS 1: Long-Strip Mode (Virtual Windowed List) -->
    <main v-if="mode === 'strip'" v-bind="containerProps" class="virtual-scroll-container">
      <div v-bind="wrapperProps" class="virtual-scroll-inner">
        <div
          v-for="{ index, data } in virtualImages"
          :key="data.index"
          class="reader-page-slot"
          :data-page="data.index"
        >
          <img
            :src="data.src"
            :alt="`Halaman ${data.index}`"
            class="reader-canvas-img"
            loading="eager"
            decoding="async"
          />
          <div class="page-num-tag">{{ data.index }} / {{ images.length }}</div>
        </div>
      </div>
    </main>

    <!-- CANVAS 2: Single Paged Mode -->
    <main v-else class="paged-container">
      <div class="paged-stage">
        <img
          v-if="currentPagedImage"
          :src="currentPagedImage"
          :alt="`Halaman ${currentPage}`"
          class="paged-img"
        />
      </div>
      <div class="paged-counter">
        {{ currentPage }} / {{ images.length }}
      </div>
    </main>

    <!-- Bottom HUD Footer -->
    <footer class="reader-footer" :class="{ visible: showControls }">
      <button class="footer-btn" @click="$emit('prevChapter')">
        ⏮ {{ I18N.reader.prevChapter }}
      </button>
      <span class="footer-status">
        {{ mode === 'strip' ? `${images.length} Gambar (Virtual)` : `Hal ${currentPage}/${images.length}` }}
      </span>
      <button class="footer-btn" @click="$emit('nextChapter')">
        {{ I18N.reader.nextChapter }} ⏭
      </button>
    </footer>
  </div>
</template>

<style scoped>
.kura-reader-wrapper {
  position: fixed;
  inset: 0;
  background-color: #0d0e11; /* AMOLED dark canvas */
  z-index: 999;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden;
}

/* Tap Layer: 100% overlay with zero pointer interference on actual scroll */
.reader-tap-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: auto;
}

/* Header HUD */
.reader-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: linear-gradient(180deg, rgba(23, 24, 28, 0.95) 0%, rgba(23, 24, 28, 0) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  z-index: 20;
  transform: translateY(-100%);
  transition: transform var(--transition-normal);
  pointer-events: none;
}

.reader-header.visible {
  transform: translateY(0);
  pointer-events: auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.icon-btn {
  font-size: var(--text-xl);
  color: var(--kura-text-primary);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  background-color: rgba(34, 36, 42, 0.7);
}

.reader-series-title {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--kura-text-primary);
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reader-chapter-pill {
  font-size: var(--text-xs);
  color: var(--kura-accent);
  font-weight: 600;
}

.mode-toggle-btn {
  background-color: var(--kura-surface);
  border: 1px solid var(--kura-border-strong);
  color: var(--kura-text-primary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
}

/* Virtual Scroll Container */
.virtual-scroll-container {
  flex: 1;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  z-index: 5;
}

.virtual-scroll-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.reader-page-slot {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 400px;
}

.reader-canvas-img {
  width: 100%;
  height: auto;
  display: block;
}

.page-num-tag {
  position: absolute;
  bottom: 8px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  color: var(--kura-text-muted);
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

/* Paged Mode */
.paged-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
  padding: var(--space-2);
}

.paged-stage {
  max-width: 100%;
  max-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paged-img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  box-shadow: var(--shadow-lg);
}

.paged-counter {
  margin-top: var(--space-2);
  color: var(--kura-text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
}

/* Footer HUD */
.reader-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: linear-gradient(0deg, rgba(23, 24, 28, 0.95) 0%, rgba(23, 24, 28, 0) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  z-index: 20;
  transform: translateY(100%);
  transition: transform var(--transition-normal);
  pointer-events: none;
}

.reader-footer.visible {
  transform: translateY(0);
  pointer-events: auto;
}

.footer-btn {
  background-color: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-primary);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  min-height: 40px;
}

.footer-status {
  font-size: var(--text-xs);
  color: var(--kura-text-muted);
}
</style>
