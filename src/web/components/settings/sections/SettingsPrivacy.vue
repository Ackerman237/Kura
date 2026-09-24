<script setup>
import { Eye, EyeOff } from 'lucide-vue-next';

const props = defineProps({
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  peekDuration: {
    type: Number,
    default: 2000,
  },
  blurIntensity: {
    type: String,
    default: '12px',
  },
});

const emit = defineEmits(['toggle-privacy', 'set-peek-duration', 'set-blur-intensity']);
</script>

<template>
  <div class="settings-section-container">
    <!-- Highlight Card: SFW Mode Toggle -->
    <section class="settings-card highlight-card">
      <div class="card-icon-box warn">
        <component :is="isPrivacyMode ? EyeOff : Eye" :size="24" />
      </div>
      <div class="card-content">
        <div class="card-text">
          <div class="card-title-row">
            <h3 class="card-title">Mode Sensor SFW & Privasi Publik</h3>
            <span class="status-badge" :class="{ active: isPrivacyMode }">
              {{ isPrivacyMode ? 'AKTIF' : 'NONAKTIF' }}
            </span>
          </div>
          <p class="card-desc">
            Menyamarkan sampul manga dan thumbnail video secara terisolasi tanpa efek silau yang bocor. Ketuk/klik gambar untuk mengintip konten sementara selama durasi tertentu.
          </p>
        </div>
        <div class="controls-group">
          <label class="switch-control">
            <input
              type="checkbox"
              :checked="isPrivacyMode"
              @change="emit('toggle-privacy')"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </section>

    <!-- Adjustment Settings Card -->
    <section class="settings-card">
      <div class="card-icon-box">
        <EyeOff :size="24" />
      </div>
      <div class="card-content">
        <div class="card-text">
          <h3 class="card-title">Penyesuaian Sensor SFW</h3>
          <p class="card-desc">Atur kekuatan blur dan durasi intip ketika gambar disentuh pada mode sensor.</p>
        </div>

        <div class="settings-subgrid">
          <!-- Durasi Intip Gambar -->
          <div class="setting-item">
            <label class="setting-item-label">Durasi Intip Gambar (Peek Duration)</label>
            <div class="chip-options">
              <button
                v-for="dur in [1000, 2000, 3000, 5000]"
                :key="dur"
                type="button"
                class="chip-btn"
                :class="{ active: peekDuration === dur }"
                @click="emit('set-peek-duration', dur)"
              >
                {{ dur / 1000 }} Detik {{ dur === 2000 ? '(Bawaan)' : '' }}
              </button>
            </div>
            <span class="setting-hint">Waktu gambar terbuka sebelum otomatis kabur kembali saat disentuh.</span>
          </div>

          <!-- Kekuatan Blur -->
          <div class="setting-item">
            <label class="setting-item-label">Kekuatan Sensor Blur</label>
            <div class="chip-options">
              <button
                v-for="b in ['6px', '12px', '20px']"
                :key="b"
                type="button"
                class="chip-btn"
                :class="{ active: blurIntensity === b }"
                @click="emit('set-blur-intensity', b)"
              >
                {{ b === '6px' ? 'Ringan (6px)' : b === '12px' ? 'Standar (12px)' : 'Pekat (20px)' }}
              </button>
            </div>
            <span class="setting-hint">Tingkat kekaburan gaussian yang diterapkan pada sampul.</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-section-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-card {
  display: flex;
  gap: 20px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  padding: 24px;
}

.highlight-card {
  border-color: rgba(229, 169, 60, 0.3);
  background: linear-gradient(135deg, rgba(229, 169, 60, 0.05) 0%, rgba(20, 21, 26, 0.95) 100%);
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

.card-icon-box.warn {
  background: rgba(229, 169, 60, 0.15);
  color: var(--kura-accent, #e5a93c);
}

.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.status-badge {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--kura-text-muted, #94a3b8);
}

.status-badge.active {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.card-desc {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--kura-text-muted, #94a3b8);
  margin: 6px 0 0;
}

.switch-control {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch-control input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.15);
  transition: 0.2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--kura-accent, #e5a93c);
}

input:checked + .slider:before {
  transform: translateX(20px);
  background-color: #000;
}

.settings-subgrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .settings-subgrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--kura-text-primary, #ffffff);
}

.chip-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  padding: 6px 12px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-secondary, #cbd5e1);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}

.chip-btn:hover {
  border-color: #ffffff;
}

.chip-btn.active {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  border-color: var(--kura-accent, #e5a93c);
}

.setting-hint {
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}
</style>
