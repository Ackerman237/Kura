<script setup>
import { ref, watch, onMounted } from 'vue';
import {
  Sliders,
  Maximize2,
  ZoomIn,
  Play,
  RotateCcw,
  X,
  Sun,
  Moon,
  Eye,
  Rows,
  FileText,
  Gauge,
  Sparkles,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  settings: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close', 'update:settings', 'reset-settings']);

// Local working copy
const localSettings = ref({
  maxWidthPreset: '1000px', // '650px' | '850px' | '1050px' | '100%' | 'custom'
  customMaxWidth: 1000,
  zoomScale: 100, // 50 to 150%
  fitMode: 'width', // 'width' | 'height' | 'original'
  readerMode: 'strip', // 'strip' | 'paged'
  direction: 'ltr', // 'ltr' | 'rtl'
  autoScrollSpeed: 30, // 10 to 90 px/sec
  pagedInterval: 5, // 3 to 15 sec
  comfortFilter: 'normal', // 'normal' | 'warm' | 'dim' | 'invert'
  showThumbScrubber: true,
  ...props.settings,
});

watch(
  () => props.settings,
  (newVal) => {
    localSettings.value = { ...localSettings.value, ...newVal };
  },
  { deep: true }
);

function applyChange() {
  emit('update:settings', { ...localSettings.value });
  try {
    localStorage.setItem('kura_reader_settings', JSON.stringify(localSettings.value));
  } catch (_) {}
}

function setPresetWidth(preset, px) {
  localSettings.value.maxWidthPreset = preset;
  if (px) localSettings.value.customMaxWidth = px;
  applyChange();
}

function setFitMode(mode) {
  localSettings.value.fitMode = mode;
  applyChange();
}

function setComfortFilter(filter) {
  localSettings.value.comfortFilter = filter;
  applyChange();
}

function setAutoScrollSpeed(speed) {
  localSettings.value.autoScrollSpeed = speed;
  applyChange();
}

function resetDefaults() {
  localSettings.value = {
    maxWidthPreset: '1000px',
    customMaxWidth: 1000,
    zoomScale: 100,
    fitMode: 'width',
    readerMode: 'strip',
    direction: 'ltr',
    autoScrollSpeed: 30,
    pagedInterval: 5,
    comfortFilter: 'normal',
    showThumbScrubber: true,
  };
  applyChange();
  emit('reset-settings');
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="reader-settings-overlay" @click.self="emit('close')">
      <div class="reader-settings-card" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="settings-card-header">
          <div class="header-left">
            <Sliders :size="18" class="header-icon" />
            <h3 class="card-title">Pengaturan Pembaca (Reader Studio)</h3>
          </div>
          <button type="button" class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <!-- Scrollable Settings Body -->
        <div class="settings-card-body">
          <!-- 1. UKURAN GAMBAR & SKALA (Requested by User) -->
          <div class="setting-group">
            <div class="group-title-row">
              <span class="group-title">Ukuran & Lebar Gambar</span>
              <span class="group-value">{{ localSettings.maxWidthPreset === '100%' ? '100% Penuh' : `${localSettings.customMaxWidth}px` }}</span>
            </div>

            <!-- Width Presets -->
            <div class="segmented-control">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.maxWidthPreset === '650px' }"
                @click="setPresetWidth('650px', 650)"
              >
                Ramping (650px)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.maxWidthPreset === '850px' }"
                @click="setPresetWidth('850px', 850)"
              >
                Standar (850px)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.maxWidthPreset === '1000px' }"
                @click="setPresetWidth('1000px', 1000)"
              >
                Lebar (1000px)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.maxWidthPreset === '100%' }"
                @click="setPresetWidth('100%', 1920)"
              >
                Penuh (100%)
              </button>
            </div>

            <!-- Custom Width Slider -->
            <div class="slider-row">
              <span class="slider-hint">500px</span>
              <input
                v-model.number="localSettings.customMaxWidth"
                type="range"
                min="500"
                max="1600"
                step="50"
                class="range-slider"
                @input="localSettings.maxWidthPreset = 'custom'; applyChange()"
              />
              <span class="slider-hint">1600px</span>
            </div>

            <!-- Fit Modes -->
            <div class="sub-setting-row">
              <span class="sub-label">Penyesuaian (Fit Mode):</span>
              <div class="chip-row">
                <button
                  type="button"
                  class="chip-option"
                  :class="{ active: localSettings.fitMode === 'width' }"
                  @click="setFitMode('width')"
                >
                  Lebar Layar
                </button>
                <button
                  type="button"
                  class="chip-option"
                  :class="{ active: localSettings.fitMode === 'height' }"
                  @click="setFitMode('height')"
                >
                  Tinggi Layar
                </button>
                <button
                  type="button"
                  class="chip-option"
                  :class="{ active: localSettings.fitMode === 'original' }"
                  @click="setFitMode('original')"
                >
                  Ukuran Asli 1:1
                </button>
              </div>
            </div>
          </div>

          <!-- 2. PEMUTARAN OTOMATIS / KECEPATAN (Requested by User) -->
          <div class="setting-group">
            <div class="group-title-row">
              <span class="group-title">Kecepatan Pemutaran Otomatis (Auto-Play)</span>
              <span class="group-value">{{ localSettings.autoScrollSpeed }} px/detik</span>
            </div>
            <p class="group-desc">
              Gulir otomatis berkelanjutan pada mode Webtoon atau pindah halaman otomatis pada mode Halaman Tunggal.
            </p>

            <!-- Auto-Scroll Speed Presets -->
            <div class="segmented-control">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.autoScrollSpeed <= 20 }"
                @click="setAutoScrollSpeed(18)"
              >
                Lambat (18px/s)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.autoScrollSpeed === 35 }"
                @click="setAutoScrollSpeed(35)"
              >
                Sedang (35px/s)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.autoScrollSpeed === 60 }"
                @click="setAutoScrollSpeed(60)"
              >
                Cepat (60px/s)
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: localSettings.autoScrollSpeed >= 85 }"
                @click="setAutoScrollSpeed(90)"
              >
                Turbo (90px/s)
              </button>
            </div>

            <!-- Auto Scroll Speed Slider -->
            <div class="slider-row">
              <span class="slider-hint">Santai</span>
              <input
                v-model.number="localSettings.autoScrollSpeed"
                type="range"
                min="10"
                max="100"
                step="5"
                class="range-slider"
                @input="applyChange"
              />
              <span class="slider-hint">Cepat</span>
            </div>

            <!-- Paged Mode Timer Interval -->
            <div class="sub-setting-row">
              <span class="sub-label">Interval Slideshow Halaman:</span>
              <div class="chip-row">
                <button
                  v-for="sec in [3, 5, 8, 12]"
                  :key="sec"
                  type="button"
                  class="chip-option"
                  :class="{ active: localSettings.pagedInterval === sec }"
                  @click="localSettings.pagedInterval = sec; applyChange()"
                >
                  {{ sec }} Detik
                </button>
              </div>
            </div>
          </div>

          <!-- 3. KENYAMANAN MATA (Night Comfort Shield) -->
          <div class="setting-group">
            <div class="group-title-row">
              <span class="group-title">Filter Kenyamanan Mata (Eye Comfort)</span>
              <span class="group-value">{{ localSettings.comfortFilter.toUpperCase() }}</span>
            </div>

            <div class="comfort-grid">
              <button
                type="button"
                class="comfort-card"
                :class="{ active: localSettings.comfortFilter === 'normal' }"
                @click="setComfortFilter('normal')"
              >
                <Sun :size="16" class="comfort-icon" />
                <span class="comfort-name">Normal</span>
                <span class="comfort-sub">Warna asli gambar</span>
              </button>

              <button
                type="button"
                class="comfort-card warm"
                :class="{ active: localSettings.comfortFilter === 'warm' }"
                @click="setComfortFilter('warm')"
              >
                <Sparkles :size="16" class="comfort-icon warm-color" />
                <span class="comfort-name">Warm Sepia</span>
                <span class="comfort-sub">Mengurangi sinar biru</span>
              </button>

              <button
                type="button"
                class="comfort-card dim"
                :class="{ active: localSettings.comfortFilter === 'dim' }"
                @click="setComfortFilter('dim')"
              >
                <Moon :size="16" class="comfort-icon dim-color" />
                <span class="comfort-name">Dim Dark</span>
                <span class="comfort-sub">Peredup ruangan gelap</span>
              </button>

              <button
                type="button"
                class="comfort-card invert"
                :class="{ active: localSettings.comfortFilter === 'invert' }"
                @click="setComfortFilter('invert')"
              >
                <Eye :size="16" class="comfort-icon" />
                <span class="comfort-name">Invert</span>
                <span class="comfort-sub">Khusus teks/manga B/W</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="settings-card-footer">
          <button type="button" class="reset-btn" @click="resetDefaults">
            <RotateCcw :size="13" />
            <span>Kembalikan Bawaan</span>
          </button>
          <button type="button" class="done-btn" @click="emit('close')">
            Selesai
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.reader-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1100;
  user-select: none;
}

.reader-settings-card {
  width: min(540px, 100%);
  max-width: 100%;
  max-height: 85vh;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.settings-card-header {
  padding: 1.15rem 1.4rem;
  border-bottom: 1px solid var(--kura-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.header-icon {
  color: var(--kura-accent);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--kura-text-primary);
  margin: 0;
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--kura-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.close-btn:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
}

/* Body */
.settings-card-body {
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--kura-text-primary);
}

.group-value {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--kura-accent);
  background: var(--kura-accent-muted, rgba(255, 107, 0, 0.1));
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-pill);
}

.group-desc {
  font-size: 0.78rem;
  color: var(--kura-text-muted);
  margin: -0.25rem 0 0 0;
  line-height: 1.4;
}

/* Segmented Control */
.segmented-control {
  display: flex;
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.25rem;
  gap: 0.2rem;
}

.seg-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--kura-text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.seg-btn:hover {
  color: var(--kura-text-primary);
}

.seg-btn.active {
  background: var(--kura-accent);
  color: #000;
  font-weight: 700;
}

/* Slider Row */
.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-hint {
  font-size: 0.7rem;
  color: var(--kura-text-muted);
  min-width: 36px;
  text-align: center;
}

.range-slider {
  flex: 1;
  accent-color: var(--kura-accent);
  cursor: pointer;
}

/* Sub-setting row */
.sub-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.sub-label {
  font-size: 0.8rem;
  color: var(--kura-text-muted);
}

.chip-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.chip-option {
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-secondary);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.chip-option:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
}

.chip-option.active {
  background: var(--kura-accent-muted);
  color: var(--kura-accent);
  border-color: var(--kura-accent);
}

/* Comfort Cards Grid */
.comfort-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}

.comfort-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  background: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.comfort-card:hover {
  background: var(--kura-surface-hover);
  border-color: var(--kura-accent);
}

.comfort-card.active {
  border-color: var(--kura-accent);
  background: var(--kura-accent-muted);
}

.comfort-icon {
  color: var(--kura-text-muted);
  margin-bottom: 0.2rem;
}

.warm-color {
  color: #f59e0b;
}

.dim-color {
  color: #818cf8;
}

.comfort-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--kura-text-primary);
}

.comfort-sub {
  font-size: 0.68rem;
  color: var(--kura-text-muted);
}

/* Footer */
.settings-card-footer {
  padding: 1rem 1.4rem;
  border-top: 1px solid var(--kura-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: none;
  color: var(--kura-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--duration-fast);
}

.reset-btn:hover {
  color: var(--kura-accent);
}

.done-btn {
  background: var(--kura-accent);
  color: #000;
  border: none;
  padding: 0.45rem 1.25rem;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(255, 107, 0, 0.35);
  transition: all var(--duration-fast);
}

.done-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
