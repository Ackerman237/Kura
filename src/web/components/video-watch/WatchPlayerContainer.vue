<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { RefreshCw, Maximize2, Minimize2, Tv, Server, ArrowLeft } from 'lucide-vue-next';
import { fetchRuntimeConfig } from '../../services/api.js';

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

const emit = defineEmits(['back']);

const isTheaterMode = ref(false);
const frameKey = ref(0);
const selectedServerIdx = ref(0);
const directEmbedHosts = ref(['nhplayer.com', 'playmogo.com', 'streampoi.com']);

const matchesDirectEmbedHost = (url = '') => {
  const target = String(url || '').toLowerCase();
  return directEmbedHosts.value.some((host) => target.includes(String(host).toLowerCase()));
};

onMounted(async () => {
  try {
    const config = await fetchRuntimeConfig({ forceRefresh: true });
    const hosts = Array.isArray(config?.directEmbedHosts)
      ? config.directEmbedHosts
      : ['nhplayer.com', 'playmogo.com', 'streampoi.com'];

    directEmbedHosts.value = hosts
      .map((host) => String(host).trim().toLowerCase())
      .filter(Boolean);
  } catch (error) {
    console.warn('[WatchPlayerContainer] Failed to load direct embed hosts, keeping defaults.', error);
  }
});

// Reset server index on video change
watch(
  () => props.video?.slug || props.video?.id,
  () => {
    selectedServerIdx.value = 0;
    frameKey.value++;
  }
);

// Available server streams (especially for NekoPoi which provides detail.players)
const availableServers = computed(() => {
  if (!props.detail) return [];

  // NekoPoi players array: prioritize stable HLS streams (e.g. streampoi)
  if (Array.isArray(props.detail.players) && props.detail.players.length > 0) {
    const sorted = [...props.detail.players].sort((a, b) => {
      const aIsStream = a.includes('streampoi');
      const bIsStream = b.includes('streampoi');
      if (aIsStream && !bIsStream) return -1;
      if (!aIsStream && bIsStream) return 1;
      return 0;
    });

    return sorted.map((url, idx) => ({
      name: `Server ${idx + 1}${url.includes('streampoi') ? ' (HLS Stabil)' : ''}`,
      url,
    }));
  }

  // Eporner embed URL (routes through sanitized player-frame to avoid ISP / referer blocking)
  if (props.provider === 'tube' || props.video?.source === 'eporner') {
    const slug = props.video.slug || props.video.id || '';
    const embedUrl = props.detail?.embedUrl || `https://www.eporner.com/embed/${slug}/`;
    return [{ name: 'Server 1 (Embed Stream)', url: embedUrl }];
  }

  // HentaiTV or generic embed URL
  if (props.detail.embedUrl || props.detail.playerUrl || props.detail.iframe) {
    const singleUrl = props.detail.embedUrl || props.detail.playerUrl || props.detail.iframe;
    return [{ name: 'Server 1', url: singleUrl }];
  }

  return [];
});

// Check if direct MP4 stream is available (e.g. Eporner detail.src)
// Proxied via /api/video/download/stream to bypass ISP SNI blocks and enforce upstream referer
const directMp4Sources = computed(() => {
  if (Array.isArray(props.detail?.src) && props.detail.src.length > 0) {
    return props.detail.src.map((s) => ({
      label: s.label || 'MP4',
      url: `/api/video/download/stream?url=${encodeURIComponent(s.url)}&inline=1`,
      type: 'video/mp4',
    }));
  }
  return null;
});

const isDirectPlayer = computed(() => {
  if (availableServers.value.length === 0) return false;
  const activeUrl = (availableServers.value[selectedServerIdx.value] || availableServers.value[0])?.url || '';
  return matchesDirectEmbedHost(activeUrl);
});

const iframeSrc = computed(() => {
  if (availableServers.value.length > 0) {
    const activeServer = availableServers.value[selectedServerIdx.value] || availableServers.value[0];
    const targetUrl = activeServer.url;

    if (matchesDirectEmbedHost(targetUrl)) {
      return targetUrl;
    }

    const slug = props.video.slug || props.video.id || '';
    return `/api/video/player-frame?url=${encodeURIComponent(targetUrl)}&slug=${encodeURIComponent(slug)}`;
  }

  // Fallback: construct URL from provider and detail data
  const slug = props.video.slug || props.video.id || '';
  let baseUrl = '';
  if (props.provider === 'neko') {
    baseUrl = `https://nekopoi.care/${slug}/`;
  } else if (props.provider === 'htv') {
    baseUrl = `https://hentai.tv/${slug}/`;
  } else if (props.provider === 'tube') {
    baseUrl = `https://www.eporner.com/embed/${slug}/`;
  }
  return `/api/video/player-frame?url=${encodeURIComponent(baseUrl)}&slug=${encodeURIComponent(slug)}`;
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

      <!-- Local Video Player (Offline / Local File) -->
      <video
        v-else-if="video.isLocal"
        :src="video.localUrl || video.url"
        controls
        autoplay
        class="player-iframe local-video-element"
      ></video>

      <!-- Direct HTML5 MP4 Player (e.g. Eporner) -->
      <video
        v-else-if="directMp4Sources"
        :key="`mp4-${frameKey}`"
        controls
        autoplay
        class="player-iframe direct-mp4-element"
      >
        <source
          v-for="(source, idx) in directMp4Sources"
          :key="idx"
          :src="source.url"
          :type="source.type || 'video/mp4'"
        />
        Browser Anda tidak mendukung pemutar video HTML5.
      </video>

      <!-- Filtered & Sandboxed Player Frame (WibuDex Strict Ad-Shield Sandbox) -->
      <iframe
        v-else
        :key="`iframe-${frameKey}-${selectedServerIdx}`"
        :src="iframeSrc"
        class="player-iframe"
        title="Kura Filtered Video Player"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-forms allow-presentation"
      ></iframe>

      <!-- Player Controls Ribbon Overlay -->
      <div class="player-top-controls">
        <div class="provider-group">
          <button
            type="button"
            class="ctrl-icon-btn landscape-back-btn"
            title="Kembali ke Katalog"
            @click="emit('back')"
          >
            <ArrowLeft :size="13" />
          </button>
          <div class="provider-pill">
            <Tv :size="12" />
            <span>{{ video.isLocal ? 'Berkas Lokal' : provider === 'neko' ? 'NekoPoi' : provider === 'htv' ? 'HentaiTV' : 'Tube' }}</span>
          </div>

          <!-- Server Selector (e.g. NekoPoi Server 1, Server 2) -->
          <div v-if="availableServers.length > 1" class="server-selector-group">
            <button
              v-for="(srv, idx) in availableServers"
              :key="idx"
              type="button"
              class="server-btn"
              :class="{ active: selectedServerIdx === idx }"
              @click="selectedServerIdx = idx"
            >
              <Server :size="10" />
              <span>{{ srv.name }}</span>
            </button>
          </div>
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
  transition: all 0.25s ease;
}

.player-aspect-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #050608;
  overflow: hidden;
}

.player-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #000000;
}

.local-video-element,
.direct-mp4-element {
  object-fit: contain;
}

.player-loading-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #0d0f14;
  z-index: 5;
}

.spinner-ring {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--kura-accent, #e5a93c);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-label {
  font-size: 0.82rem;
  color: var(--kura-text-muted, #aaaaaa);
  letter-spacing: 0.04em;
}

.player-top-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
}

.provider-group {
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
  overflow: hidden;
  min-width: 0;
  flex: 1;
}

.provider-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ffffff;
}

.server-selector-group {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  max-width: 200px;
}
.server-selector-group::-webkit-scrollbar { display: none; }

.server-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--kura-text-muted, #cccccc);
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
}

.server-btn span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.server-btn.active {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  border-color: var(--kura-accent, #e5a93c);
  font-weight: 700;
}

.top-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
}

.ctrl-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ctrl-icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.landscape-back-btn {
  display: none;
}

@media (max-width: 640px) {
  .watch-player-wrapper {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .player-top-controls {
    top: 8px;
    left: 8px;
    right: 8px;
  }

  .provider-pill {
    padding: 3px 8px;
    font-size: 10px;
  }

  .server-btn {
    padding: 2px 6px;
    font-size: 9.5px;
  }
}

@media (orientation: landscape) and (max-height: 540px) {
  .watch-player-wrapper {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    border: none;
    z-index: 9999;
  }

  .player-aspect-frame {
    width: 100vw;
    height: 100vh;
    aspect-ratio: auto;
  }

  .landscape-back-btn {
    display: flex;
  }
}
</style>
