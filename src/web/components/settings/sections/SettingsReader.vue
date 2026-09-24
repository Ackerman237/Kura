<script setup>
import { Layers, Tv } from 'lucide-vue-next';

const props = defineProps({
  readerMode: { type: String, default: 'webtoon' },
  defaultVideoProvider: { type: String, default: 'nekopoi' },
});

const emit = defineEmits(['set-reader-mode', 'set-video-provider']);
</script>

<template>
  <section id="sec-reader" class="settings-card">
    <div class="card-icon-box">
      <Layers :size="24" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Preferensi Reader &amp; Pemutar Video</h3>
        <p class="card-desc">Konfigurasikan tata letak pembaca bab dan preferensi pemutar video bawaan.</p>
      </div>

      <div class="settings-subgrid">
        <!-- Mode Baca -->
        <div class="setting-item">
          <label class="setting-item-label">Mode Baca Default</label>
          <div class="chip-options">
            <button
              type="button"
              class="chip-btn"
              :class="{ active: readerMode === 'webtoon' }"
              @click="emit('set-reader-mode', 'webtoon')"
            >
              Vertikal Webtoon (Continuous)
            </button>
            <button
              type="button"
              class="chip-btn"
              :class="{ active: readerMode === 'paged' }"
              @click="emit('set-reader-mode', 'paged')"
            >
              Halaman Tunggal (Paged)
            </button>
          </div>
          <span class="setting-hint">Format tampilan halaman komik saat bab dibuka.</span>
        </div>

        <!-- Provider Video Default -->
        <div class="setting-item">
          <label class="setting-item-label">Sumber / Provider Video Default</label>
          <div class="chip-options">
            <button
              type="button"
              class="chip-btn"
              :class="{ active: defaultVideoProvider === 'nekopoi' }"
              @click="emit('set-video-provider', 'nekopoi')"
            >
              <Tv :size="13" /> Nekopoi
            </button>
            <button
              type="button"
              class="chip-btn"
              :class="{ active: defaultVideoProvider === 'animeplay' }"
              @click="emit('set-video-provider', 'animeplay')"
            >
              <Tv :size="13" /> AnimePlay
            </button>
          </div>
          <span class="setting-hint">Katalog video yang otomatis dimuat saat beralih ke tab Video.</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-card {
  display: flex;
  gap: 20px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.08));
  border-radius: var(--radius-md, 8px);
  padding: 24px;
}
.card-icon-box {
  width: 44px; height: 44px; border-radius: 10px;
  background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  color: var(--kura-text-muted, #94a3b8); flex-shrink: 0;
}
.card-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.card-title { font-family: var(--kura-font-heading, sans-serif); font-size: 1.05rem; font-weight: 700; color: var(--kura-text-primary, #fff); margin: 0; }
.card-desc { font-size: 0.82rem; line-height: 1.5; color: var(--kura-text-muted, #94a3b8); margin: 6px 0 0; }
.settings-subgrid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .settings-subgrid { grid-template-columns: repeat(2, 1fr); } }
.setting-item { display: flex; flex-direction: column; gap: 8px; }
.setting-item-label { font-size: 0.78rem; font-weight: 600; color: var(--kura-text-primary, #fff); }
.chip-options { display: flex; flex-wrap: wrap; gap: 6px; }
.chip-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: var(--radius-pill, 9999px);
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.1));
  color: var(--kura-text-secondary, #cbd5e1);
  font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}
.chip-btn:hover { border-color: #fff; }
.chip-btn.active { background: var(--kura-accent, #e5a93c); color: #000; border-color: var(--kura-accent, #e5a93c); }
.setting-hint { font-size: 0.68rem; color: var(--kura-text-muted, #94a3b8); }
</style>
