<script setup>
import { ArrowRight } from 'lucide-vue-next';

const emit = defineEmits(['navigate']);
</script>

<template>
  <section
    id="sec-about"
    class="settings-card about-portal-card"
    role="button"
    tabindex="0"
    @click="emit('navigate', 'about')"
    @keydown.enter="emit('navigate', 'about')"
  >
    <div class="card-icon-box portal-icon">
      <div class="portal-kanji">蔵</div>
    </div>
    <div class="card-content">
      <div class="card-text">
        <div class="card-title-row">
          <h3 class="card-title">Tentang Kura (蔵) — Arsitektur &amp; Monitor Diagnostik</h3>
          <span class="portal-badge">BUKA LAYAR TERPISAH <ArrowRight :size="12" /></span>
        </div>
        <p class="card-desc">
          Pelajari arsitektur anti-iklan sandbox Kura, pantau pemakaian memori IndexedDB &amp; browser secara real-time, periksa matriks teknologi, dan panduan pintasan keyboard lengkap.
        </p>
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
.about-portal-card {
  cursor: pointer;
  border-color: rgba(229,169,60,0.2);
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}
.about-portal-card:hover {
  border-color: var(--kura-accent, #e5a93c);
  background: rgba(229,169,60,0.04);
  transform: translateY(-2px);
}
.card-icon-box {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.portal-icon {
  background: rgba(229,169,60,0.12);
}
.portal-kanji {
  font-size: 1.6rem; font-weight: 900;
  background: linear-gradient(135deg, var(--kura-accent, #e5a93c), #f7c673);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}
.card-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.card-title { font-family: var(--kura-font-heading, sans-serif); font-size: 1.05rem; font-weight: 700; color: var(--kura-text-primary, #fff); margin: 0; }
.card-desc { font-size: 0.82rem; line-height: 1.5; color: var(--kura-text-muted, #94a3b8); margin: 0; }
.portal-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(229,169,60,0.12); border: 1px solid rgba(229,169,60,0.3);
  color: var(--kura-accent, #e5a93c);
  font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em;
  padding: 3px 10px; border-radius: var(--radius-pill, 9999px);
  white-space: nowrap; flex-shrink: 0;
}
</style>
