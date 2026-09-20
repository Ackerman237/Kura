<script setup>
import { Sparkles } from 'lucide-vue-next';

const emit = defineEmits(['apply-palette']);

const curated21stPalettes = [
  { name: 'Minimal Zinc', style: 'Neutral Sleek', bg: '#09090b', surface: '#18181b', accent: '#fafafa', text: '#f4f4f5' },
  { name: 'Neon Cyberpunk', style: 'High Voltage', bg: '#0d0d15', surface: '#161626', accent: '#00ffcc', text: '#ffffff' },
  { name: 'Emerald Grove', style: 'Deep Forest', bg: '#06130d', surface: '#0f241a', accent: '#10b981', text: '#e6f7ef' },
  { name: 'Sunset Horizon', style: 'Warm Glow', bg: '#140c0b', surface: '#221514', accent: '#f97316', text: '#fef2f2' },
  { name: 'Velvet Rose', style: 'Dark Floral', bg: '#160a12', surface: '#261220', accent: '#f43f5e', text: '#fff1f2' },
  { name: 'Royal Amethyst', style: 'Imperial Violet', bg: '#0f0c1b', surface: '#1c1630', accent: '#a855f7', text: '#faf5ff' },
  { name: 'Glacier Ice', style: 'Polar Clean', bg: '#08121e', surface: '#112236', accent: '#38bdf8', text: '#f0f9ff' },
  { name: 'Solar Amber', style: 'Golden Glow', bg: '#130e06', surface: '#241a0b', accent: '#eab308', text: '#fefce8' },
];
</script>

<template>
  <section class="settings-card">
    <div class="card-icon-box">
      <Sparkles :size="24" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Palet Kurasi 21st.dev</h3>
        <p class="card-desc">
          Pilihan palet warna modern dari tren antarmuka 21st.dev. Klik untuk memuat palet ke pembuat tema kustom secara instan.
        </p>
      </div>

      <div class="palettes-21st-grid">
        <button
          v-for="p in curated21stPalettes"
          :key="p.name"
          type="button"
          class="palette-chip"
          @click="emit('apply-palette', p)"
        >
          <div class="palette-swatches">
            <span class="swatch" :style="{ background: p.bg }"></span>
            <span class="swatch" :style="{ background: p.surface }"></span>
            <span class="swatch" :style="{ background: p.accent }"></span>
          </div>
          <div class="palette-meta">
            <span class="palette-name">{{ p.name }}</span>
            <span class="palette-tags">{{ p.style }}</span>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-card {
  display: flex;
  gap: 20px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  padding: 24px;
}

.card-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kura-text-muted, #94a3b8);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.card-desc {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--kura-text-muted, #94a3b8);
  margin: 6px 0 0;
}

.palettes-21st-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (min-width: 640px) {
  .palettes-21st-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.palette-chip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.palette-chip:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.palette-swatches {
  display: flex;
  gap: 4px;
}

.swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.palette-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.palette-name {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.palette-tags {
  font-size: 0.65rem;
  color: var(--kura-text-muted, #94a3b8);
}
</style>
