<script setup>
import { Palette } from 'lucide-vue-next';

const props = defineProps({
  currentTheme: {
    type: String,
    default: 'default',
  },
});

const emit = defineEmits(['set-theme']);

const presetThemes = [
  { id: 'default', name: 'Sumi Charcoal', desc: 'Default Pan-CJK Dark', bg: '#0E0F12', accent: '#FF6B00' },
  { id: 'cinema', name: 'Cinema Amber', desc: 'Warm Cozy Ambient', bg: '#110D0A', accent: '#F59E0B' },
  { id: 'amoled', name: 'AMOLED Black', desc: 'True Black OLED Saver', bg: '#000000', accent: '#FF7A1A' },
  { id: 'yoru', name: 'Yoru Jade', desc: 'Matcha Emerald Atelier', bg: '#090D14', accent: '#10B981' },
  { id: 'sakura', name: 'Sakura Wine', desc: 'Deep Wine & Rose Blossom', bg: '#140A10', accent: '#EC4899' },
  { id: 'cyberpunk', name: 'Tokyo Cyber', desc: 'Neo-Tokyo Violet & Yellow', bg: '#0C071E', accent: '#FACC15' },
  { id: 'nord', name: 'Nordic Frost', desc: 'Arctic Slate & Ice Blue', bg: '#0B111A', accent: '#38BDF8' },
  { id: 'sepia', name: 'Vintage Sepia', desc: 'Warm Paper & Bronze', bg: '#15100B', accent: '#D97706' },
];
</script>

<template>
  <section class="settings-card">
    <div class="card-icon-box">
      <Palette :size="24" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Pilihan Tema Visual (8 Suasana Kura)</h3>
        <p class="card-desc">Pilih suasana visual yang sesuai dengan pencahayaan lingkungan dan kenyamanan mata.</p>
      </div>

      <div class="theme-options-grid">
        <button
          v-for="t in presetThemes"
          :key="t.id"
          type="button"
          class="theme-card"
          :class="{ active: currentTheme === t.id }"
          @click="emit('set-theme', t.id)"
        >
          <div class="theme-preview" :style="{ background: t.bg, border: `2px solid ${t.accent}` }">
            <span class="preview-dot" :style="{ background: t.accent }"></span>
          </div>
          <span class="theme-name">{{ t.name }}</span>
          <span class="theme-detail">{{ t.desc }}</span>
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

.theme-options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .theme-options-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.theme-card.active {
  border-color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.08);
}

.theme-preview {
  width: 44px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.theme-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.theme-detail {
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}
</style>
