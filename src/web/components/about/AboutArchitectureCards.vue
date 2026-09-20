<script setup>
import { ShieldCheck, Layers, HardDrive } from 'lucide-vue-next';

const architecturePillars = [
  {
    icon: ShieldCheck,
    title: 'Perisai Sandbox CSP Anti-Adware',
    desc: 'Semua iframe pemutar video pihak ketiga dibersihkan di backend via curl.exe TLS fallback dan dikunci dengan header Content-Security-Policy sandbox allow-scripts allow-forms allow-presentation untuk melucuti semua script popunder jahat.',
  },
  {
    icon: Layers,
    title: 'Arsitektur Layar Penuh (Kura Dedicated Screen Pattern)',
    desc: 'Menolak pola modal popup bertumpuk yang sempit. Setiap navigasi memiliki layar dedicated mandiri untuk beranda, katalog, detail komik, pembaca bab, dan pemutar video serial 70/30.',
  },
  {
    icon: HardDrive,
    title: 'Penyimpanan Offline Mandiri (IndexedDB)',
    desc: 'Seluruh bab komik yang diunduh disimpan langsung ke dalam basis data browser lokal pengguna (IndexedDB) sehingga tetap dapat dinikmati saat perangkat tidak terhubung ke jaringan internet.',
  },
];
</script>

<template>
  <div class="architecture-grid">
    <div
      v-for="(pillar, idx) in architecturePillars"
      :key="idx"
      class="pillar-card"
    >
      <div class="pillar-icon-box">
        <component :is="pillar.icon" :size="20" />
      </div>
      <h3 class="pillar-title">{{ pillar.title }}</h3>
      <p class="pillar-desc">{{ pillar.desc }}</p>
    </div>
  </div>
</template>

<style scoped>
.architecture-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .architecture-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pillar-card {
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
}

.pillar-card:hover {
  border-color: var(--kura-accent, #e5a93c);
  transform: translateY(-3px);
}

.pillar-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(229, 169, 60, 0.12);
  color: var(--kura-accent, #e5a93c);
  border: 1px solid rgba(229, 169, 60, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pillar-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.pillar-desc {
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
}
</style>
