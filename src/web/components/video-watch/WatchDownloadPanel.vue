<script setup>
import { ref, computed, watch } from 'vue';
import { Download, ChevronDown, Loader2, AlertCircle, CheckCircle2, Plus } from 'lucide-vue-next';
import { fetchVideoSources, buildFilename, useDownloadQueue } from '../../services/download.js';

const props = defineProps({
  video: { type: Object, required: true },
  detail: { type: Object, default: null },
  provider: { type: String, default: 'htv' },
  downloadSettings: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['close']);

const { addVideoDownload, settings } = useDownloadQueue();

const isOpen = ref(false);
const loading = ref(false);
const error = ref(null);
const sources = ref([]);
const addedIds = ref(new Set());

// Toggle the panel
function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && sources.value.length === 0 && !loading.value) {
    loadSources();
  }
}

async function loadSources() {
  loading.value = true;
  error.value = null;
  try {
    const slug = props.video.slug || props.video.id;
    const result = await fetchVideoSources(props.provider, slug);
    sources.value = result.sources || [];
    if (sources.value.length === 0) {
      error.value = result.message || 'Unduhan langsung tidak tersedia untuk video ini.';
    }
  } catch (err) {
    error.value = err.message || 'Gagal mengambil daftar kualitas.';
  } finally {
    loading.value = false;
  }
}

function getFilename(source) {
  const meta = {
    title: props.detail?.title || props.video?.title || 'video',
    quality: source.label,
    provider: providerLabel.value,
    year: props.detail?.year || props.video?.year || '',
    slug: props.video?.slug || props.video?.id || '',
    genre: props.detail?.genres || props.video?.tags || [],
    duration: props.detail?.duration || '',
  };
  const template = settings.value?.videoTemplate || '{provider} - {title} [{quality}]';
  const base = buildFilename(template, meta);
  return `${base}.mp4`;
}

const providerLabel = computed(() => {
  if (props.provider === 'neko') return 'NekoPoi';
  if (props.provider === 'htv') return 'HentaiTV';
  if (props.provider === 'tube') return 'Eporner';
  return props.provider;
});

function addToQueue(source) {
  const filename = getFilename(source);
  const meta = {
    title: props.detail?.title || props.video?.title || '',
    quality: source.label,
    provider: providerLabel.value,
    year: props.detail?.year || '',
    slug: props.video?.slug || props.video?.id || '',
    genre: props.detail?.genres || props.video?.tags || [],
  };
  const id = addVideoDownload({ url: source.url, filename, meta });
  addedIds.value.add(source.url);
}

function addAllToQueue() {
  sources.value.forEach((s) => {
    if (!addedIds.value.has(s.url)) addToQueue(s);
  });
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}
</script>

<template>
  <div class="download-panel-wrapper">
    <!-- Trigger Button -->
    <button
      type="button"
      class="meta-btn download-trigger-btn"
      :class="{ active: isOpen }"
      title="Unduh Video"
      @click="toggle"
    >
      <Download :size="16" />
      <span>Unduh</span>
      <ChevronDown :size="13" class="chevron" :class="{ rotated: isOpen }" />
    </button>

    <!-- Dropdown Panel -->
    <transition name="dp-slide">
      <div v-if="isOpen" class="download-dropdown" @click.stop>
        <!-- Loading -->
        <div v-if="loading" class="dp-loading">
          <Loader2 :size="20" class="spin" />
          <span>Mengambil daftar kualitas...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="dp-error">
          <AlertCircle :size="16" />
          <span>{{ error }}</span>
        </div>

        <!-- Sources List -->
        <template v-else-if="sources.length">
          <div class="dp-header">
            <span class="dp-title">Pilih Kualitas Unduhan</span>
            <button type="button" class="dp-add-all" @click="addAllToQueue">
              <Plus :size="12" /> Semua ke Antrian
            </button>
          </div>

          <div class="dp-source-list">
            <div
              v-for="src in sources"
              :key="src.url"
              class="dp-source-row"
              :class="{ added: addedIds.has(src.url) }"
            >
              <div class="dp-source-info">
                <span class="dp-quality-badge">{{ src.label }}</span>
                <span v-if="src.size" class="dp-size">{{ formatSize(src.size) }}</span>
                <span class="dp-filename">{{ getFilename(src) }}</span>
              </div>
              <button
                type="button"
                class="dp-add-btn"
                :disabled="addedIds.has(src.url)"
                :title="addedIds.has(src.url) ? 'Sudah ditambahkan ke antrian' : 'Tambah ke antrian unduhan'"
                @click="addToQueue(src)"
              >
                <component :is="addedIds.has(src.url) ? CheckCircle2 : Plus" :size="14" />
                <span>{{ addedIds.has(src.url) ? 'Ditambahkan' : 'Antri' }}</span>
              </button>
            </div>
          </div>

          <div class="dp-footer">
            <span class="dp-hint">File disimpan sesuai pengaturan di Pengaturan &gt; Unduhan</span>
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.download-panel-wrapper {
  position: relative;
}

/* Trigger button */
.meta-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.12));
  color: var(--kura-text-secondary, #cbd5e1);
  font-family: var(--kura-font-sans, sans-serif);
  font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
}
.meta-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
.meta-btn.active {
  background: rgba(229,169,60,0.18);
  border-color: rgba(229,169,60,0.45);
  color: var(--kura-accent, #e5a93c);
}
.chevron { transition: transform 0.2s ease; }
.chevron.rotated { transform: rotate(180deg); }

/* Dropdown */
.download-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  background: #1a1b21;
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.12));
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.7);
  z-index: 100;
  overflow: hidden;
}

@media (max-width: 480px) {
  .download-dropdown {
    width: calc(100vw - 32px);
    right: -12px;
  }
}

.dp-loading, .dp-error {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 16px; color: var(--kura-text-muted, #94a3b8);
  font-size: 0.8rem;
}
.dp-error { color: #f87171; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.dp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  gap: 8px;
}
.dp-title { font-size: 0.78rem; font-weight: 700; color: var(--kura-text-primary, #fff); min-width: 0; }
.dp-add-all {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.7rem; font-weight: 600;
  color: var(--kura-accent, #e5a93c);
  background: rgba(229,169,60,0.1);
  border: 1px solid rgba(229,169,60,0.2);
  padding: 3px 8px; border-radius: 4px; cursor: pointer;
  transition: all 0.15s ease;
}
.dp-add-all:hover { background: rgba(229,169,60,0.2); }

@media (max-width: 480px) {
  .dp-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .dp-title {
    flex: 1 1 100%;
  }

  .dp-add-all {
    min-height: 36px;
  }
}

.dp-source-list { padding: 8px 0; }
.dp-source-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 8px 14px;
  transition: background 0.15s ease;
}
.dp-source-row:hover { background: rgba(255,255,255,0.03); }
.dp-source-row.added { opacity: 0.6; }

.dp-source-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.dp-quality-badge {
  display: inline-block;
  background: rgba(229,169,60,0.12);
  border: 1px solid rgba(229,169,60,0.25);
  color: var(--kura-accent, #e5a93c);
  font-size: 0.65rem; font-weight: 800;
  padding: 1px 6px; border-radius: 3px; width: fit-content;
}
.dp-size {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.68rem; color: var(--kura-text-muted, #94a3b8);
}
.dp-filename {
  font-size: 0.68rem; color: var(--kura-text-muted, #94a3b8);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.dp-add-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.7rem; font-weight: 600;
  padding: 5px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--kura-text-secondary, #cbd5e1);
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: all 0.15s ease;
}
.dp-add-btn:hover:not(:disabled) {
  background: var(--kura-accent, #e5a93c);
  color: #000; border-color: transparent;
}
.dp-add-btn:disabled { cursor: default; opacity: 0.7; }

.dp-footer {
  padding: 8px 14px 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.dp-hint { font-size: 0.66rem; color: var(--kura-text-muted, #94a3b8); }

/* Animation */
.dp-slide-enter-active { animation: dpSlideIn 0.18s ease; }
.dp-slide-leave-active { animation: dpSlideIn 0.15s ease reverse; }
@keyframes dpSlideIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
