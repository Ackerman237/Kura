<script setup>
import { ref, onMounted } from 'vue';
import { HardDrive, Trash2, Download, Upload, RefreshCw, Zap, Image as ImageIcon, Database } from 'lucide-vue-next';
import {
  getCacheConfig,
  saveCacheConfig,
  CACHE_PRESETS,
  clearApiCache,
  clearImageCache,
  clearAllCache,
  getStorageEstimate,
} from '../../../services/clientCache.js';

const props = defineProps({
  offlineChapterCount: { type: Number, default: 0 },
  currentTheme: { type: String, default: 'default' },
  customTheme: { type: Object, default: () => ({}) },
  peekDuration: { type: Number, default: 2000 },
  blurIntensity: { type: String, default: '12px' },
  readerMode: { type: String, default: 'webtoon' },
  defaultVideoProvider: { type: String, default: 'nekopoi' },
});

const emit = defineEmits(['clear-offline', 'restore-backup']);

const cacheConfig = ref(getCacheConfig());
const storageStats = ref({ usage: 0, quota: 0, percent: 0, apiEntryCount: 0 });
const actionNotice = ref('');

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const refreshStorageStats = async () => {
  storageStats.value = await getStorageEstimate();
};

const setPreset = (presetKey) => {
  const preset = CACHE_PRESETS[presetKey];
  if (!preset) return;
  cacheConfig.value = {
    preset: presetKey,
    ...preset,
  };
  saveCacheConfig(cacheConfig.value);
  showNotice(`Preset caching diubah ke "${preset.label}"`);
};

const updateTtl = (key, value) => {
  cacheConfig.value[key] = Number(value) || 1;
  cacheConfig.value.preset = 'custom';
  saveCacheConfig(cacheConfig.value);
};

const showNotice = (msg) => {
  actionNotice.value = msg;
  setTimeout(() => {
    if (actionNotice.value === msg) actionNotice.value = '';
  }, 3500);
};

const handleClearApi = async () => {
  if (confirm('Kosongkan seluruh cache data respons API di browser?')) {
    await clearApiCache();
    await refreshStorageStats();
    showNotice('Cache respons API berhasil dikosongkan.');
  }
};

const handleClearImages = async () => {
  if (confirm('Kosongkan cache gambar cover dan poster thumbnail di browser?')) {
    await clearImageCache();
    await refreshStorageStats();
    showNotice('Cache gambar & cover berhasil dibersihkan.');
  }
};

const handleClearAll = async () => {
  if (confirm('Bersihkan seluruh cache client (API & Gambar)? Bab komik offline tidak akan terhapus.')) {
    await clearAllCache();
    await refreshStorageStats();
    showNotice('Seluruh cache berhasil di-reset.');
  }
};

onMounted(() => {
  refreshStorageStats();
});

function exportBackupData() {
  try {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      theme: props.currentTheme,
      customTheme: props.customTheme,
      readingProgress: JSON.parse(localStorage.getItem('kura_reading_progress') || '{}'),
      bookmarks: JSON.parse(localStorage.getItem('kura_bookmarks') || '[]'),
      settings: {
        peekDuration: props.peekDuration,
        blurIntensity: props.blurIntensity,
        readerMode: props.readerMode,
        defaultVideoProvider: props.defaultVideoProvider,
      },
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kura_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Gagal mengekspor data cadangan.');
  }
}

function importBackupData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !data.version) {
        alert('File JSON tidak valid atau bukan format cadangan Kura.');
        return;
      }
      if (confirm('Pulihkan data dari cadangan ini? Data riwayat dan bookmark yang ada akan digabungkan.')) {
        emit('restore-backup', data);
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert('Gagal membaca file cadangan: Format JSON tidak valid.');
    }
  };
  reader.readAsText(file);
}

function clearReadingHistory() {
  if (confirm('Hapus seluruh riwayat bacaan komik dari perangkat ini?')) {
    localStorage.removeItem('kura_reading_progress');
    alert('Riwayat bacaan telah dibersihkan.');
  }
}
</script>

<template>
  <section id="sec-storage" class="settings-card">
    <div class="card-icon-box">
      <HardDrive :size="24" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Cadangan, Penyimpanan &amp; Cache Data</h3>
        <p class="card-desc">
          Kelola riwayat bacaan, favorit, dan ekspor/impor seluruh data Kura ke format JSON standar untuk dipindahkan antar perangkat.
        </p>
      </div>

      <!-- Notice Toast -->
      <div v-if="actionNotice" class="storage-notice">
        <span>{{ actionNotice }}</span>
      </div>

      <!-- Storage Gauge Monitor -->
      <div class="storage-gauge-card">
        <div class="gauge-header">
          <div class="gauge-title-box">
            <Database :size="16" />
            <span class="gauge-title">Penggunaan Memori Browser (Storage Gauge)</span>
          </div>
          <span class="gauge-fraction">
            {{ formatBytes(storageStats.usage) }} / {{ formatBytes(storageStats.quota) }} ({{ storageStats.percent }}%)
          </span>
        </div>

        <div class="gauge-track">
          <div
            class="gauge-fill"
            :style="{ width: `${Math.min(100, Math.max(2, storageStats.percent))}%` }"
          ></div>
        </div>

        <div class="gauge-metrics">
          <div class="metric-item">
            <span class="m-val">{{ offlineChapterCount }}</span>
            <span class="m-lbl">Bab Offline</span>
          </div>
          <div class="metric-item">
            <span class="m-val">{{ storageStats.apiEntryCount }}</span>
            <span class="m-lbl">Cache Respons API</span>
          </div>
          <div class="metric-item">
            <span class="m-val">{{ formatBytes(storageStats.usage) }}</span>
            <span class="m-lbl">Ruang Terpakai</span>
          </div>
        </div>
      </div>

      <!-- Cache Strategy & Preset Controls -->
      <div class="cache-controls-card">
        <div class="cache-ctrl-header">
          <div class="ctrl-title-box">
            <Zap :size="16" />
            <span class="ctrl-title">Strategi Caching Client-Side</span>
          </div>
          <span class="ctrl-badge">Hemat Server 90%+</span>
        </div>
        <p class="ctrl-desc">
          Data komik dan video disimpan di browser Anda sesuai durasi berikut. Saat offline atau koneksi lambat, data dimuat instan (0 detik).
        </p>

        <!-- Preset Pills -->
        <div class="preset-pill-group">
          <button
            v-for="(p, pKey) in CACHE_PRESETS"
            :key="pKey"
            type="button"
            class="preset-pill-btn"
            :class="{ active: cacheConfig.preset === pKey }"
            @click="setPreset(pKey)"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- TTL Summary Badges -->
        <div class="ttl-summary-strip">
          <div class="ttl-badge">
            <span class="ttl-label">Beranda:</span>
            <span class="ttl-val">{{ cacheConfig.homeTtlMin }} Menit</span>
          </div>
          <div class="ttl-badge">
            <span class="ttl-label">Detail:</span>
            <span class="ttl-val">{{ cacheConfig.detailTtlMin >= 60 ? `${cacheConfig.detailTtlMin / 60} Jam` : `${cacheConfig.detailTtlMin} Mnt` }}</span>
          </div>
          <div class="ttl-badge">
            <span class="ttl-label">Pencarian:</span>
            <span class="ttl-val">{{ cacheConfig.searchTtlMin }} Menit</span>
          </div>
          <div class="ttl-badge">
            <span class="ttl-label">Cover Gambar:</span>
            <span class="ttl-val">{{ cacheConfig.imageTtlDays }} Hari</span>
          </div>
        </div>

        <!-- Custom Inputs (Shown if custom preset active) -->
        <div v-if="cacheConfig.preset === 'custom'" class="custom-ttl-grid">
          <label class="ttl-input-group">
            <span class="ttl-inp-label">Beranda (Menit)</span>
            <input
              type="number"
              min="1"
              max="1440"
              :value="cacheConfig.homeTtlMin"
              class="ttl-input"
              @input="updateTtl('homeTtlMin', $event.target.value)"
            />
          </label>
          <label class="ttl-input-group">
            <span class="ttl-inp-label">Detail Komik/Video (Menit)</span>
            <input
              type="number"
              min="5"
              max="2880"
              :value="cacheConfig.detailTtlMin"
              class="ttl-input"
              @input="updateTtl('detailTtlMin', $event.target.value)"
            />
          </label>
          <label class="ttl-input-group">
            <span class="ttl-inp-label">Hasil Cari (Menit)</span>
            <input
              type="number"
              min="1"
              max="720"
              :value="cacheConfig.searchTtlMin"
              class="ttl-input"
              @input="updateTtl('searchTtlMin', $event.target.value)"
            />
          </label>
        </div>

        <!-- Cache Purge Action Buttons -->
        <div class="cache-purge-actions">
          <button type="button" class="purge-btn" @click="handleClearApi">
            <Database :size="13" />
            <span>Bersihkan Cache API</span>
          </button>
          <button type="button" class="purge-btn" @click="handleClearImages">
            <ImageIcon :size="13" />
            <span>Bersihkan Cache Cover</span>
          </button>
          <button type="button" class="purge-btn danger" @click="handleClearAll">
            <Trash2 :size="13" />
            <span>Reset Semua Cache</span>
          </button>
        </div>
      </div>

      <!-- Backup JSON Actions -->
      <div class="backup-actions-grid">
        <div class="backup-action-card">
          <div class="bac-info">
            <h4 class="bac-title">Ekspor Cadangan (Backup JSON)</h4>
            <p class="bac-desc">Unduh seluruh riwayat bacaan, bookmark, dan pengaturan tema sebagai satu file cadangan.</p>
          </div>
          <button type="button" class="bac-btn export" @click="exportBackupData">
            <Download :size="15" />
            <span>Ekspor File Cadangan</span>
          </button>
        </div>

        <div class="backup-action-card">
          <div class="bac-info">
            <h4 class="bac-title">Pulihkan Data (Restore JSON)</h4>
            <p class="bac-desc">Pulihkan data riwayat dan favorit dari file cadangan Kura yang telah diekspor sebelumnya.</p>
          </div>
          <label class="bac-btn import">
            <Upload :size="15" />
            <span>Pilih File Cadangan</span>
            <input type="file" accept=".json" class="hidden-file-input" @change="importBackupData" />
          </label>
        </div>
      </div>

      <div class="storage-info-box">
        <div class="storage-stats">
          <span class="storage-label">Bab Tersimpan Offline:</span>
          <span class="storage-value">{{ offlineChapterCount }} Bab</span>
        </div>
        <div class="storage-actions">
          <button v-if="offlineChapterCount > 0" type="button" class="clear-btn" @click="$emit('clear-offline')">
            <Trash2 :size="14" />
            Bersihkan Bab Offline
          </button>
          <button type="button" class="clear-btn secondary" @click="clearReadingHistory">
            <RefreshCw :size="14" />
            Reset Riwayat Baca
          </button>
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
  background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  color: var(--kura-text-muted, #94a3b8); flex-shrink: 0;
}
.card-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
.card-title { font-family: var(--kura-font-heading, sans-serif); font-size: 1.05rem; font-weight: 700; color: var(--kura-text-primary, #fff); margin: 0; }
.card-desc { font-size: 0.82rem; line-height: 1.5; color: var(--kura-text-muted, #94a3b8); margin: 6px 0 0; }
.backup-actions-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 640px) { .backup-actions-grid { grid-template-columns: repeat(2, 1fr); } }
.backup-action-card {
  display: flex; flex-direction: column; gap: 12px; justify-content: space-between;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.08));
  border-radius: 8px; padding: 16px;
}
.bac-title { font-size: 0.88rem; font-weight: 700; color: var(--kura-text-primary, #fff); margin: 0 0 4px; }
.bac-desc { font-size: 0.76rem; line-height: 1.5; color: var(--kura-text-muted, #94a3b8); margin: 0; }
.bac-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 14px; border-radius: var(--radius-pill, 9999px);
  font-size: 0.78rem; font-weight: 700; cursor: pointer;
  transition: all 0.15s ease; border: none; width: fit-content;
}
.bac-btn.export { background: var(--kura-accent, #e5a93c); color: #000; }
.bac-btn.export:hover { opacity: 0.88; }
.bac-btn.import { background: rgba(255,255,255,0.06); color: var(--kura-text-primary, #fff); border: 1px solid var(--kura-border-subtle); }
.bac-btn.import:hover { border-color: var(--kura-accent); }
.hidden-file-input { display: none; }
.storage-info-box {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.08));
  border-radius: 8px; padding: 14px 18px;
}
.storage-stats { display: flex; align-items: center; gap: 8px; }
.storage-label { font-size: 0.8rem; color: var(--kura-text-muted, #94a3b8); }
.storage-value { font-size: 0.85rem; font-weight: 700; color: var(--kura-accent, #e5a93c); }
.storage-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.clear-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: var(--radius-pill, 9999px);
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
  color: #f87171; font-size: 0.74rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s ease;
}
.clear-btn:hover { background: rgba(239,68,68,0.15); }
.clear-btn.secondary { background: rgba(255,255,255,0.04); border-color: var(--kura-border-subtle); color: var(--kura-text-muted, #94a3b8); }
.clear-btn.secondary:hover { border-color: var(--kura-accent); color: var(--kura-accent); }

/* Notice Toast */
.storage-notice {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Storage Gauge Card */
.storage-gauge-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gauge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.gauge-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--kura-accent, #e5a93c);
}

.gauge-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.gauge-fraction {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.78rem;
  color: var(--kura-text-muted, #94a3b8);
}

.gauge-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, var(--kura-accent, #e5a93c));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.gauge-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 4px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.m-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.m-lbl {
  font-size: 0.7rem;
  color: var(--kura-text-muted, #94a3b8);
}

/* Cache Controls Card */
.cache-controls-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cache-ctrl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.ctrl-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--kura-accent, #e5a93c);
}

.ctrl-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.ctrl-badge {
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
}

.ctrl-desc {
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
}

.preset-pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-pill-btn {
  padding: 6px 14px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-pill-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.preset-pill-btn.active {
  background: rgba(229, 169, 60, 0.15);
  border-color: var(--kura-accent, #e5a93c);
  color: var(--kura-accent, #e5a93c);
}

.ttl-summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.ttl-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.74rem;
}

.ttl-label {
  color: var(--kura-text-muted, #94a3b8);
}

.ttl-val {
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.custom-ttl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px dashed rgba(229, 169, 60, 0.3);
}

.ttl-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ttl-inp-label {
  font-size: 0.72rem;
  color: var(--kura-text-muted, #94a3b8);
}

.ttl-input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  padding: 6px 10px;
  color: #ffffff;
  font-size: 0.8rem;
  outline: none;
}

.ttl-input:focus {
  border-color: var(--kura-accent, #e5a93c);
}

.cache-purge-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 6px;
}

.purge-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-primary, #ffffff);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.purge-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
}

.purge-btn.danger {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.08);
}

.purge-btn.danger:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}
</style>
