<script setup>
import { HardDrive, Trash2, Download, Upload, RefreshCw } from 'lucide-vue-next';

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
</style>
