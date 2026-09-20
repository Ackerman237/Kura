<template>
  <aside
    class="kura-sidebar"
    :class="{ collapsed: isCollapsed }"
    aria-label="Navigasi Utama"
  >
    <!-- Brand Header -->
    <div class="sidebar-header">
      <div class="brand-badge" @click="$emit('navigate', 'manga')">
        <div class="brand-kanji">蔵</div>
        <div v-if="!isCollapsed" class="brand-text">
          <span class="brand-name">KURA</span>
          <span class="brand-sub">READER</span>
        </div>
      </div>
      <button
        class="toggle-btn"
        :title="isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'"
        @click="toggleCollapse"
      >
        <component :is="isCollapsed ? ChevronRight : ChevronLeft" :size="18" />
      </button>
    </div>

    <!-- Main Navigation Items -->
    <nav class="sidebar-nav">
      <div class="nav-section-label" v-if="!isCollapsed">MENU UTAMA</div>
      
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: currentTab === item.id }"
        :title="isCollapsed ? item.label : undefined"
        @click="$emit('navigate', item.id)"
      >
        <div class="nav-icon-wrap">
          <component :is="item.icon" :size="20" class="nav-icon" />
          <span v-if="item.badge" class="nav-counter">{{ item.badge }}</span>
        </div>
        <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
        <div v-if="currentTab === item.id" class="active-indicator"></div>
      </button>
    </nav>

    <!-- Dev Mode Masking Status Box -->
    <div class="sidebar-footer">
      <div
        class="dev-mask-toggle"
        :class="{ active: isDevMode }"
        @click="$emit('toggle-dev-mode')"
        :title="isDevMode ? 'Sensor Gambar Aktif (Placeholder SVG)' : 'Klik untuk mengaktifkan Sensor Gambar'"
      >
        <component :is="isDevMode ? ShieldCheck : ShieldAlert" :size="18" class="shield-icon" />
        <div v-if="!isCollapsed" class="mask-info">
          <span class="mask-title">{{ isDevMode ? 'Sensor Aktif' : 'Sensor Mati' }}</span>
          <span class="mask-hint">{{ isDevMode ? 'Mode Dev (SVG)' : 'Gambar Asli' }}</span>
        </div>
      </div>

      <!-- Theme Selector (if expanded) -->
      <div v-if="!isCollapsed" class="theme-quick-bar">
        <button
          class="theme-dot default"
          :class="{ active: currentTheme === 'default' }"
          title="Sumi Charcoal"
          @click="$emit('set-theme', 'default')"
        ></button>
        <button
          class="theme-dot cinema"
          :class="{ active: currentTheme === 'cinema' }"
          title="Cinema Amber"
          @click="$emit('set-theme', 'cinema')"
        ></button>
        <button
          class="theme-dot yoru"
          :class="{ active: currentTheme === 'yoru' }"
          title="Yoru Midnight Jade"
          @click="$emit('set-theme', 'yoru')"
        ></button>
        <button
          class="theme-dot amoled"
          :class="{ active: currentTheme === 'amoled' }"
          title="AMOLED True Black"
          @click="$emit('set-theme', 'amoled')"
        ></button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import {
  BookOpen,
  Layers,
  Film,
  Bookmark,
  ArrowDownCircle,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-vue-next';

const props = defineProps({
  currentTab: {
    type: String,
    default: 'manga',
  },
  currentTheme: {
    type: String,
    default: 'default',
  },
  isDevMode: {
    type: Boolean,
    default: false,
  },
  offlineCount: {
    type: Number,
    default: 0,
  },
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['navigate', 'set-theme', 'toggle-dev-mode', 'toggle-collapse']);

function toggleCollapse() {
  emit('toggle-collapse');
}

const navItems = [
  { id: 'manga', label: 'Beranda Komik', icon: BookOpen },
  { id: 'catalog', label: 'Katalog Komik', icon: Layers },
  { id: 'video', label: 'Sinema Video', icon: Film },
  { id: 'library', label: 'Pustaka Saya', icon: Bookmark },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
  { id: 'about', label: 'Tentang Kura', icon: Info },
];
</script>

<style scoped>
.kura-sidebar {
  width: var(--sidebar-width-expanded);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: var(--kura-surface);
  border-right: 1px solid var(--kura-border-subtle);
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  transition: width var(--duration-normal) var(--ease-spring);
  z-index: 100;
  user-select: none;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.kura-sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
  padding: var(--space-3) var(--space-2);
}

/* Header & Brand */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  padding: var(--space-1) var(--space-2);
  min-height: 40px;
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

.brand-kanji {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--kura-accent) 0%, #D45431 100%);
  color: #FFFFFF;
  font-family: serif;
  font-weight: 700;
  font-size: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 10px var(--kura-accent-glow);
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-name {
  font-size: var(--text-md);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--kura-text-primary);
}

.brand-sub {
  font-size: var(--text-2xs);
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--kura-accent);
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kura-text-muted);
  transition: background-color var(--duration-fast), color var(--duration-fast);
}

.toggle-btn:hover {
  background-color: var(--kura-surface-hover);
  color: var(--kura-text-primary);
}

.collapsed .sidebar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding: 0;
}

.collapsed .toggle-btn {
  position: static;
  margin-top: 6px;
  background: var(--kura-surface-hover);
  border: 1px solid var(--kura-border-subtle);
  box-shadow: var(--shadow-sm);
}

/* Navigation Section */
.nav-section-label {
  font-size: var(--text-2xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--kura-text-dim);
  padding: 0 var(--space-3);
  margin-bottom: var(--space-2);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  height: 44px;
  border-radius: var(--radius-md);
  color: var(--kura-text-muted);
  position: relative;
  transition: background-color var(--duration-fast), color var(--duration-fast), transform var(--duration-fast);
}

.collapsed .nav-item {
  justify-content: center;
  padding: var(--space-2);
}

.nav-item:hover {
  background-color: var(--kura-surface-hover);
  color: var(--kura-text-primary);
}

.nav-item.active {
  background-color: var(--kura-accent-glow);
  color: var(--kura-accent);
  font-weight: 600;
}

.nav-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: var(--text-sm);
  white-space: nowrap;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background-color: var(--kura-accent);
  border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
}

/* Footer & Dev-Mode Shield */
.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--kura-border-subtle);
}

.dev-mask-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--kura-surface-hover);
  border: 1px solid var(--kura-border-subtle);
  cursor: pointer;
  transition: border-color var(--duration-fast), background-color var(--duration-fast);
}

.dev-mask-toggle.active {
  border-color: var(--kura-warning);
  background-color: rgba(245, 158, 11, 0.12);
}

.shield-icon {
  color: var(--kura-text-muted);
}

.dev-mask-toggle.active .shield-icon {
  color: var(--kura-warning);
}

.mask-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.mask-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--kura-text-primary);
}

.dev-mask-toggle.active .mask-title {
  color: var(--kura-warning);
}

.mask-hint {
  font-size: var(--text-2xs);
  color: var(--kura-text-dim);
}

/* Theme Selector */
.theme-quick-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--space-1);
}

.theme-dot {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-pill);
  border: 2px solid transparent;
  transition: transform var(--duration-fast), border-color var(--duration-fast);
}

.theme-dot.default { background-color: #17181C; }
.theme-dot.cinema { background-color: #F59E0B; }
.theme-dot.yoru { background-color: #10B981; }
.theme-dot.amoled { background-color: #000000; border: 1px solid rgba(255, 255, 255, 0.2); }

.theme-dot:hover {
  transform: scale(1.15);
}

.theme-dot.active {
  border-color: var(--kura-text-primary);
  transform: scale(1.2);
}
</style>
