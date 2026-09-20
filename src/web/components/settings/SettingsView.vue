<script setup>
import { ref, onMounted } from 'vue';
import {
  Palette, HardDrive, Sliders, EyeOff, Layers,
  Sparkles, SlidersHorizontal, Download, ShieldCheck,
  BookOpen, Info,
} from 'lucide-vue-next';

// Section Components
import SettingsPrivacy from './sections/SettingsPrivacy.vue';
import SettingsThemePresets from './sections/SettingsThemePresets.vue';
import SettingsCuratedPalettes from './sections/SettingsCuratedPalettes.vue';
import SettingsImageExtractor from './sections/SettingsImageExtractor.vue';
import SettingsCustomTheme from './sections/SettingsCustomTheme.vue';
import SettingsReader from './sections/SettingsReader.vue';
import SettingsStorage from './sections/SettingsStorage.vue';
import SettingsTutorial from './sections/SettingsTutorial.vue';
import SettingsAboutPortal from './sections/SettingsAboutPortal.vue';
import SettingsDownload from './sections/SettingsDownload.vue';
import { useToast } from '../../composables/useToast.js';

const props = defineProps({
  currentTheme: { type: String, default: 'default' },
  isPrivacyMode: { type: Boolean, default: false },
  offlineChapterCount: { type: Number, default: 0 },
});

const emit = defineEmits(['set-theme', 'toggle-privacy-mode', 'clear-offline', 'navigate']);

// Active Top-Level Tab (macOS / Arc Style Segmented Control)
const activeTab = ref('appearance'); // 'appearance' | 'reading' | 'system'

// --- SFW State ---
const peekDuration = ref(2000);
const blurIntensity = ref('12px');

function setPeekDuration(dur) {
  peekDuration.value = dur;
  localStorage.setItem('kura_sfw_peek_duration', dur.toString());
}

function setBlurIntensity(b) {
  blurIntensity.value = b;
  localStorage.setItem('kura_sfw_blur', b);
  document.documentElement.style.setProperty('--kura-sfw-blur', b);
}

// --- Reader/Player State ---
const readerMode = ref('webtoon');
const defaultVideoProvider = ref('nekopoi');

function setReaderMode(mode) {
  readerMode.value = mode;
  localStorage.setItem('kura_reader_mode', mode);
}

function setVideoProvider(prov) {
  defaultVideoProvider.value = prov;
  localStorage.setItem('kura_default_video_provider', prov);
}

// --- Custom Theme State ---
const customTheme = ref({ bg: '#0E0F12', surface: '#17181C', accent: '#FF6B00', text: '#F4F4F6' });

function saveAndApplyCustomTheme() {
  try {
    localStorage.setItem('kura_custom_theme', JSON.stringify(customTheme.value));
    const root = document.documentElement;
    root.style.setProperty('--custom-bg', customTheme.value.bg);
    root.style.setProperty('--custom-surface', customTheme.value.surface);
    root.style.setProperty('--custom-accent', customTheme.value.accent);
    root.style.setProperty('--custom-text', customTheme.value.text);
    emit('set-theme', 'custom');
  } catch (e) {
    console.error('Save custom theme failed:', e);
  }
}

function applyPalette(p) {
  customTheme.value = { bg: p.bg, surface: p.surface, accent: p.accent, text: p.text };
  saveAndApplyCustomTheme();
}

const toast = useToast();

function applyExtracted(palette) {
  customTheme.value = { ...palette };
  saveAndApplyCustomTheme();
  toast.success('Palet hasil ekstraksi gambar berhasil diterapkan sebagai Tema Kustom!');
}

// --- Backup Restore Handler ---
function handleRestoreBackup(data) {
  try {
    if (data.readingProgress) localStorage.setItem('kura_reading_progress', JSON.stringify(data.readingProgress));
    if (data.bookmarks) localStorage.setItem('kura_bookmarks', JSON.stringify(data.bookmarks));
    if (data.customTheme) {
      localStorage.setItem('kura_custom_theme', JSON.stringify(data.customTheme));
      customTheme.value = data.customTheme;
    }
    if (data.theme) emit('set-theme', data.theme);
    toast.success('Data berhasil dipulihkan! Halaman akan memuat ulang data baru.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (err) {
    console.error('Restore failed:', err);
    toast.error('Gagal memulihkan cadangan data.');
  }
}

// --- Init from localStorage ---
onMounted(() => {
  try {
    const saved = localStorage.getItem('kura_custom_theme');
    if (saved) customTheme.value = { ...customTheme.value, ...JSON.parse(saved) };

    const savedPeek = localStorage.getItem('kura_sfw_peek_duration');
    if (savedPeek) peekDuration.value = parseInt(savedPeek, 10) || 2000;

    const savedBlur = localStorage.getItem('kura_sfw_blur');
    if (savedBlur) blurIntensity.value = savedBlur;

    const savedReader = localStorage.getItem('kura_reader_mode');
    if (savedReader) readerMode.value = savedReader;

    const savedVid = localStorage.getItem('kura_default_video_provider');
    if (savedVid) defaultVideoProvider.value = savedVid;
  } catch (_) {}
});
</script>

<template>
  <div class="settings-view">
    <div class="settings-container">
      <!-- Header -->
      <header class="settings-header">
        <div class="header-top-meta">
          <div class="header-badge">
            <SlidersHorizontal :size="13" />
            <span>PENGATURAN KURA</span>
          </div>
          <button type="button" class="about-shortcut-btn" @click="emit('navigate', 'about')">
            <Info :size="13" />
            <span>Tentang Kura</span>
          </button>
        </div>
        <h1 class="settings-title">Pusat Kendali &amp; Preferensi</h1>
        <p class="settings-subtitle">
          Kustomisasi visual tanpa batas, tata letak pembaca, mode perlindungan privasi adaptif, dan manajemen penyimpanan lokal.
        </p>
      </header>

      <!-- Modern Segmented Control Tab Bar -->
      <div class="settings-tabs-wrapper">
        <div class="settings-segmented-bar" role="tablist">
          <button
            type="button"
            role="tab"
            class="segment-tab-btn"
            :class="{ active: activeTab === 'appearance' }"
            :aria-selected="activeTab === 'appearance'"
            @click="activeTab = 'appearance'"
          >
            <Palette :size="16" class="tab-icon" />
            <span class="tab-title">Tampilan &amp; Tema</span>
          </button>

          <button
            type="button"
            role="tab"
            class="segment-tab-btn"
            :class="{ active: activeTab === 'reading' }"
            :aria-selected="activeTab === 'reading'"
            @click="activeTab = 'reading'"
          >
            <BookOpen :size="16" class="tab-icon" />
            <span class="tab-title">Membaca &amp; Sinema</span>
          </button>

          <button
            type="button"
            role="tab"
            class="segment-tab-btn"
            :class="{ active: activeTab === 'system' }"
            :aria-selected="activeTab === 'system'"
            @click="activeTab = 'system'"
          >
            <ShieldCheck :size="16" class="tab-icon" />
            <span class="tab-title">Privasi &amp; Sistem</span>
          </button>
        </div>
      </div>

      <!-- Tab Content Panels -->
      <Transition name="tab-fade" mode="out-in">
        <!-- TAB 1: TAMPILAN & TEMA -->
        <div v-if="activeTab === 'appearance'" key="tab-appearance" class="tab-panel-section">
          <!-- 1. Theme Presets -->
          <SettingsThemePresets
            :current-theme="currentTheme"
            @set-theme="(id) => emit('set-theme', id)"
          />

          <!-- 2. Curated Palettes -->
          <SettingsCuratedPalettes @apply-palette="applyPalette" />

          <!-- 3. Image Color Extractor -->
          <SettingsImageExtractor @apply-extracted="applyExtracted" />

          <!-- 4. Custom Theme Studio -->
          <SettingsCustomTheme
            v-model="customTheme"
            @save-and-apply="saveAndApplyCustomTheme"
          />
        </div>

        <!-- TAB 2: MEMBACA & SINEMA -->
        <div v-else-if="activeTab === 'reading'" key="tab-reading" class="tab-panel-section">
          <!-- 1. Reader & Player Preferences -->
          <SettingsReader
            :reader-mode="readerMode"
            :default-video-provider="defaultVideoProvider"
            @set-reader-mode="setReaderMode"
            @set-video-provider="setVideoProvider"
          />

          <!-- 2. Download Settings -->
          <SettingsDownload />

          <!-- 3. Tutorial & Design Guide -->
          <SettingsTutorial />
        </div>

        <!-- TAB 3: PRIVASI & SISTEM -->
        <div v-else-if="activeTab === 'system'" key="tab-system" class="tab-panel-section">
          <!-- 1. Privacy (SFW) -->
          <SettingsPrivacy
            :is-privacy-mode="isPrivacyMode"
            :peek-duration="peekDuration"
            :blur-intensity="blurIntensity"
            @toggle-privacy="emit('toggle-privacy-mode')"
            @set-peek-duration="setPeekDuration"
            @set-blur-intensity="setBlurIntensity"
          />

          <!-- 2. Storage, Backup & Cache -->
          <SettingsStorage
            :offline-chapter-count="offlineChapterCount"
            :current-theme="currentTheme"
            :custom-theme="customTheme"
            :peek-duration="peekDuration"
            :blur-intensity="blurIntensity"
            :reader-mode="readerMode"
            :default-video-provider="defaultVideoProvider"
            @clear-offline="emit('clear-offline')"
            @restore-backup="handleRestoreBackup"
          />

          <!-- 3. About Kura Portal -->
          <SettingsAboutPortal @navigate="(s) => emit('navigate', s)" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  width: 100%;
  padding-top: var(--space-6, 24px);
  padding-bottom: var(--space-12, 80px);
}

.settings-container {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 var(--space-4, 16px);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Header */
.settings-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 6px;
}

.header-top-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(229, 169, 60, 0.1);
  border: 1px solid rgba(229, 169, 60, 0.25);
  color: var(--kura-accent, #e5a93c);
  padding: 3px 10px;
  border-radius: var(--radius-pill, 9999px);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.about-shortcut-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-muted, #94a3b8);
  font-family: var(--kura-font-sans, sans-serif);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-pill, 9999px);
  cursor: pointer;
  transition: all 0.18s ease;
}

.about-shortcut-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.settings-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.85rem;
  font-weight: 900;
  color: var(--kura-text-primary, #fff);
  margin: 0;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.settings-subtitle {
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
  max-width: 640px;
}

/* Modern Segmented Control Bar */
.settings-tabs-wrapper {
  position: sticky;
  top: 68px;
  z-index: 20;
  padding: 4px 0;
  background: linear-gradient(180deg, var(--kura-bg, #0b0c0f) 80%, transparent 100%);
}

.settings-segmented-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-pill, 9999px);
  padding: 4px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.45);
}

.segment-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-pill, 9999px);
  color: var(--kura-text-muted, #94a3b8);
  font-family: var(--kura-font-sans, sans-serif);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.segment-tab-btn:hover {
  color: var(--kura-text-primary, #ffffff);
  background: rgba(255, 255, 255, 0.04);
}

.segment-tab-btn.active {
  background: var(--kura-accent, #e5a93c);
  color: #0b0c0f;
  font-weight: 750;
  box-shadow: 0 4px 14px rgba(229, 169, 60, 0.35);
}

.segment-tab-btn.active .tab-icon {
  color: #0b0c0f;
}

.tab-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.segment-tab-btn:active .tab-icon {
  transform: scale(0.92);
}

/* Tab Panels */
.tab-panel-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Transitions */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 640px) {
  .settings-container {
    gap: 16px;
    padding: 0 12px;
  }

  .settings-title {
    font-size: 1.45rem;
  }

  .settings-tabs-wrapper {
    top: 56px;
  }

  .settings-segmented-bar {
    grid-template-columns: repeat(3, 1fr);
    padding: 3px;
    gap: 2px;
  }

  .segment-tab-btn {
    height: 35px;
    padding: 0 6px;
    gap: 5px;
    font-size: 0.72rem;
  }

  .tab-title {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 440px) {
  .segment-tab-btn .tab-title {
    font-size: 0.68rem;
  }
}
</style>
