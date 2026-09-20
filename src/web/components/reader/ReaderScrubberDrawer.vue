<script setup>
import { X } from 'lucide-vue-next';

defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-page', 'close']);
</script>

<template>
  <div
    class="scrubber-drawer"
    :class="{ 'drawer-open': visible }"
    @click.stop
  >
    <div class="scrubber-header">
      <span class="scrubber-title">Daftar Thumbnail Halaman ({{ images.length }} Halaman)</span>
      <button
        type="button"
        class="scrubber-close-btn"
        aria-label="Tutup Laci Thumbnail"
        @click="emit('close')"
      >
        <X :size="16" />
      </button>
    </div>

    <div class="scrubber-rail">
      <div
        v-for="(imgSrc, idx) in images"
        :key="idx"
        class="thumb-tile"
        :class="{ 'is-current': currentPage === idx + 1 }"
        @click="emit('select-page', idx + 1)"
      >
        <img
          :src="imgSrc"
          :alt="`Thumbnail ${idx + 1}`"
          class="thumb-img"
          loading="lazy"
        />
        <span class="tile-number">{{ idx + 1 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrubber-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: rgba(14, 16, 22, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 1050;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 8px 16px 12px;
}

.scrubber-drawer.drawer-open {
  transform: translateY(0);
}

.scrubber-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.scrubber-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--kura-text-muted, #aaaaaa);
  letter-spacing: 0.04em;
}

.scrubber-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #aaaaaa;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scrubber-close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.scrubber-rail {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  padding-bottom: 4px;
}

.scrubber-rail::-webkit-scrollbar {
  height: 4px;
}

.scrubber-rail::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.thumb-tile {
  position: relative;
  flex-shrink: 0;
  height: 90px;
  aspect-ratio: 2 / 3;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  background: #181a20;
  cursor: pointer;
  transition: all 0.15s ease;
}

.thumb-tile:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.04);
}

.thumb-tile.is-current {
  border-color: var(--kura-accent, #e5a93c);
  box-shadow: 0 0 10px var(--kura-accent-glow, rgba(229, 169, 60, 0.4));
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tile-number {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
