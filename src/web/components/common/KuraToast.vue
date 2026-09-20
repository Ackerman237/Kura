<script setup>
import { useToast } from '../../composables/useToast.js';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next';

const { toasts, dismiss } = useToast();

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return Info;
  }
};
</script>

<template>
  <div class="kura-toast-container" aria-live="polite">
    <transition-group name="toast-slide">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="kura-toast-item"
        :class="[`toast-${t.type}`]"
        role="alert"
      >
        <div class="toast-icon-wrap">
          <component :is="getIcon(t.type)" :size="18" />
        </div>
        <div class="toast-content">
          <div v-if="t.title" class="toast-title">{{ t.title }}</div>
          <div class="toast-message">{{ t.message }}</div>
        </div>
        <button
          type="button"
          class="toast-close-btn"
          aria-label="Tutup notifikasi"
          @click="dismiss(t.id)"
        >
          <X :size="14" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.kura-toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 400px;
  width: calc(100% - 48px);
}

.kura-toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md, 10px);
  background: rgba(18, 20, 26, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2);
  color: var(--kura-text-primary, #ffffff);
  font-family: var(--kura-font-sans, system-ui, sans-serif);
  font-size: 0.85rem;
}

.toast-icon-wrap {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  margin-bottom: 2px;
}

.toast-message {
  color: var(--kura-text-secondary, #cccccc);
  line-height: 1.4;
  word-break: break-word;
}

.toast-close-btn {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--kura-text-muted, #888888);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}

.toast-close-btn:hover {
  color: #ffffff;
}

/* Status variants with subtle glow border */
.toast-success {
  border-color: rgba(34, 197, 94, 0.35);
}
.toast-success .toast-icon-wrap,
.toast-success .toast-title {
  color: #4ade80;
}

.toast-error {
  border-color: rgba(239, 68, 68, 0.4);
}
.toast-error .toast-icon-wrap,
.toast-error .toast-title {
  color: #f87171;
}

.toast-warning {
  border-color: rgba(234, 179, 8, 0.35);
}
.toast-warning .toast-icon-wrap,
.toast-warning .toast-title {
  color: #facc15;
}

.toast-info {
  border-color: rgba(56, 189, 248, 0.35);
}
.toast-info .toast-icon-wrap,
.toast-info .toast-title {
  color: #38bdf8;
}

/* Animations */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 600px) {
  .kura-toast-container {
    bottom: 76px; /* above mobile dock */
    right: 16px;
    left: 16px;
    width: auto;
  }
}
</style>
