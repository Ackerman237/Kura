<script setup>
import { ref } from 'vue';
import { Image as ImageIcon, CheckCircle2, Info } from 'lucide-vue-next';
import { useToast } from '../../../composables/useToast.js';

const emit = defineEmits(['apply-extracted']);

const toast = useToast();
const fileInputRef = ref(null);
const canvasRef = ref(null);
const extractedPreview = ref('');
const extractedPalette = ref(null);

function triggerFileInput() {
  if (fileInputRef.value) fileInputRef.value.click();
}

function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    toast.warning('Ukuran gambar maksimal adalah 10MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    extractedPreview.value = dataUrl;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => extractColors(img);
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function extractColors(img) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size).data;
  const buckets = [];

  for (let i = 0; i < imgData.length; i += 16) {
    const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2], a = imgData[i + 3];
    if (a < 128) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    buckets.push({ r, g, b, h, s, l });
  }

  if (!buckets.length) return;

  const vibrant = buckets.filter(c => c.s > 0.4 && c.l > 0.35 && c.l < 0.75).sort((a, b) => b.s - a.s);
  const accent = vibrant.length ? vibrant[0] : buckets[0];

  const bgR = Math.max(10, Math.min(22, Math.round(accent.r * 0.08)));
  const bgG = Math.max(10, Math.min(22, Math.round(accent.g * 0.08)));
  const bgB = Math.max(14, Math.min(26, Math.round(accent.b * 0.08)));

  const surfR = Math.min(36, bgR + 12);
  const surfG = Math.min(36, bgG + 12);
  const surfB = Math.min(42, bgB + 14);

  extractedPalette.value = {
    bg: rgbToHex(bgR, bgG, bgB),
    surface: rgbToHex(surfR, surfG, surfB),
    accent: rgbToHex(accent.r, accent.g, accent.b),
    text: '#F4F4F6',
  };
}
</script>

<template>
  <section class="settings-card">
    <div class="card-icon-box">
      <ImageIcon :size="24" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Ekstraktor Warna dari Gambar</h3>
        <p class="card-desc">
          Unggah wallpaper atau poster komik favoritmu. Algoritma Kura akan menganalisis spektrum warna dan menghasilkan tema kustom harmonis secara otomatis.
        </p>
      </div>

      <div class="extractor-container">
        <!-- Dropzone -->
        <div class="upload-dropzone" @click="triggerFileInput">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            class="hidden-file-input"
            @change="handleFileChange"
          />
          <div v-if="!extractedPreview" class="dropzone-empty">
            <ImageIcon :size="36" />
            <span class="dropzone-prompt">Klik untuk unggah gambar</span>
            <span class="dropzone-spec">PNG, JPG, WebP (Maks. 10MB)</span>
          </div>
          <div v-else class="dropzone-filled">
            <img :src="extractedPreview" alt="Uploaded Artwork" class="uploaded-thumb" />
            <div class="reupload-overlay">
              <span>Ganti Gambar</span>
            </div>
          </div>
        </div>

        <!-- Result Swatches -->
        <div class="extractor-result">
          <h4 class="result-title">Hasil Analisis Spektrum</h4>
          <div v-if="extractedPalette" class="spectrum-swatches">
            <div class="spec-item">
              <span class="spec-box" :style="{ background: extractedPalette.bg }"></span>
              <div class="spec-info">
                <span class="spec-label">Background</span>
                <span class="spec-hex">{{ extractedPalette.bg }}</span>
              </div>
            </div>
            <div class="spec-item">
              <span class="spec-box" :style="{ background: extractedPalette.surface }"></span>
              <div class="spec-info">
                <span class="spec-label">Surface</span>
                <span class="spec-hex">{{ extractedPalette.surface }}</span>
              </div>
            </div>
            <div class="spec-item">
              <span class="spec-box" :style="{ background: extractedPalette.accent }"></span>
              <div class="spec-info">
                <span class="spec-label">Accent</span>
                <span class="spec-hex">{{ extractedPalette.accent }}</span>
              </div>
            </div>
          </div>
          <div v-else class="spectrum-placeholder">
            Unggah gambar di samping untuk mengekstrak palet warna otomatis.
          </div>

          <button
            v-if="extractedPalette"
            type="button"
            class="apply-extracted-btn"
            @click="emit('apply-extracted', extractedPalette)"
          >
            <CheckCircle2 :size="16" />
            Terapkan Hasil Ekstraksi ke Tema Kustom
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden Canvas -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
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

.extractor-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .extractor-container {
    grid-template-columns: 180px 1fr;
  }
}

.upload-dropzone {
  border: 2px dashed var(--kura-border-subtle, rgba(255, 255, 255, 0.15));
  border-radius: 8px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.upload-dropzone:hover {
  border-color: var(--kura-accent, #e5a93c);
}

.hidden-file-input {
  display: none;
}

.dropzone-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--kura-text-muted, #94a3b8);
  text-align: center;
  padding: 12px;
}

.dropzone-prompt {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--kura-text-primary, #ffffff);
}

.dropzone-spec {
  font-size: 0.65rem;
}

.dropzone-filled {
  width: 100%;
  height: 100%;
  position: relative;
}

.uploaded-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reupload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.upload-dropzone:hover .reupload-overlay {
  opacity: 1;
}

.extractor-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.spectrum-swatches {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
}

.spec-box {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.spec-info {
  display: flex;
  flex-direction: column;
}

.spec-label {
  font-size: 0.65rem;
  color: var(--kura-text-muted, #94a3b8);
}

.spec-hex {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.spectrum-placeholder {
  font-size: 0.78rem;
  color: var(--kura-text-muted, #94a3b8);
  font-style: italic;
}

.apply-extracted-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  font-size: 0.78rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  width: fit-content;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.apply-extracted-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(229, 169, 60, 0.3);
}
</style>
