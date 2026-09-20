<script setup>
import { Terminal } from 'lucide-vue-next';

const SHORTCUTS = [
  { key: '[', action: 'Pindah ke Chapter Sebelumnya' },
  { key: ']', action: 'Pindah ke Chapter Berikutnya' },
  { key: 'A / ←', action: 'Halaman Sebelumnya (Mode Paged)' },
  { key: 'D / →', action: 'Halaman Berikutnya (Mode Paged)' },
  { key: 'Spasi', action: 'Jeda / Jalankan Auto-Scroll Reader' },
  { key: 'F', action: 'Beralih Layar Penuh (Fullscreen)' },
  { key: 'M', action: 'Ganti Mode Baca (Webtoon / Halaman)' },
  { key: 'Ctrl + K', action: 'Buka Kotak Pencarian Global' },
  { key: 'Esc', action: 'Tutup Reader / Kembali' },
];
</script>

<template>
  <div class="shortcut-card">
    <div class="card-header">
      <div class="header-left">
        <Terminal :size="16" class="icon-accent" />
        <h3 class="card-title">Daftar Pintasan Keyboard (Keyboard Shortcuts)</h3>
      </div>
    </div>

    <div class="shortcut-grid">
      <div v-for="(sc, i) in SHORTCUTS" :key="i" class="shortcut-row">
        <kbd class="key-badge">{{ sc.key }}</kbd>
        <span class="action-label">{{ sc.action }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shortcut-card {
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

.shortcut-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 640px) {
  .shortcut-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .shortcut-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.06));
}

.key-badge {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--kura-accent, #e5a93c);
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(229, 169, 60, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.action-label {
  font-size: 0.76rem;
  color: var(--kura-text-secondary, #cbd5e1);
}
</style>
