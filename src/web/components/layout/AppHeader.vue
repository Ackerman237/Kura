<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Eye, EyeOff, Palette, Download, User } from 'lucide-vue-next';
import { useDownloadQueue } from '../../services/download.js';
import SearchBar from '../common/SearchBar.vue';

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
  'toggle-download-queue',
]);

const searchBarRef = ref(null);
const { activeCount, queuedCount } = useDownloadQueue();

const downloadBadge = computed(() => {
  return (activeCount.value || 0) + (queuedCount.value || 0);
});

// Shortcut handler (Ctrl+K or Command+K)
function handleGlobalKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchBarRef.value?.focus();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});
</script>

<template>
  <header
    class="kura-topbar"
    :class="{ 'with-sidebar': !isMobile, 'topbar-mobile-2row': isMobile }"
  >
    <div class="topbar-inner">
      <!-- Top Row (or Desktop Full Row) -->
      <div class="topbar-row-top">
        <!-- Left: Brand & Desktop Nav Links -->
        <div class="header-brand-group">
          <div class="brand-item" @click="$emit('navigate', 'manga')">
            <div class="brand-kanji">蔵</div>
            <div class="brand-title-wrap">
              <span class="brand-name">KURA</span>
              <span v-if="!isMobile" class="brand-sub">READER</span>
            </div>
          </div>

          <!-- Navigation Links (Desktop Only) -->
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

        <!-- Desktop Omnisearch Pill (Hidden on Mobile) -->
        <div v-if="!isMobile" class="desktop-search-wrap">
          <SearchBar
            ref="searchBarRef"
            :model-value="searchQuery"
            @update:model-value="$emit('update:searchQuery', $event)"
            @search="$emit('search')"
            @clear="$emit('clear-search')"
          />
        </div>

        <!-- Right Action Items -->
        <div class="topbar-actions">
          <!-- SFW / Privacy Mode Toggle -->
          <button
            type="button"
            class="action-pill"
            :class="{ 'is-active': isPrivacyMode }"
            :title="isPrivacyMode ? 'Mode Sensor SFW Aktif' : 'Aktifkan Mode Sensor SFW'"
            @click="$emit('toggle-privacy-mode')"
          >
            <component :is="isPrivacyMode ? EyeOff : Eye" :size="15" />
            <span class="action-label">{{ isPrivacyMode ? 'SFW' : 'SFW' }}</span>
          </button>

          <!-- Theme Switcher Button -->
          <button
            type="button"
            class="icon-action-btn"
            :title="`Ganti Tema (${currentTheme})`"
            @click="$emit('cycle-theme')"
          >
            <Palette :size="16" />
          </button>

          <!-- Download Queue Button -->
          <button
            type="button"
            class="icon-action-btn dl-queue-btn"
            :class="{ 'has-active': downloadBadge > 0 }"
            title="Antrean Unduhan"
            @click="$emit('toggle-download-queue')"
          >
            <Download :size="16" />
            <span v-if="downloadBadge > 0" class="dl-badge">{{ downloadBadge }}</span>
          </button>

          <!-- Profile / About Navigation -->
          <button
            type="button"
            class="user-avatar-btn"
            title="Tentang Kura"
            @click="$emit('navigate', 'about')"
          >
            <User :size="16" />
          </button>
        </div>
      </div>

      <!-- Mobile Row 2: Full-Width SearchBar with explicit submit button -->
      <div v-if="isMobile" class="topbar-row-search">
        <SearchBar
          ref="searchBarRef"
          :model-value="searchQuery"
          :show-shortcut="false"
          placeholder="Cari komik, manhwa, sinema..."
          @update:model-value="$emit('update:searchQuery', $event)"
          @search="$emit('search')"
          @clear="$emit('clear-search')"
        />
      </div>
    </div>
  </header>
</template>

<style scoped>
.kura-topbar {
  position: sticky;
  top: 0;
  background-color: var(--kura-surface-glass, rgba(14, 15, 18, 0.85));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  z-index: 90;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: var(--header-height, 64px);
  transition: all 0.2s ease;
}

.topbar-inner {
  width: 100%;
  max-width: var(--max-content-width, 1400px);
  margin: 0 auto;
}

.topbar-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

/* Brand Group */
.header-brand-group {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
  min-width: 0;
}

.brand-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  min-width: 0;
  flex-shrink: 1;
}

.brand-title-wrap {
  min-width: 0;
  overflow: hidden;
}

.brand-kanji {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md, 8px);
  background: linear-gradient(135deg, var(--kura-accent, #e5a93c) 0%, #b87a1b 100%);
  color: #000000;
  font-family: var(--kura-font-serif, serif);
  font-size: 1.15rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 12px var(--kura-accent-glow, rgba(229, 169, 60, 0.3));
}

.brand-title-wrap {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand-name {
  font-family: var(--kura-font-sans, system-ui, sans-serif);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #ffffff;
}

.brand-sub {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--kura-accent, #e5a93c);
  margin-top: 2px;
}

/* Nav Links */
.header-nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-link {
  padding: 6px 12px;
  border-radius: var(--radius-pill, 9999px);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--kura-text-muted, #aaaaaa);
  transition: all 0.15s ease;
}

.header-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}

.header-link.active {
  color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.12);
}

/* Desktop Search */
.desktop-search-wrap {
  flex: 1;
  max-width: 440px;
}

/* Actions Group */
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  max-width: 100%;
  justify-content: flex-end;
}

.action-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-pill, 9999px);
  background-color: var(--kura-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-muted, #aaaaaa);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.15s ease;
  max-width: 100%;
}

.action-pill:hover {
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
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
  border-radius: var(--radius-pill, 9999px);
  background: var(--kura-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--kura-text-muted, #aaaaaa);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-action-btn:hover {
  color: var(--kura-accent, #e5a93c);
  border-color: var(--kura-border-strong, rgba(255, 255, 255, 0.25));
  transform: translateY(-1px);
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--kura-border-strong, rgba(255, 255, 255, 0.15));
  color: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.user-avatar-btn:hover {
  border-color: var(--kura-accent, #e5a93c);
  box-shadow: 0 0 8px var(--kura-accent-glow, rgba(229, 169, 60, 0.3));
}

.dl-queue-btn {
  position: relative;
}

.dl-queue-btn.has-active {
  color: var(--kura-accent, #e5a93c);
  border-color: var(--kura-accent, #e5a93c);
}

.dl-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--kura-accent, #e5a93c);
  color: #000000;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  animation: pulse-badge 2s infinite;
}

/* Mobile 2-Row Styling */
@media (max-width: 768px) {
  .kura-topbar.topbar-mobile-2row {
    height: auto !important;
    padding: 8px 12px 10px !important;
  }

  .topbar-inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .topbar-row-top {
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  .topbar-row-search {
    width: 100%;
    min-width: 0;
  }

  .action-label {
    display: none;
  }

  .action-pill {
    padding: 0 10px;
    min-height: 44px;
    min-width: 44px;
    justify-content: center;
  }

  /* Ensure icon buttons meet 44px touch target */
  .icon-action-btn,
  .user-avatar-btn {
    width: 44px !important;
    height: 44px !important;
  }

  /* Brand group: tighter on narrow */
  .header-brand-group {
    flex-shrink: 1;
    min-width: 0;
  }

  /* Actions: don't shrink below touch minimum */
  .topbar-actions {
    flex-shrink: 0;
    gap: 4px;
    min-width: 0;
  }
}

@media (max-width: 430px) {
  .brand-title-wrap {
    max-width: 72px;
  }

  .brand-name {
    letter-spacing: 0.04em;
  }

  .topbar-actions {
    gap: 2px;
  }

  .action-pill {
    padding-inline: 8px;
  }
}

/* 320px–359px extreme narrow */
@media (max-width: 359px) {
  .kura-topbar.topbar-mobile-2row {
    padding: 6px 8px 8px !important;
  }

  .brand-kanji {
    width: 28px !important;
    height: 28px !important;
    font-size: 0.95rem !important;
  }

  .topbar-actions {
    gap: 2px;
  }

  .brand-title-wrap {
    max-width: 60px;
  }

  .icon-action-btn,
  .user-avatar-btn {
    width: 40px !important;
    height: 40px !important;
  }
}

</style>
