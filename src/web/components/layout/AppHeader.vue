<template>
  <header class="kura-topbar" :class="{ 'with-sidebar': !isMobile }">
    <div class="topbar-inner">
      <!-- Left: Mobile Brand & Desktop Nav Links -->
      <div class="header-brand-group">
        <div class="brand-item" @click="$emit('navigate', 'manga')">
          <div class="brand-kanji">蔵</div>
          <div class="brand-title-wrap">
            <span class="brand-name">KURA</span>
            <span class="brand-sub">READER</span>
          </div>
        </div>

        <!-- Navigation Links (Desktop) -->
        <nav v-if="!isMobile" class="header-nav-links">
          <button
            type="button"
            class="header-link"
            :class="{ active: currentTab === 'manga' }"
            @click="$emit('navigate', 'manga')"
          >
            Beranda
          </button>
          <button
            type="button"
            class="header-link"
            :class="{ active: currentTab === 'catalog' }"
            @click="$emit('navigate', 'catalog')"
          >
            Daftar
          </button>
          <button
            type="button"
            class="header-link"
            :class="{ active: currentTab === 'video' }"
            @click="$emit('navigate', 'video')"
          >
            Sinema
          </button>
          <button
            type="button"
            class="header-link"
            :class="{ active: currentTab === 'library' }"
            @click="$emit('navigate', 'library')"
          >
            Bookmark
          </button>
        </nav>
      </div>

      <!-- Center: Omnisearch Pill -->
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          ref="searchInputRef"
          type="text"
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          @keyup.enter="$emit('search')"
          placeholder="Cari komik, manhwa, genre (tekan Ctrl+K)..."
          aria-label="Pencarian Komik"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-btn"
          title="Hapus pencarian"
          @click="$emit('clear-search')"
        >
          <X :size="14" />
        </button>
        <span class="search-shortcut" v-else>Ctrl K</span>
      </div>

      <!-- Right Action Items -->
      <div class="topbar-actions">
        <!-- SFW / Privacy Mode Toggle -->
        <button
          type="button"
          class="action-pill"
          :class="{ 'is-active': isPrivacyMode }"
          :title="isPrivacyMode ? 'Mode Sensor SFW Aktif (Cover & Judul Buram)' : 'Aktifkan Mode Sensor SFW'"
          @click="$emit('toggle-privacy-mode')"
        >
          <component :is="isPrivacyMode ? EyeOff : Eye" :size="15" />
          <span class="action-label">{{ isPrivacyMode ? 'SFW AKTIF' : 'SFW' }}</span>
        </button>

        <!-- Theme Switcher Button -->
        <button
          type="button"
          class="icon-action-btn"
          :title="`Ganti Tema (Saat ini: ${currentTheme})`"
          @click="$emit('cycle-theme')"
        >
          <Palette :size="16" />
        </button>

        <!-- Download Queue Button -->
        <button
          type="button"
          class="icon-action-btn dl-queue-btn"
          :class="{ 'has-active': downloadBadge > 0 }"
          title="Antrian Unduhan"
          @click="$emit('toggle-download-queue')"
        >
          <Download :size="16" />
          <span v-if="downloadBadge > 0" class="dl-badge">{{ downloadBadge }}</span>
        </button>

        <!-- User Profile Avatar Placeholder -->
        <button
          type="button"
          class="user-avatar-btn"
          title="Profil Pengguna / Masuk"
          @click="$emit('navigate', 'settings')"
        >
          <User :size="16" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Search, X, Eye, EyeOff, Palette, User, Download } from 'lucide-vue-next';
import { useDownloadQueue } from '../../services/download.js';

const { activeCount, queuedCount } = useDownloadQueue();
const downloadBadge = computed(() => activeCount.value + queuedCount.value);

const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false,
  },
  currentTab: {
    type: String,
    default: 'manga',
  },
  searchQuery: {
    type: String,
    default: '',
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  hasActiveDownloads: {
    type: Boolean,
    default: false,
  },
  currentTheme: {
    type: String,
    default: 'default',
  },
});

const emit = defineEmits([
  'navigate',
  'update:searchQuery',
  'search',
  'clear-search',
  'toggle-privacy-mode',
  'cycle-theme',
]);

const searchInputRef = ref(null);

// Shortcut handler (Ctrl+K or Command+K)
function handleGlobalKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInputRef.value?.focus();
    searchInputRef.value?.select();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});
</script>

<style scoped>
.kura-topbar {
  height: var(--header-height);
  position: sticky;
  top: 0;
  background-color: var(--kura-surface-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--kura-border-subtle);
  z-index: 90;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  transition: background-color var(--duration-normal);
}

.topbar-inner {
  width: 100%;
  max-width: var(--max-content-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

/* Brand Group & Nav Links */
.header-brand-group {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
}

.brand-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.brand-kanji {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, var(--kura-accent) 0%, #d45431 100%);
  color: #ffffff;
  font-family: serif;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  box-shadow: 0 2px 8px var(--kura-accent-glow);
}

.brand-title-wrap {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-family: var(--kura-font-heading);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--kura-text-primary);
  line-height: 1;
}

.brand-sub {
  font-family: var(--kura-font-mono);
  font-size: 8px;
  letter-spacing: 0.2em;
  color: var(--kura-accent);
  font-weight: 700;
}

.header-nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-link {
  border: none;
  background: transparent;
  color: var(--kura-text-muted);
  font-family: var(--kura-font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.header-link:hover {
  color: var(--kura-text-primary);
  background: var(--kura-surface);
}

.header-link.active {
  color: var(--kura-accent);
  background: rgba(229, 169, 60, 0.12);
}

/* Omnisearch Box */
.search-box {
  flex: 1;
  max-width: 480px;
  height: 38px;
  background-color: var(--kura-bg);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  gap: var(--space-2);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}

.search-box:focus-within {
  border-color: var(--kura-accent);
  box-shadow: 0 0 0 2px var(--kura-accent-glow);
}

.search-icon {
  color: var(--kura-text-muted);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--kura-text-primary);
  font-family: var(--kura-font-sans);
  font-size: var(--text-sm);
}

.search-box input::placeholder {
  color: var(--kura-text-dim);
}

.clear-btn {
  border: none;
  background: transparent;
  color: var(--kura-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
  border-radius: var(--radius-pill);
  transition: color var(--duration-fast);
}

.clear-btn:hover {
  color: var(--kura-text-primary);
}

.search-shortcut {
  font-size: 10px;
  font-family: var(--kura-font-mono);
  color: var(--kura-text-dim);
  background-color: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  line-height: 1;
  user-select: none;
}

@media (max-width: 640px) {
  .search-shortcut {
    display: none;
  }
}

/* Actions */
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.action-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background-color: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-muted);
  font-family: var(--kura-font-sans);
  font-size: var(--text-2xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.action-pill:hover {
  border-color: var(--kura-border-strong);
  color: var(--kura-text-primary);
}

.action-pill.is-active {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
}

.icon-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-pill);
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  color: var(--kura-text-muted);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.icon-action-btn:hover {
  color: var(--kura-accent);
  border-color: var(--kura-border-strong);
  transform: translateY(-1px);
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--kura-surface) 0%, var(--kura-surface-hover) 100%);
  border: 1px solid var(--kura-border-strong);
  color: var(--kura-text-primary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.user-avatar-btn:hover {
  border-color: var(--kura-accent);
  box-shadow: 0 0 8px var(--kura-accent-glow);
}

.dl-queue-btn {
  position: relative;
}

.dl-queue-btn.has-active {
  color: var(--kura-accent);
  border-color: var(--kura-accent);
  background: rgba(230, 81, 0, 0.08);
}

.dl-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--kura-accent, #e65100);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0 6px var(--kura-accent-glow, rgba(230, 81, 0, 0.4));
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@media (max-width: 540px) {
  .brand-sub {
    display: none;
  }
  .action-label {
    display: none;
  }
  .action-pill {
    padding: 6px;
  }
}
</style>
