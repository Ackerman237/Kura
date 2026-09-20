<script setup>
import { ref, computed } from 'vue';
import { AlertTriangle, RefreshCw, Maximize2, Minimize2, Tv } from 'lucide-vue-next';

const props = defineProps({
  video: {
    type: Object,
    required: true,
  },
  detail: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    default: 'htv',
  },
});

const isTheaterMode = ref(false);
const frameKey = ref(0);

const iframeSrc = computed(() => {
  if (props.detail && props.detail.playerUrl) {
    return props.detail.playerUrl;
  }
  if (props.detail && props.detail.iframe) {
    return props.detail.iframe;
  }
  const slug = props.video.slug || props.video.id;
  return `/api/video/player-frame?provider=${props.provider}&slug=${encodeURIComponent(slug)}`;
});

const reloadPlayer = () => {
  frameKey.value++;
};

const toggleTheater = () => {
  isTheaterMode.value = !isTheaterMode.value;
};
</script>

<template>
  <div class="watch-player-wrapper" :class="{ 'theater-mode': isTheaterMode }">
    <div class="player-aspect-frame">
      <!-- Loading Shimmer -->
      <div v-if="loading" class="player-loading-skeleton">
        <div class="spinner-ring"></div>
        <span class="loading-label">Menyiapkan Sandbox Stream Aman...</span>
      </div>

      <!-- Live Sandbox Iframe -->
      <iframe
        v-else
        :key="frameKey"
        :src="iframeSrc"
        class="player-iframe"
        title="Kura Video Player"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-forms allow-presentation allow-same-origin"
      ></iframe>

      <!-- Player Controls Ribbon Overlay -->
      <div class="player-top-controls">
        <div class="provider-pill">
          <Tv :size="12" />
          <span>{{ provider === 'neko' ? 'NekoPoi' : provider === 'htv' ? 'HentaiTV' : 'Tube' }}</span>
        </div>

        <div class="top-buttons">
          <button type="button" class="ctrl-icon-btn" title="Muat Ulang Pemutar" @click="reloadPlayer">
            <RefreshCw :size="13" />
          </button>
          <button
            type="button"
            class="ctrl-icon-btn"
            :title="isTheaterMode ? 'Mode Standar' : 'Mode Teater'"
            @click="toggleTheater"
          >
            <component :is="isTheaterMode ? Minimize2 : Maximize2" :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.watch-player-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  background: #000000;
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.85);
  transition: all var(--duration-normal, 0.25s) ease;
}

.player-aspect-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #050608;
  overflow: hidden;
}

.player-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.player-loading-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #090a0f;
  color: var(--kura-text-muted, #94a3b8);
}

.spinner-ring {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(229, 169, 60, 0.2);
  border-top-color: var(--kura-accent, #e5a93c);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-label {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}

.player-top-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
}

.provider-pill {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  color: #ffffff;
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.top-buttons {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctrl-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}

.ctrl-icon-btn:hover {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  transform: scale(1.05);
}
</style>
