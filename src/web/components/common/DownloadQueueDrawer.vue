<script setup>
import { computed } from 'vue';
import { X, Download, CheckCircle2, AlertCircle, Pause, Play, Trash2, Film, BookOpen } from 'lucide-vue-next';
import { useDownloadQueue } from '../../services/download.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const { queue, activeCount, queuedCount, doneCount, hasActive, pause, resume, remove, clearDone } = useDownloadQueue();

function close() {
  emit('update:modelValue', false);
}

function formatSpeed(bps) {
  if (!bps) return '';
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} KB/s`;
  return `${bps} B/s`;
}

function formatEta(sec) {
  if (sec < 0 || !sec) return '';
  if (sec >= 3600) return `${Math.floor(sec / 3600)}j ${Math.floor((sec % 3600) / 60)}m`;
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${sec}s`;
}

function statusLabel(item) {
  if (item.status === 'queued') return 'Menunggu';
  if (item.status === 'downloading') return item.progress > 0 ? `${item.progress}%` : 'Menghubungkan...';
  if (item.status === 'paused') return 'Dijeda';
  if (item.status === 'done') return 'Selesai';
  if (item.status === 'error') return 'Error';
  return '';
}

const allDone = computed(() => queue.value.length > 0 && queue.value.every((i) => i.status === 'done' || i.status === 'error'));
</script>

<template>
  <transition name="drawer-fade">
    <div v-if="modelValue" class="queue-drawer-overlay" @click.self="close">
      <div class="queue-drawer">
        <!-- Header -->
        <header class="drawer-header">
          <div class="drawer-title-group">
            <Download :size="18" />
            <h3 class="drawer-title">Antrian Unduhan</h3>
            <div class="drawer-counts">
              <span v-if="activeCount > 0" class="count-pill active">{{ activeCount }} aktif</span>
              <span v-if="queuedCount > 0" class="count-pill queued">{{ queuedCount }} menunggu</span>
              <span v-if="doneCount > 0" class="count-pill done">{{ doneCount }} selesai</span>
            </div>
          </div>
          <div class="drawer-actions">
            <button
              v-if="doneCount > 0"
              type="button"
              class="ctrl-btn ghost"
              title="Bersihkan item selesai"
              @click="clearDone"
            >
              <Trash2 :size="14" />
              <span>Bersihkan</span>
            </button>
            <button type="button" class="ctrl-btn close-btn" @click="close">
              <X :size="16" />
            </button>
          </div>
        </header>

        <!-- Empty State -->
        <div v-if="queue.length === 0" class="drawer-empty">
          <Download :size="40" class="empty-icon" />
          <p>Belum ada unduhan dalam antrian</p>
          <span>Klik tombol "Unduh" pada video untuk memulai</span>
        </div>

        <!-- Queue Items -->
        <div v-else class="queue-list">
          <div
            v-for="item in queue"
            :key="item.id"
            class="queue-item"
            :class="[`status-${item.status}`]"
          >
            <!-- Type icon -->
            <div class="item-icon">
              <component
                :is="item.type === 'manga-chapter' ? BookOpen : Film"
                :size="16"
                class="type-icon"
              />
            </div>

            <!-- Info -->
            <div class="item-info">
              <div class="item-filename" :title="item.filename">{{ item.filename }}</div>

              <!-- Progress Bar -->
              <div v-if="item.status === 'downloading'" class="item-progress-wrap">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{ width: item.progress > 0 ? `${item.progress}%` : '0%' }"
                    :class="{ indeterminate: item.progress <= 0 }"
                  />
                </div>
                <div class="progress-meta">
                  <span class="progress-pct">{{ item.progress > 0 ? `${item.progress}%` : 'Menghubungkan...' }}</span>
                  <span v-if="item.speed > 0" class="progress-speed">{{ formatSpeed(item.speed) }}</span>
                  <span v-if="item.eta > 0" class="progress-eta">ETA {{ formatEta(item.eta) }}</span>
                </div>
              </div>

              <!-- Status label -->
              <div v-else class="item-status-label" :class="`label-${item.status}`">
                <component
                  :is="item.status === 'done' ? CheckCircle2 : item.status === 'error' ? AlertCircle : null"
                  v-if="item.status === 'done' || item.status === 'error'"
                  :size="12"
                />
                {{ statusLabel(item) }}
                <span v-if="item.status === 'error'" class="error-msg" :title="item.error">{{ item.error }}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="item-controls">
              <!-- Pause / Resume -->
              <button
                v-if="item.status === 'downloading'"
                type="button"
                class="item-btn"
                title="Jeda"
                @click="pause(item.id)"
              >
                <Pause :size="13" />
              </button>
              <button
                v-else-if="item.status === 'paused' || item.status === 'error'"
                type="button"
                class="item-btn"
                :title="item.status === 'error' ? 'Coba ulang' : 'Lanjutkan'"
                @click="resume(item.id)"
              >
                <Play :size="13" />
              </button>

              <!-- Remove -->
              <button
                type="button"
                class="item-btn remove-btn"
                title="Hapus dari antrian"
                @click="remove(item.id)"
              >
                <X :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.queue-drawer-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex; justify-content: flex-end; align-items: flex-start;
  padding: 60px 12px 12px;
}

.queue-drawer {
  width: min(420px, 100%);
  max-width: 100%;
  max-height: calc(100vh - 80px);
  background: #17181e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.8);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  gap: 10px;
  min-width: 0;
}
.drawer-title-group {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  color: var(--kura-text-primary, #fff);
}
.drawer-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 0.95rem; font-weight: 700; margin: 0;
}
.drawer-counts { display: flex; gap: 5px; }
.count-pill {
  font-size: 0.62rem; font-weight: 700;
  padding: 2px 6px; border-radius: 3px;
}
.count-pill.active { background: rgba(229,169,60,0.2); color: var(--kura-accent, #e5a93c); }
.count-pill.queued { background: rgba(99,102,241,0.2); color: #818cf8; }
.count-pill.done { background: rgba(52,211,153,0.15); color: #34d399; }

.drawer-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.ctrl-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--kura-text-secondary, #cbd5e1);
  font-size: 0.72rem; font-weight: 600; cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}
.ctrl-btn:hover { background: rgba(255,255,255,0.1); }
.ctrl-btn.ghost { background: transparent; border-color: transparent; color: var(--kura-text-muted, #94a3b8); }
.ctrl-btn.close-btn { padding: 5px 7px; }

@media (max-width: 480px) {
  .drawer-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .drawer-title-group {
    flex: 1 1 100%;
  }

  .drawer-actions {
    width: 100%;
  }
}

.drawer-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 48px 24px;
  color: var(--kura-text-muted, #94a3b8); text-align: center;
}
.empty-icon { opacity: 0.25; margin-bottom: 4px; }
.drawer-empty p { font-size: 0.9rem; font-weight: 600; margin: 0; color: var(--kura-text-secondary, #cbd5e1); }
.drawer-empty span { font-size: 0.76rem; }

.queue-list { overflow-y: auto; flex: 1; padding: 8px 0; }
.queue-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.15s ease;
}
.queue-item:hover { background: rgba(255,255,255,0.02); }
.queue-item.status-done { opacity: 0.7; }
.queue-item.status-error { background: rgba(248,113,113,0.04); }

.item-icon {
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}
.type-icon { color: var(--kura-text-muted, #94a3b8); }

.item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.item-filename {
  font-size: 0.76rem; font-weight: 600;
  color: var(--kura-text-primary, #fff);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.item-progress-wrap { display: flex; flex-direction: column; gap: 4px; }
.progress-track {
  height: 4px; border-radius: 2px;
  background: rgba(255,255,255,0.08); overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 2px;
  background: var(--kura-accent, #e5a93c);
  transition: width 0.3s ease;
}
.progress-fill.indeterminate {
  width: 40% !important;
  animation: indeterminate 1.5s ease-in-out infinite;
}
@keyframes indeterminate {
  0% { transform: translateX(-150%); }
  100% { transform: translateX(350%); }
}
.progress-meta {
  display: flex; gap: 10px;
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem; color: var(--kura-text-muted, #94a3b8);
}
.progress-pct { color: var(--kura-accent, #e5a93c); font-weight: 700; }

.item-status-label {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.7rem; color: var(--kura-text-muted, #94a3b8);
}
.label-done { color: #34d399; }
.label-error { color: #f87171; }
.label-paused { color: #818cf8; }
.error-msg {
  max-width: 160px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; opacity: 0.7;
}

.item-controls { display: flex; gap: 4px; flex-shrink: 0; margin-top: 2px; }
.item-btn {
  width: 26px; height: 26px; border-radius: 5px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--kura-text-muted, #94a3b8);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}
.item-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
.item-btn.remove-btn:hover { background: rgba(248,113,113,0.2); color: #f87171; }

/* Drawer animation */
.drawer-fade-enter-active { animation: drawerIn 0.22s ease; }
.drawer-fade-leave-active { animation: drawerIn 0.18s ease reverse; }
@keyframes drawerIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
