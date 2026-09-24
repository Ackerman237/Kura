<script setup>
import { Sliders, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ bg: '#0E0F12', surface: '#17181C', accent: '#FF6B00', text: '#F4F4F6' }),
  },
});

const emit = defineEmits(['update:modelValue', 'save-and-apply']);

function updateColor(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>

<template>
  <section id="sec-custom" class="settings-card custom-theme-section">
    <div class="card-icon-box">
      <Sliders :size="24" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Studio Tema Kustom</h3>
        <p class="card-desc">Tentukan kombinasi warna favoritmu secara presisi. Variabel CSS akan disuntikkan secara dinamis.</p>
      </div>

      <div class="theme-creator-grid">
        <!-- Color Pickers Column -->
        <div class="pickers-column">
          <div class="picker-row">
            <label for="bg-picker" class="picker-label">Warna Latar (Background)</label>
            <div class="picker-control">
              <input id="bg-picker" type="color" class="color-swatch" :value="modelValue.bg" @input="updateColor('bg', $event.target.value)" />
              <span class="hex-code">{{ modelValue.bg }}</span>
            </div>
          </div>
          <div class="picker-row">
            <label for="surface-picker" class="picker-label">Warna Kartu &amp; Bar (Surface)</label>
            <div class="picker-control">
              <input id="surface-picker" type="color" class="color-swatch" :value="modelValue.surface" @input="updateColor('surface', $event.target.value)" />
              <span class="hex-code">{{ modelValue.surface }}</span>
            </div>
          </div>
          <div class="picker-row">
            <label for="accent-picker" class="picker-label">Warna Aksen Utama (Accent)</label>
            <div class="picker-control">
              <input id="accent-picker" type="color" class="color-swatch" :value="modelValue.accent" @input="updateColor('accent', $event.target.value)" />
              <span class="hex-code">{{ modelValue.accent }}</span>
            </div>
          </div>
          <div class="picker-row">
            <label for="text-picker" class="picker-label">Warna Teks Utama (Text)</label>
            <div class="picker-control">
              <input id="text-picker" type="color" class="color-swatch" :value="modelValue.text" @input="updateColor('text', $event.target.value)" />
              <span class="hex-code">{{ modelValue.text }}</span>
            </div>
          </div>
        </div>

        <!-- Live Preview Column -->
        <div class="preview-column">
          <span class="preview-label">Pratinjau Kartu (Live Preview)</span>
          <div
            class="live-theme-card-preview"
            :style="{
              backgroundColor: modelValue.surface,
              borderColor: modelValue.accent,
              color: modelValue.text
            }"
          >
            <div class="mock-poster" :style="{ borderColor: modelValue.accent }">
              <span class="mock-badge" :style="{ backgroundColor: modelValue.accent, color: '#000' }">MANGA</span>
            </div>
            <div class="mock-details">
              <h4 :style="{ color: modelValue.text }">Judul Komik Contoh</h4>
              <p :style="{ color: modelValue.text, opacity: 0.7 }">Ch. 42 • Selesai Dibaca</p>
              <button
                type="button"
                class="mock-btn"
                :style="{ backgroundColor: modelValue.accent, color: '#000' }"
              >
                Mulai Baca
              </button>
            </div>
          </div>

          <div class="theme-actions-row">
            <button type="button" class="apply-custom-btn" @click="emit('save-and-apply')">
              <CheckCircle2 :size="16" />
              <span>Simpan &amp; Terapkan Tema Kustom</span>
            </button>
          </div>
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
.theme-creator-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 640px) { .theme-creator-grid { grid-template-columns: 1fr 1fr; } }
.pickers-column { display: flex; flex-direction: column; gap: 14px; }
.picker-row { display: flex; flex-direction: column; gap: 6px; }
.picker-label { font-size: 0.76rem; font-weight: 600; color: var(--kura-text-secondary, #cbd5e1); }
.picker-control { display: flex; align-items: center; gap: 10px; }
.color-swatch { width: 36px; height: 36px; border: none; padding: 0; border-radius: 8px; cursor: pointer; background: none; }
.hex-code { font-family: var(--kura-font-mono, monospace); font-size: 0.74rem; color: var(--kura-text-muted, #94a3b8); }
.preview-column { display: flex; flex-direction: column; gap: 14px; }
.preview-label { font-size: 0.72rem; font-weight: 600; color: var(--kura-text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.06em; }
.live-theme-card-preview {
  border: 2px solid; border-radius: 12px; padding: 16px;
  display: flex; align-items: center; gap: 14px;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}
.mock-poster {
  width: 56px; height: 76px; border-radius: 6px; flex-shrink: 0;
  background: rgba(255,255,255,0.08);
  border: 2px solid; display: flex; align-items: flex-start; justify-content: flex-end;
  padding: 4px;
}
.mock-badge {
  font-size: 0.55rem; font-weight: 800; padding: 2px 5px;
  border-radius: 3px; letter-spacing: 0.05em;
}
.mock-details { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.mock-details h4 { font-size: 0.82rem; font-weight: 700; margin: 0; }
.mock-details p { font-size: 0.7rem; margin: 0; }
.mock-btn {
  margin-top: 4px; padding: 5px 10px; border-radius: 6px;
  border: none; font-size: 0.7rem; font-weight: 700; cursor: pointer; width: fit-content;
}
.theme-actions-row { margin-top: auto; }
.apply-custom-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--kura-accent, #e5a93c); color: #000;
  border: none; padding: 9px 18px; border-radius: var(--radius-pill, 9999px);
  font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: opacity 0.15s ease; width: 100%; justify-content: center;
}
.apply-custom-btn:hover { opacity: 0.88; }
</style>
