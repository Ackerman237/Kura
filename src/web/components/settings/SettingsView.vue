<script setup>
import { ref, onMounted } from 'vue';
import {
  Palette, HardDrive, Sliders, EyeOff, Layers,
  Sparkles, Image as ImageIcon, Info, SlidersHorizontal, Download,
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
        <div class="header-badge">
          <SlidersHorizontal :size="14" />
          <span>SETTINGS STUDIO</span>
        </div>
        <h1 class="settings-title">Pusat Kendali &amp; Pengaturan</h1>
        <p class="settings-subtitle">
          Kustomisasi visual tanpa batas, ekstraktor palet gambar, mode privasi adaptif, preferensi pembaca &amp; pemutar, serta manajemen cadangan data lokal.
        </p>
      </header>

      <!-- Section Navigation Pills (Quick Scroll) -->
      <nav class="settings-nav-pills">
        <a href="#sec-theme" class="nav-pill"><Palette :size="13" /> Tema &amp; Tampilan</a>
        <a href="#sec-extractor" class="nav-pill"><Sparkles :size="13" /> Ekstraktor Gambar</a>
        <a href="#sec-custom" class="nav-pill"><Sliders :size="13" /> Buat Tema</a>
        <a href="#sec-privacy" class="nav-pill"><EyeOff :size="13" /> Privasi &amp; SFW</a>
        <a href="#sec-reader" class="nav-pill"><Layers :size="13" /> Reader &amp; Video</a>
        <a href="#sec-storage" class="nav-pill"><HardDrive :size="13" /> Cadangan &amp; Cache</a>
        <a href="#sec-download" class="nav-pill"><Download :size="13" /> Unduhan</a>
        <button type="button" class="nav-pill highlight" @click="emit('navigate', 'about')">
          <Info :size="13" /> Tentang Kura (Layar Penuh)
        </button>
      </nav>

      <!-- 1. Privacy (SFW) -->
      <div id="sec-privacy">
        <SettingsPrivacy
          :is-privacy-mode="isPrivacyMode"
          :peek-duration="peekDuration"
          :blur-intensity="blurIntensity"
          @toggle-privacy="emit('toggle-privacy-mode')"
          @set-peek-duration="setPeekDuration"
          @set-blur-intensity="setBlurIntensity"
        />
      </div>

      <!-- 2. Theme Presets -->
      <div id="sec-theme">
        <SettingsThemePresets
          :current-theme="currentTheme"
          @set-theme="(id) => emit('set-theme', id)"
        />
      </div>

      <!-- 3. Curated Palettes -->
      <SettingsCuratedPalettes @apply-palette="applyPalette" />

      <!-- 4. Image Color Extractor -->
      <div id="sec-extractor">
        <SettingsImageExtractor @apply-extracted="applyExtracted" />
      </div>

      <!-- 5. Custom Theme Studio -->
      <SettingsCustomTheme
        v-model="customTheme"
        @save-and-apply="saveAndApplyCustomTheme"
      />

      <!-- 6. Reader & Player Preferences -->
      <SettingsReader
        :reader-mode="readerMode"
        :default-video-provider="defaultVideoProvider"
        @set-reader-mode="setReaderMode"
        @set-video-provider="setVideoProvider"
      />

      <!-- 7. Storage, Backup & Cache -->
      <div id="sec-storage">
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
      </div>

      <!-- 8. Tutorial & Design Guide -->
      <SettingsTutorial />

      <!-- 9. About Kura Portal -->
      <SettingsAboutPortal @navigate="(s) => emit('navigate', s)" />

      <!-- 10. Download Settings -->
      <div id="sec-download">
        <SettingsDownload />
      </div>
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
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--space-4, 16px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.settings-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 4px;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.08));
  color: var(--kura-accent, #e5a93c);
  padding: 3px 10px;
  border-radius: var(--radius-pill, 9999px);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  width: fit-content;
}

.settings-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--kura-text-primary, #fff);
  margin: 0;
  letter-spacing: -0.02em;
}

.settings-subtitle {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
  max-width: 640px;
}

/* Nav Pills */
.settings-nav-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.08));
  border-radius: var(--radius-md, 8px);
  padding: 12px 16px;
}

.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: var(--radius-pill, 9999px);
  background: transparent;
  border: 1px solid transparent;
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.74rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--kura-font-sans, sans-serif);
}

.nav-pill:hover {
  color: var(--kura-text-primary, #fff);
  background: rgba(255,255,255,0.05);
  border-color: var(--kura-border-subtle, rgba(255,255,255,0.1));
}

.nav-pill.highlight {
  background: rgba(229,169,60,0.08);
  border-color: rgba(229,169,60,0.25);
  color: var(--kura-accent, #e5a93c);
}

.nav-pill.highlight:hover {
  background: rgba(229,169,60,0.15);
}
</style>
