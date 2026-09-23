<script setup>
import { ref, onMounted } from 'vue';
import { Cpu, HardDrive, Monitor, Palette, Bookmark, CheckCircle2 } from 'lucide-vue-next';

const stats = ref({
  storageKB: '0.00',
  bookmarksCount: 0,
  activeTheme: 'default',
  viewport: `${window.innerWidth} x ${window.innerHeight}`,
  engine: 'Vue 3 + Vite',
});

onMounted(() => {
  try {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    stats.value.storageKB = (totalBytes / 1024).toFixed(2);

    const bms = JSON.parse(localStorage.getItem('kura_bookmarks') || '[]');
    stats.value.bookmarksCount = bms.length;

    stats.value.activeTheme = localStorage.getItem('kura_theme') || 'default';
  } catch (_) {}
});
</script>

<template>
  <div class="diagnostics-card">
    <div class="card-header">
      <div class="header-left">
        <Cpu :size="16" class="icon-accent" />
        <h3 class="card-title">Monitor Diagnostik Klien & Penyimpanan</h3>
      </div>
      <span class="live-pill">LIVE DIAGNOSTICS</span>
    </div>

    <div class="diag-grid">
      <div class="diag-item">
        <HardDrive :size="15" class="item-icon" />
        <div class="diag-meta">
          <span class="diag-label">Penyimpanan Browser Terpakai</span>
          <span class="diag-value">{{ stats.storageKB }} KB</span>
        </div>
      </div>

      <div class="diag-item">
        <Bookmark :size="15" class="item-icon" />
        <div class="diag-meta">
          <span class="diag-label">Komik Tersimpan di Pustaka</span>
          <span class="diag-value">{{ stats.bookmarksCount }} Judul</span>
        </div>
      </div>

      <div class="diag-item">
        <Palette :size="15" class="item-icon" />
        <div class="diag-meta">
          <span class="diag-label">Tema Visual Aktif</span>
          <span class="diag-value capitalize">{{ stats.activeTheme }}</span>
        </div>
      </div>

      <div class="diag-item">
        <Monitor :size="15" class="item-icon" />
        <div class="diag-meta">
          <span class="diag-label">Resolusi Viewport Layar</span>
          <span class="diag-value">{{ stats.viewport }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diagnostics-card {
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-accent {
  color: var(--kura-accent, #e5a93c);
}

.card-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.live-pill {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.3);
  padding: 2px 8px;
  border-radius: var(--radius-pill, 9999px);
}

.diag-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 768px) {
  .diag-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.diag-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.06));
}

.item-icon {
  color: var(--kura-text-muted, #94a3b8);
  margin-top: 2px;
}

.diag-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.diag-label {
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}

.diag-value {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.capitalize {
  text-transform: capitalize;
}
</style>
