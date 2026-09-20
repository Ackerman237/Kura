<template>
  <nav class="kura-mobile-dock" aria-label="Navigasi Bawah">
    <div class="dock-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="dock-item"
        :class="{ active: currentTab === tab.id }"
        @click="$emit('navigate', tab.id)"
      >
        <div class="dock-icon-box">
          <component :is="tab.icon" :size="currentTab === tab.id ? 17 : 19" class="dock-icon" />
          <span v-if="tab.badge && tab.badge > 0" class="dock-badge">{{ tab.badge }}</span>
        </div>
        <span v-if="currentTab === tab.id" class="dock-label">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { BookOpen, Layers, Film, Bookmark, Settings } from 'lucide-vue-next';

const props = defineProps({
  currentTab: {
    type: String,
    default: 'manga',
  },
  offlineCount: {
    type: Number,
    default: 0,
  },
});

defineEmits(['navigate']);

const tabs = [
  { id: 'manga', label: 'Beranda', icon: BookOpen },
  { id: 'catalog', label: 'Katalog', icon: Layers },
  { id: 'video', label: 'Sinema', icon: Film },
  { id: 'library', label: 'Pustaka', icon: Bookmark },
  { id: 'settings', label: 'Setelan', icon: Settings },
];
</script>

<style scoped>
.kura-mobile-dock {
  position: fixed;
  bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 999;
  padding: 0 var(--space-3);
}

/* Ambient bottom fader: smoothly dims any content scrolling behind the dock */
.kura-mobile-dock::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(
    180deg,
    rgba(14, 15, 18, 0) 0%,
    rgba(14, 15, 18, 0.7) 45%,
    rgba(14, 15, 18, 0.96) 100%
  );
  pointer-events: none;
  z-index: -1;
}

.dock-container {
  pointer-events: auto;
  width: auto;
  min-width: 260px;
  max-width: 380px;
  height: 48px;
  background-color: var(--kura-dock-glass, rgba(20, 21, 26, 0.95));
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-pill);
  box-shadow: 0 12px 30px -2px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  gap: 4px;
}

.dock-item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  height: 38px;
  border-radius: var(--radius-pill);
  color: var(--kura-text-muted);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-spring);
  white-space: nowrap;
}

.dock-item:active {
  transform: scale(0.92);
}

.dock-item.active {
  color: var(--kura-accent);
  background-color: var(--kura-accent-muted, rgba(255, 107, 0, 0.15));
  border-color: var(--kura-accent-border, rgba(255, 107, 0, 0.35));
  box-shadow: 0 3px 12px var(--kura-accent-glow, rgba(255, 107, 0, 0.18));
  padding: 6px 15px;
}

.dock-icon-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dock-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: var(--kura-accent);
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  line-height: 1;
}

.dock-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  animation: fadeIn 0.18s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-3px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (orientation: landscape) and (max-height: 540px) {
  .kura-mobile-dock {
    display: none !important;
  }
}
</style>
