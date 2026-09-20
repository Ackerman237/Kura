<script setup>
import { computed } from 'vue';
import { HardDrive, FolderOpen, Film, BookOpen, FileText, Layers } from 'lucide-vue-next';
import { useDownloadQueue, buildFilename, buildSubdirPath } from '../../../services/download.js';

const { settings, saveSettings } = useDownloadQueue();

// Preset templates
const VIDEO_PRESETS = [
  { label: 'Kura Default', value: '{provider} - {title} [{quality}]' },
  { label: 'Singkat', value: '{title} [{quality}]' },
  { label: 'Terstruktur', value: '{year} - {title} - {provider} [{quality}]' },
  { label: 'Sortable', value: '[{provider}] {title} [{quality}]' },
];
const MANGA_PRESETS = [
  { label: 'Kura Default', value: '{manga} - Ch.{chapter_padded}' },
  { label: 'Dengan Judul', value: '{manga} - Ch.{chapter_padded} - {title}' },
  { label: 'Singkat', value: 'Ch.{chapter_padded}' },
  { label: 'Sortable', value: '[{manga}] Ch.{chapter_padded}' },
];
const QUALITY_OPTIONS = [
  { label: 'Tertinggi Tersedia', value: 'best' },
  { label: '1080p', value: '1080p' },
  { label: '720p', value: '720p' },
  { label: '480p', value: '480p' },
];

// Live previews
const videoPreview = computed(() => {
  const filename = buildFilename(settings.value.videoTemplate, {
    title: 'Contoh Judul Video',
    quality: '1080p',
    provider: 'HentaiTV',
    year: '2024',
    slug: 'contoh-slug',
    genre: 'Ecchi',
  });
  return `${filename}.mp4`;
});

const mangaPreview = computed(() => {
  const filename = buildFilename(settings.value.mangaTemplate, {
    manga: 'Uzaki-chan',
    chapter: '42',
    title: 'Judul Bab',
    pages: '24',
    date: '2024-09-20',
  });
  return `${filename}.cbz`;
});

const videoDirPreview = computed(() => {
  const sub = buildSubdirPath(settings.value.videoSubdir, {
    provider: 'HentaiTV', genre: 'Ecchi', year: '2024', title: 'C',
  });
  return [settings.value.videoDir, sub].filter(Boolean).join('/') + '/';
});

const mangaDirPreview = computed(() => {
  const sub = buildSubdirPath(settings.value.mangaSubdir, {
    manga: 'Uzaki-chan', chapter: '42',
  });
  return [settings.value.mangaDir, sub].filter(Boolean).join('/') + '/';
});

function update(key, value) {
  settings.value[key] = value;
  saveSettings();
}

function setVideoPreset(val) {
  settings.value.videoTemplate = val;
  saveSettings();
}

function setMangaPreset(val) {
  settings.value.mangaTemplate = val;
  saveSettings();
}

function toggleSubdir(type, key) {
  const group = type === 'video' ? 'videoSubdir' : 'mangaSubdir';
  settings.value[group][key] = !settings.value[group][key];
  saveSettings();
}
</script>

<template>
  <section class="settings-card dl-card">
    <div class="card-icon-box">
      <HardDrive :size="22" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Pengaturan Unduhan</h3>
        <p class="card-desc">
          Atur template nama file, direktori, subdirektori otomatis, dan kualitas default untuk video &amp; manga — bergaya Morti Download Manager.
        </p>
      </div>

      <!-- MODE SWITCH -->
      <div class="dl-section">
        <div class="section-label">
          <Layers :size="14" />
          Mode Penyimpanan
        </div>
        <div class="mode-switch-group">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: settings.mode === 'browser' }"
            @click="update('mode', 'browser')"
          >
            🌐 Download ke Browser
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: settings.mode === 'server-disk' }"
            @click="update('mode', 'server-disk')"
          >
            🗄️ Simpan ke Disk Server
          </button>
        </div>
        <p class="hint">
          <template v-if="settings.mode === 'browser'">File langsung diunduh ke folder Downloads browser Anda.</template>
          <template v-else>File disimpan di disk server ke path yang dikonfigurasi.</template>
        </p>
      </div>

      <!-- PARALLEL DOWNLOADS -->
      <div class="dl-section">
        <div class="section-label"><Film :size="14" /> Unduhan Paralel Maksimal</div>
        <div class="parallel-group">
          <button
            v-for="n in [1,2,3,4]"
            :key="n"
            type="button"
            class="parallel-btn"
            :class="{ active: settings.maxParallel === n }"
            @click="update('maxParallel', n)"
          >{{ n }}</button>
        </div>
      </div>

      <hr class="dl-divider" />

      <!-- VIDEO SETTINGS -->
      <div class="dl-section-header">
        <Film :size="16" />
        <span>Pengaturan Unduhan Video</span>
      </div>

      <div class="dl-section">
        <label class="section-label" for="video-dir"><FolderOpen :size="14" /> Direktori Output Video</label>
        <div class="path-input-row">
          <input
            id="video-dir"
            type="text"
            class="path-input"
            :value="settings.videoDir"
            placeholder="downloads/video"
            @input="update('videoDir', $event.target.value)"
          />
        </div>
      </div>

      <div class="dl-section">
        <div class="section-label">Subdirektori Otomatis</div>
        <div class="subdir-toggles">
          <label class="subdir-toggle">
            <input type="checkbox" :checked="settings.videoSubdir.byProvider" @change="toggleSubdir('video', 'byProvider')" />
            <span>Provider</span>
            <code class="subdir-preview">/HentaiTV/</code>
          </label>
          <label class="subdir-toggle">
            <input type="checkbox" :checked="settings.videoSubdir.byGenre" @change="toggleSubdir('video', 'byGenre')" />
            <span>Genre</span>
            <code class="subdir-preview">/Ecchi/</code>
          </label>
          <label class="subdir-toggle">
            <input type="checkbox" :checked="settings.videoSubdir.byYear" @change="toggleSubdir('video', 'byYear')" />
            <span>Tahun</span>
            <code class="subdir-preview">/2024/</code>
          </label>
          <label class="subdir-toggle">
            <input type="checkbox" :checked="settings.videoSubdir.byAlpha" @change="toggleSubdir('video', 'byAlpha')" />
            <span>Abjad</span>
            <code class="subdir-preview">/A/</code>
          </label>
        </div>
        <div class="path-preview-box">
          <span class="preview-lbl">Contoh path:</span>
          <code class="path-preview-val">{{ videoDirPreview }}nama-file.mp4</code>
        </div>
      </div>

      <div class="dl-section">
        <div class="section-label"><FileText :size="14" /> Template Nama File Video</div>
        <div class="preset-chips">
          <button
            v-for="p in VIDEO_PRESETS"
            :key="p.value"
            type="button"
            class="preset-chip"
            :class="{ active: settings.videoTemplate === p.value }"
            @click="setVideoPreset(p.value)"
          >{{ p.label }}</button>
        </div>
        <input
          type="text"
          class="path-input template-input"
          :value="settings.videoTemplate"
          @input="update('videoTemplate', $event.target.value)"
        />
        <p class="template-hint">Variabel: <code>{title}</code> <code>{quality}</code> <code>{provider}</code> <code>{date}</code> <code>{year}</code> <code>{slug}</code> <code>{genre}</code></p>
        <div class="preview-badge">
          <span class="preview-lbl">Pratinjau:</span>
          <span class="preview-val">{{ videoPreview }}</span>
        </div>
      </div>

      <div class="dl-section">
        <div class="section-label">Kualitas Default</div>
        <div class="quality-group">
          <button
            v-for="q in QUALITY_OPTIONS"
            :key="q.value"
            type="button"
            class="quality-btn"
            :class="{ active: settings.defaultQuality === q.value }"
            @click="update('defaultQuality', q.value)"
          >{{ q.label }}</button>
        </div>
      </div>

      <hr class="dl-divider" />

      <!-- MANGA SETTINGS -->
      <div class="dl-section-header">
        <BookOpen :size="16" />
        <span>Pengaturan Ekspor Manga &amp; Chapter</span>
      </div>

      <div class="dl-section">
        <label class="section-label" for="manga-dir"><FolderOpen :size="14" /> Direktori Output Manga</label>
        <input
          id="manga-dir"
          type="text"
          class="path-input"
          :value="settings.mangaDir"
          placeholder="downloads/manga"
          @input="update('mangaDir', $event.target.value)"
        />
      </div>

      <div class="dl-section">
        <div class="section-label">Subdirektori Otomatis</div>
        <div class="subdir-toggles">
          <label class="subdir-toggle">
            <input type="checkbox" :checked="settings.mangaSubdir.byManga" @change="toggleSubdir('manga', 'byManga')" />
            <span>Judul Manga</span>
            <code class="subdir-preview">/Uzaki-chan/</code>
          </label>
          <label class="subdir-toggle">
            <input type="checkbox" :checked="settings.mangaSubdir.byBatch" @change="toggleSubdir('manga', 'byBatch')" />
            <span>Batch Chapter (per 50)</span>
            <code class="subdir-preview">/Ch.001-050/</code>
          </label>
          <label class="subdir-toggle">
            <input type="checkbox" :checked="settings.mangaSubdir.byGenre" @change="toggleSubdir('manga', 'byGenre')" />
            <span>Genre</span>
            <code class="subdir-preview">/Ecchi/</code>
          </label>
        </div>
        <div class="path-preview-box">
          <span class="preview-lbl">Contoh path:</span>
          <code class="path-preview-val">{{ mangaDirPreview }}chapter.cbz</code>
        </div>
      </div>

      <div class="dl-section">
        <div class="section-label"><FileText :size="14" /> Template Nama File Chapter</div>
        <div class="preset-chips">
          <button
            v-for="p in MANGA_PRESETS"
            :key="p.value"
            type="button"
            class="preset-chip"
            :class="{ active: settings.mangaTemplate === p.value }"
            @click="setMangaPreset(p.value)"
          >{{ p.label }}</button>
        </div>
        <input
          type="text"
          class="path-input template-input"
          :value="settings.mangaTemplate"
          @input="update('mangaTemplate', $event.target.value)"
        />
        <p class="template-hint">Variabel: <code>{manga}</code> <code>{chapter}</code> <code>{chapter_padded}</code> <code>{title}</code> <code>{pages}</code> <code>{date}</code></p>
        <div class="preview-badge">
          <span class="preview-lbl">Pratinjau:</span>
          <span class="preview-val">{{ mangaPreview }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-card {
  display: flex; gap: 20px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.08));
  border-radius: var(--radius-md, 8px); padding: 24px;
}
.card-icon-box {
  width: 44px; height: 44px; border-radius: 10px;
  background: rgba(229,169,60,0.1);
  display: flex; align-items: center; justify-content: center;
  color: var(--kura-accent, #e5a93c); flex-shrink: 0;
}
.card-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 18px; }
.card-title { font-family: var(--kura-font-heading, sans-serif); font-size: 1.05rem; font-weight: 700; color: var(--kura-text-primary, #fff); margin: 0; }
.card-desc { font-size: 0.82rem; line-height: 1.5; color: var(--kura-text-muted, #94a3b8); margin: 6px 0 0; }

.dl-section { display: flex; flex-direction: column; gap: 8px; }
.dl-section-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.85rem; font-weight: 700;
  color: var(--kura-accent, #e5a93c);
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(229,169,60,0.15);
}
.dl-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 4px 0; }

.section-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 600;
  color: var(--kura-text-secondary, #cbd5e1);
}

/* Mode Switch */
.mode-switch-group { display: flex; gap: 8px; flex-wrap: wrap; }
.mode-btn {
  flex: 1; min-width: 150px; padding: 9px 14px; border-radius: 8px;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--kura-text-muted, #94a3b8);
  transition: all 0.15s ease; text-align: center;
}
.mode-btn.active {
  background: rgba(229,169,60,0.12);
  border-color: rgba(229,169,60,0.35);
  color: var(--kura-accent, #e5a93c);
}
.hint { font-size: 0.74rem; color: var(--kura-text-muted, #94a3b8); margin: 0; }

/* Parallel */
.parallel-group { display: flex; gap: 6px; }
.parallel-btn {
  width: 38px; height: 38px; border-radius: 8px;
  font-size: 0.9rem; font-weight: 700; cursor: pointer;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--kura-text-muted, #94a3b8);
  transition: all 0.15s ease;
}
.parallel-btn.active {
  background: rgba(229,169,60,0.15);
  border-color: var(--kura-accent, #e5a93c);
  color: var(--kura-accent, #e5a93c);
}

/* Path input */
.path-input-row { display: flex; gap: 8px; }
.path-input {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--kura-text-primary, #fff);
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.78rem; outline: none;
  transition: border-color 0.15s ease;
}
.path-input:focus { border-color: rgba(229,169,60,0.4); }
.path-input::placeholder { color: rgba(255,255,255,0.2); }
.template-input { font-family: var(--kura-font-sans, sans-serif); }

/* Subdir toggles */
.subdir-toggles { display: flex; flex-direction: column; gap: 6px; }
.subdir-toggle {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.78rem; color: var(--kura-text-secondary, #cbd5e1);
  cursor: pointer;
}
.subdir-toggle input[type="checkbox"] { accent-color: var(--kura-accent, #e5a93c); cursor: pointer; }
.subdir-preview {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.7rem; color: var(--kura-text-muted, #94a3b8);
  background: rgba(255,255,255,0.05); padding: 1px 5px; border-radius: 3px;
}

/* Path preview */
.path-preview-box {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 6px; padding: 8px 10px;
}
.path-preview-val {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem; color: var(--kura-accent, #e5a93c);
  word-break: break-all;
}

/* Preset chips */
.preset-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.preset-chip {
  padding: 4px 10px; border-radius: var(--radius-pill, 9999px);
  font-size: 0.7rem; font-weight: 600; cursor: pointer;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--kura-text-muted, #94a3b8);
  transition: all 0.15s ease;
}
.preset-chip.active {
  background: rgba(229,169,60,0.12);
  border-color: rgba(229,169,60,0.3);
  color: var(--kura-accent, #e5a93c);
}

/* Template hint */
.template-hint {
  font-size: 0.72rem; color: var(--kura-text-muted, #94a3b8); margin: 0;
}
.template-hint code {
  background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px;
  font-size: 0.7rem; color: var(--kura-text-primary, #fff);
}

/* Preview badge */
.preview-badge {
  display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px;
  background: rgba(229,169,60,0.06);
  border: 1px solid rgba(229,169,60,0.15);
  border-radius: 6px; padding: 7px 10px;
}
.preview-lbl { font-size: 0.7rem; color: var(--kura-text-muted, #94a3b8); flex-shrink: 0; }
.preview-val {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.73rem; color: var(--kura-accent, #e5a93c);
  word-break: break-all;
}

/* Quality group */
.quality-group { display: flex; flex-wrap: wrap; gap: 6px; }
.quality-btn {
  padding: 5px 12px; border-radius: var(--radius-pill, 9999px);
  font-size: 0.74rem; font-weight: 600; cursor: pointer;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--kura-text-muted, #94a3b8);
  transition: all 0.15s ease;
}
.quality-btn.active {
  background: rgba(229,169,60,0.15);
  border-color: rgba(229,169,60,0.35);
  color: var(--kura-accent, #e5a93c);
}
</style>
