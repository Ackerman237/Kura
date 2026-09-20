<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import DesktopSidebar from './components/layout/DesktopSidebar.vue';
import MobileDock from './components/layout/MobileDock.vue';
import AppHeader from './components/layout/AppHeader.vue';
import MangaReader from './components/reader/MangaReader.vue';
import VideoCard from './components/common/VideoCard.vue';
import LibraryView from './components/library/LibraryView.vue';
import SettingsView from './components/settings/SettingsView.vue';
import HomeView from './views/HomeView.vue';
import MangaCatalogView from './views/MangaCatalogView.vue';
import MangaDetailView from './views/MangaDetailView.vue';
import VideoWatchView from './views/VideoWatchView.vue';
import CinemaHomeView from './views/CinemaHomeView.vue';
import AboutView from './views/AboutView.vue';
import DownloadQueueDrawer from './components/common/DownloadQueueDrawer.vue';
import KuraToast from './components/common/KuraToast.vue';
import { useToast } from './composables/useToast.js';
import {
  fetchMangaList,
  fetchMangaDetail,
  fetchChapterImages,
  fetchNekoList,
  fetchNekoDetail,
  fetchHtvList,
  fetchHtvDetail,
  fetchTubeList,
  fetchTubeDetail,
  isDevModeActive,
  setDevModeActive,
} from './services/api.js';
import { getAllOfflineChapters, getOfflineChapter, clearOfflineStorage } from './services/offline.js';
import { useDownloadQueue } from './services/download.js';
import {
  ChevronLeft,
  ChevronRight,
  Tv,
} from 'lucide-vue-next';

// Responsive Breakpoint (768px threshold)
const isDesktop = useMediaQuery('(min-width: 768px)');

// Navigation Screen Architecture (Kura Dedicated Screen Pattern)
// 'manga-home' | 'manga-detail' | 'manga-reader' | 'video-home' | 'video-watch' | 'library' | 'settings'
const activeScreen = ref('manga-home');
const currentTab = ref('manga'); // 'manga' | 'video' | 'library' | 'settings'
const currentTheme = ref('default'); // 'default' | 'cinema' | 'yoru' | 'amoled'
const isDevMode = ref(false);
const isPrivacyMode = ref(false);
const isSidebarCollapsed = ref(false);
const showDownloadQueue = ref(false);
const searchQuery = ref('');
let searchDebounceTimer = null;

// Bookmarks State
const bookmarkedComics = ref([]);
const bookmarkedIds = computed(() => bookmarkedComics.value.map((c) => c.id || c.slug));

const toggleBookmark = (comic) => {
  const id = comic.id || comic.slug;
  const idx = bookmarkedComics.value.findIndex((c) => (c.id || c.slug) === id);
  if (idx >= 0) {
    bookmarkedComics.value.splice(idx, 1);
  } else {
    bookmarkedComics.value.push(comic);
  }
  try {
    localStorage.setItem('kura_bookmarks', JSON.stringify(bookmarkedComics.value));
  } catch (e) {}
};

const cycleTheme = () => {
  const themes = ['default', 'cinema', 'yoru', 'amoled'];
  const currentIndex = themes.indexOf(currentTheme.value);
  const nextIndex = (currentIndex + 1) % themes.length;
  applyTheme(themes[nextIndex]);
};

// Offline storage stats
const offlineChapters = ref([]);
const offlineCount = computed(() => offlineChapters.value.length);

// Manga Catalog State
const mangaTypeFilter = ref('all');
const mangaList = ref([]);
const mangaPage = ref(1);
const mangaLoading = ref(false);
const mangaError = ref(null);

// Cinema Video Catalog State
const videoProvider = ref('htv'); // 'neko' | 'htv' | 'tube'
const videoList = ref([]);
const videoPage = ref(1);
const videoLoading = ref(false);
const videoError = ref(null);

// Active Dedicated Screen Data
const selectedManga = ref(null);
const detailLoading = ref(false);
const activeReading = ref(null);
const readerChapterLoading = ref(false);

const selectedVideo = ref(null);
const videoDetailData = ref(null);
const videoDetailLoading = ref(false);

// ---------------------------------------------------------------------------
// Browser History & Screen Navigation Helper
// ---------------------------------------------------------------------------
function navigateHistory(screen, payload = {}) {
  try {
    const url = new URL(window.location.href);
    if (screen === 'manga-home') {
      url.searchParams.set('tab', 'manga');
      url.searchParams.delete('view');
      url.searchParams.delete('slug');
      url.searchParams.delete('chapter');
    } else if (screen === 'manga-detail') {
      url.searchParams.set('tab', 'manga');
      url.searchParams.set('view', 'manga-detail');
      if (payload.slug) url.searchParams.set('slug', payload.slug);
      url.searchParams.delete('chapter');
    } else if (screen === 'manga-reader') {
      url.searchParams.set('tab', 'manga');
      url.searchParams.set('view', 'reader');
      if (payload.mangaSlug) url.searchParams.set('slug', payload.mangaSlug);
      if (payload.chapterId) url.searchParams.set('chapter', payload.chapterId);
      url.searchParams.delete('provider');
    } else if (screen === 'video-home') {
      url.searchParams.set('tab', 'video');
      url.searchParams.delete('view');
      url.searchParams.delete('slug');
      url.searchParams.delete('chapter');
      if (payload.provider) url.searchParams.set('provider', payload.provider);
    } else if (screen === 'video-watch') {
      url.searchParams.set('tab', 'video');
      url.searchParams.set('view', 'video-watch');
      if (payload.slug) url.searchParams.set('slug', payload.slug);
      if (payload.provider) url.searchParams.set('provider', payload.provider);
      url.searchParams.delete('chapter');
    } else if (screen === 'library') {
      url.searchParams.set('tab', 'library');
      url.searchParams.delete('view');
      url.searchParams.delete('slug');
      url.searchParams.delete('chapter');
      url.searchParams.delete('provider');
    } else if (screen === 'settings') {
      url.searchParams.set('tab', 'settings');
      url.searchParams.delete('view');
      url.searchParams.delete('slug');
      url.searchParams.delete('chapter');
      url.searchParams.delete('provider');
    } else if (screen === 'about') {
      url.searchParams.set('tab', 'about');
      url.searchParams.delete('view');
      url.searchParams.delete('slug');
      url.searchParams.delete('chapter');
      url.searchParams.delete('provider');
    }
    history.pushState({ screen, ...payload }, '', url.toString());
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// 1. Data Fetching: Manga
// ---------------------------------------------------------------------------
const loadManga = async (page = 1) => {
  mangaLoading.value = true;
  mangaError.value = null;
  mangaPage.value = page;

  try {
    const data = await fetchMangaList({
      page,
      type: mangaTypeFilter.value === 'all' ? undefined : mangaTypeFilter.value,
      q: searchQuery.value.trim() || undefined,
    });
    const items = data.items || data.results || data.data || data.mangaList || (Array.isArray(data) ? data : []);
    mangaList.value = items;
  } catch (err) {
    mangaError.value = err.message || 'Gagal memuat katalog komik.';
  } finally {
    mangaLoading.value = false;
  }
};

// ---------------------------------------------------------------------------
// 2. Data Fetching: Cinema Videos
// ---------------------------------------------------------------------------
const loadVideos = async (page = 1) => {
  videoLoading.value = true;
  videoError.value = null;
  videoPage.value = page;

  try {
    let data;
    const q = searchQuery.value.trim();
    if (videoProvider.value === 'neko') {
      data = await fetchNekoList(page);
    } else if (videoProvider.value === 'htv') {
      data = await fetchHtvList({ page, q: q || undefined });
    } else if (videoProvider.value === 'tube') {
      data = await fetchTubeList({ page, q: q || undefined });
    }
    const items = data.results || data.videos || data.data || (Array.isArray(data) ? data : []);
    videoList.value = items;
  } catch (err) {
    videoError.value = err.message || 'Gagal memuat katalog video.';
  } finally {
    videoLoading.value = false;
  }
};

// ---------------------------------------------------------------------------
// 3. User Interactions & Navigation
// ---------------------------------------------------------------------------
const handleNavigate = (tab) => {
  currentTab.value = tab;
  if (tab === 'manga') {
    activeScreen.value = 'manga-home';
    selectedManga.value = null;
    activeReading.value = null;
    navigateHistory('manga-home');
  } else if (tab === 'catalog' || tab === 'manga-catalog') {
    currentTab.value = 'catalog';
    activeScreen.value = 'manga-catalog';
    selectedManga.value = null;
    activeReading.value = null;
    navigateHistory('manga-catalog');
  } else if (tab === 'video') {
    activeScreen.value = 'video-home';
    selectedVideo.value = null;
    if (!videoList.value.length) loadVideos(1);
    navigateHistory('video-home');
  } else if (tab === 'library') {
    activeScreen.value = 'library';
    navigateHistory('library');
  } else if (tab === 'settings') {
    activeScreen.value = 'settings';
    navigateHistory('settings');
  } else if (tab === 'about') {
    activeScreen.value = 'about';
    navigateHistory('about');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSearch = () => {
  if (currentTab.value === 'manga') {
    if (activeScreen.value !== 'manga-home') {
      activeScreen.value = 'manga-home';
    }
    loadManga(1);
  } else if (currentTab.value === 'video') {
    if (activeScreen.value !== 'video-home') {
      activeScreen.value = 'video-home';
    }
    loadVideos(1);
  }
};

const handleClearSearch = () => {
  searchQuery.value = '';
  handleSearch();
};

watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    handleSearch();
  }, 450);
});

// Theming & Custom Engine
const applyCustomThemeStyles = () => {
  try {
    const savedCustom = localStorage.getItem('kura_custom_theme');
    if (savedCustom) {
      const c = JSON.parse(savedCustom);
      if (c.bg) document.documentElement.style.setProperty('--custom-bg', c.bg);
      if (c.surface) document.documentElement.style.setProperty('--custom-surface', c.surface);
      if (c.accent) document.documentElement.style.setProperty('--custom-accent', c.accent);
      if (c.text) document.documentElement.style.setProperty('--custom-text', c.text);
    }
  } catch (e) {}
};

const applyTheme = (theme) => {
  currentTheme.value = theme;
  localStorage.setItem('kura_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  if (theme === 'custom') {
    applyCustomThemeStyles();
  } else {
    document.documentElement.style.removeProperty('--custom-bg');
    document.documentElement.style.removeProperty('--custom-surface');
    document.documentElement.style.removeProperty('--custom-accent');
    document.documentElement.style.removeProperty('--custom-text');
  }
};

// Dev Mode Masking Toggle
const toggleDevMode = () => {
  const nextVal = !isDevMode.value;
  isDevMode.value = nextVal;
  setDevModeActive(nextVal);
  if (currentTab.value === 'manga') {
    loadManga(mangaPage.value);
  } else if (currentTab.value === 'video') {
    loadVideos(videoPage.value);
  }
};

// ---------------------------------------------------------------------------
// 4. Dedicated Manga Detail & Reader Screen Actions
// ---------------------------------------------------------------------------
const openMangaDetail = async (comic) => {
  const slug = comic.slug || comic.id;
  const coverUrl = comic.thumb || comic.cover || comic.cover_url || comic.image;
  
  selectedManga.value = {
    ...comic,
    slug,
    title: comic.title,
    altTitle: comic.altTitle || comic.native_title,
    thumb: coverUrl,
    cover: coverUrl,
    synopsis: comic.synopsis || '',
    author: comic.author,
    artist: comic.artist,
    status: comic.status,
    rating: comic.rating || 9.2,
    genres: comic.genres || [],
    type: comic.type || 'manga',
    chapters: comic.chapters || comic.chapterList || Array.from({ length: 25 }, (_, i) => ({
      id: `${slug}-ch-${25 - i}`,
      slug: `${slug}-ch-${25 - i}`,
      chapterNumber: `${25 - i}`,
      title: `Chapter ${25 - i}: Kemampuan Tersembunyi`,
      releaseDate: `${i * 2 + 1} hari lalu`,
    })),
  };

  activeScreen.value = 'manga-detail';
  navigateHistory('manga-detail', { slug });

  detailLoading.value = true;
  try {
    if (slug && !slug.startsWith('kura-')) {
      const detail = await fetchMangaDetail(slug);
      selectedManga.value = { ...selectedManga.value, ...detail };
    }
  } catch (err) {
    console.error('Failed to fetch full manga detail:', err);
  } finally {
    detailLoading.value = false;
  }
};

const closeMangaDetail = () => {
  activeScreen.value = 'manga-home';
  selectedManga.value = null;
  navigateHistory('manga-home');
};

const toast = useToast();

const openChapterReader = async ({ chapter, manga }) => {
  readerChapterLoading.value = true;
  const chapterId = chapter.id || chapter.slug || chapter.chapterId || '';
  const mSlug = manga?.slug || manga?.id || chapter.mangaSlug || '';

  try {
    let images = [];

    // 1. Prioritize offline chapter if saved in IndexedDB
    try {
      const offline = await getOfflineChapter(chapterId);
      if (offline && Array.isArray(offline.images) && offline.images.length) {
        images = offline.images;
      }
    } catch (_) {}

    // 2. Fetch from upstream API if not available offline
    if (!images.length && typeof chapterId === 'string' && chapterId && !chapterId.startsWith('kura-')) {
      const data = await fetchChapterImages(chapterId);
      if (data.images && Array.isArray(data.images)) {
        images = data.images.map((img) => (typeof img === 'string' ? img : img.url || img.thumb));
      } else if (data.pages && Array.isArray(data.pages)) {
        images = data.pages.map((img) => (typeof img === 'string' ? img : img.url || img.thumb));
      } else if (Array.isArray(data)) {
        images = data.map((img) => (typeof img === 'string' ? img : img.url || img.thumb));
      }
    }

    if (!images.length) {
      // High-resolution authentic demo manga pages fallback
      images = [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=85',
      ];
    }

    const mangaCover =
      manga?.thumb ||
      manga?.cover ||
      manga?.image ||
      chapter.thumb ||
      selectedManga.value?.thumb ||
      selectedManga.value?.cover ||
      (mangaList.value.find((m) => (m.slug || m.id) === mSlug)?.thumb) ||
      '';
    activeReading.value = {
      mangaSlug: mSlug,
      title: manga?.title || chapter.mangaTitle || chapter.title || 'Manga',
      thumb: mangaCover,
      cover: mangaCover,
      chapterId,
      chapterNumber: chapter.chapterNumber || chapter.number || chapter.chapterTitle || chapter.title || '1',
      images,
    };
    activeScreen.value = 'manga-reader';
    navigateHistory('manga-reader', { mangaSlug: mSlug, chapterId });
  } catch (err) {
    console.error('Failed to open chapter:', err);
    toast.error(`Gagal memuat chapter: ${err.message}`);
  } finally {
    readerChapterLoading.value = false;
  }
};

const handleNextChapter = () => {
  if (!selectedManga.value || !activeReading.value) return;
  const chapters = selectedManga.value.chapters || selectedManga.value.chapterList || [];
  const currentIdx = chapters.findIndex((c) => (c.id || c.slug) === activeReading.value.chapterId);
  if (currentIdx > 0) {
    openChapterReader({ chapter: chapters[currentIdx - 1], manga: selectedManga.value });
  }
};

const handlePrevChapter = () => {
  if (!selectedManga.value || !activeReading.value) return;
  const chapters = selectedManga.value.chapters || selectedManga.value.chapterList || [];
  const currentIdx = chapters.findIndex((c) => (c.id || c.slug) === activeReading.value.chapterId);
  if (currentIdx >= 0 && currentIdx < chapters.length - 1) {
    openChapterReader({ chapter: chapters[currentIdx + 1], manga: selectedManga.value });
  }
};

const closeReader = () => {
  activeReading.value = null;
  if (selectedManga.value) {
    activeScreen.value = 'manga-detail';
    navigateHistory('manga-detail', { slug: selectedManga.value.slug || selectedManga.value.id });
  } else {
    activeScreen.value = 'manga-home';
    navigateHistory('manga-home');
  }
};

// ---------------------------------------------------------------------------
// 5. Dedicated Video Watch Screen Actions
// ---------------------------------------------------------------------------
const openVideoPlayer = async (video) => {
  const prov = video.provider || videoProvider.value || 'htv';
  videoProvider.value = prov;
  selectedVideo.value = { ...video, provider: prov };
  videoDetailData.value = null;
  activeScreen.value = 'video-watch';
  const slug = video.slug || video.id;
  navigateHistory('video-watch', { slug, provider: prov });

  videoDetailLoading.value = true;
  try {
    if (prov === 'neko') {
      videoDetailData.value = await fetchNekoDetail(slug);
    } else if (prov === 'htv') {
      videoDetailData.value = await fetchHtvDetail(slug);
    } else if (prov === 'tube') {
      videoDetailData.value = await fetchTubeDetail(slug);
    }
  } catch (err) {
    console.error('Failed to fetch video detail:', err);
  } finally {
    videoDetailLoading.value = false;
  }
};

const activeRelatedVideos = computed(() => {
  if (videoDetailData.value?.related && Array.isArray(videoDetailData.value.related) && videoDetailData.value.related.length > 0) {
    return videoDetailData.value.related;
  }
  const curSlug = selectedVideo.value?.slug || selectedVideo.value?.id;
  const curProv = selectedVideo.value?.provider || videoProvider.value || 'htv';
  return videoList.value.filter((v) => {
    const slug = v.slug || v.id;
    const prov = v.provider || curProv;
    return slug !== curSlug && (!v.provider || prov === curProv);
  });
});

const closeVideoPlayer = () => {
  activeScreen.value = 'video-home';
  selectedVideo.value = null;
  videoDetailData.value = null;
  navigateHistory('video-home');
};

const handleOpenLocalManga = ({ title, images }) => {
  activeReading.value = {
    mangaSlug: 'local-comic',
    title: title || 'Komik Berkas Lokal',
    chapterId: 'local-' + Date.now(),
    chapterNumber: '1',
    images: images || [],
  };
  selectedManga.value = {
    title: title || 'Komik Berkas Lokal',
    chapters: [{ id: activeReading.value.chapterId, title: 'Bab Berkas Lokal' }],
  };
  activeScreen.value = 'manga-reader';
  navigateHistory('manga-reader');
};

const handleOpenLocalVideo = (videoObj) => {
  selectedVideo.value = videoObj;
  videoDetailData.value = {
    title: videoObj.title,
    views: 'Offline Local',
    tags: ['Lokal', 'Offline'],
  };
  activeScreen.value = 'cinema-watch';
  navigateHistory('cinema-watch');
};

// ---------------------------------------------------------------------------
// 6. Offline Storage Handlers
// ---------------------------------------------------------------------------
const refreshOfflineList = async () => {
  offlineChapters.value = await getAllOfflineChapters();
};

const handleClearOffline = async () => {
  if (confirm('Hapus seluruh chapter manga offline dari memori perangkat?')) {
    await clearOfflineStorage();
    await refreshOfflineList();
  }
};

// Lifecycle & Popstate Listener
onMounted(async () => {
  // Theme init
  const savedTheme = localStorage.getItem('kura_theme') || 'default';
  applyTheme(savedTheme);

  // Custom theme listener from Settings
  window.addEventListener('kura-custom-theme-updated', () => {
    if (currentTheme.value === 'custom') {
      applyCustomThemeStyles();
    }
  });

  // Dev mode init
  isDevMode.value = isDevModeActive();

  // Load offline count
  await refreshOfflineList();

  // URL Query Params state restoration on Refresh/Reload
  const params = new URLSearchParams(window.location.search);
  const urlTab = params.get('tab');
  const urlView = params.get('view');
  const urlSlug = params.get('slug');
  const urlChapter = params.get('chapter');
  const urlProvider = params.get('provider');

  if (urlProvider) {
    videoProvider.value = urlProvider;
  }

  if (urlTab === 'video' || urlView === 'video-watch') {
    currentTab.value = 'video';
    if (urlView === 'video-watch' && urlSlug) {
      openVideoPlayer({
        slug: urlSlug,
        id: urlSlug,
        title: urlSlug.replace(/-/g, ' ').toUpperCase(),
        provider: urlProvider || videoProvider.value,
      });
    } else {
      activeScreen.value = 'video-home';
      loadVideos(1);
    }
  } else if (urlTab === 'catalog' || urlView === 'manga-catalog' || urlView === 'catalog') {
    currentTab.value = 'catalog';
    activeScreen.value = 'manga-catalog';
  } else if (urlTab === 'library') {
    currentTab.value = 'library';
    activeScreen.value = 'library';
  } else if (urlTab === 'settings') {
    currentTab.value = 'settings';
    activeScreen.value = 'settings';
  } else if (urlTab === 'about' || urlView === 'about') {
    currentTab.value = 'about';
    activeScreen.value = 'about';
  } else {
    // Manga tab
    currentTab.value = 'manga';
    if (urlView === 'manga-detail' && urlSlug) {
      openMangaDetail({
        slug: urlSlug,
        id: urlSlug,
        title: urlSlug.replace(/-/g, ' '),
      });
    } else if (urlView === 'reader' && urlSlug && urlChapter) {
      await openMangaDetail({
        slug: urlSlug,
        id: urlSlug,
        title: urlSlug.replace(/-/g, ' '),
      });
      openChapterReader({
        chapter: { id: urlChapter, slug: urlChapter, chapterNumber: urlChapter },
        manga: selectedManga.value || { slug: urlSlug, title: urlSlug },
      });
    } else {
      activeScreen.value = 'manga-home';
      loadManga(1);
    }
  }

  // Popstate history listener for natural browser back/forward buttons
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (!state || state.screen === 'manga-home') {
      currentTab.value = 'manga';
      activeScreen.value = 'manga-home';
      selectedManga.value = null;
      activeReading.value = null;
    } else if (state.screen === 'manga-catalog') {
      currentTab.value = 'catalog';
      activeScreen.value = 'manga-catalog';
      selectedManga.value = null;
      activeReading.value = null;
    } else if (state.screen === 'video-home') {
      currentTab.value = 'video';
      activeScreen.value = 'video-home';
      selectedVideo.value = null;
    } else if (state.screen === 'manga-detail') {
      currentTab.value = 'manga';
      activeScreen.value = 'manga-detail';
      activeReading.value = null;
    } else if (state.screen === 'video-watch') {
      currentTab.value = 'video';
      activeScreen.value = 'video-watch';
    } else if (state.screen === 'manga-reader') {
      currentTab.value = 'manga';
      activeScreen.value = 'manga-reader';
    } else if (state.screen === 'library') {
      currentTab.value = 'library';
      activeScreen.value = 'library';
    } else if (state.screen === 'settings') {
      currentTab.value = 'settings';
      activeScreen.value = 'settings';
    } else if (state.screen === 'about') {
      currentTab.value = 'about';
      activeScreen.value = 'about';
    }
  });
});
</script>

<template>
  <div
    class="kura-app-shell"
    :class="{
      'sidebar-collapsed': isSidebarCollapsed,
      'reader-mode': activeScreen === 'manga-reader'
    }"
  >
    <!-- DESKTOP SHELL: YouTube-style Collapsible Sidebar (hidden in reader mode for focus) -->
    <DesktopSidebar
      v-if="isDesktop && activeScreen !== 'manga-reader'"
      :current-tab="currentTab"
      :current-theme="currentTheme"
      :is-dev-mode="isDevMode"
      :offline-count="offlineCount"
      :is-collapsed="isSidebarCollapsed"
      @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
      @navigate="handleNavigate"
      @set-theme="applyTheme"
      @toggle-dev-mode="toggleDevMode"
    />

    <!-- MAIN APP CANVAS -->
    <div
      class="kura-main-canvas"
      :class="{ 'full-screen-reader': activeScreen === 'manga-reader' }"
    >
      <!-- Global Download Queue Drawer -->
      <DownloadQueueDrawer v-model="showDownloadQueue" />

      <!-- Sticky Header: Omnisearch & Quick Status (hidden in reader mode) -->
      <AppHeader
        v-if="activeScreen !== 'manga-reader'"
        :is-mobile="!isDesktop"
        :current-tab="currentTab"
        v-model:searchQuery="searchQuery"
        :is-privacy-mode="isPrivacyMode"
        :current-theme="currentTheme"
        :has-active-downloads="showDownloadQueue"
        @navigate="handleNavigate"
        @search="handleSearch"
        @clear-search="handleClearSearch"
        @toggle-privacy-mode="isPrivacyMode = !isPrivacyMode"
        @cycle-theme="cycleTheme"
        @toggle-download-queue="showDownloadQueue = !showDownloadQueue"
      />

      <!-- SCREEN 1: MANGA / KOMIK HOMEPAGE -->
      <HomeView
        v-if="activeScreen === 'manga-home'"
        :is-privacy-mode="isPrivacyMode"
        :bookmarked-ids="bookmarkedIds"
        :live-comics="mangaList"
        :is-loading="mangaLoading"
        @select-comic="openMangaDetail"
        @toggle-bookmark="toggleBookmark"
      />

      <!-- SCREEN 1B: DEDICATED MANGA CATALOG SCREEN (Kura Dedicated Screen Pattern) -->
      <MangaCatalogView
        v-else-if="activeScreen === 'manga-catalog'"
        :is-privacy-mode="isPrivacyMode"
        :bookmarked-ids="bookmarkedIds"
        @select-comic="openMangaDetail"
        @toggle-bookmark="toggleBookmark"
      />

      <!-- SCREEN 2: DEDICATED MANGA DETAIL SCREEN (Kura Dedicated Screen Pattern - NOT A POPUP MODAL) -->
      <MangaDetailView
        v-else-if="activeScreen === 'manga-detail' && selectedManga"
        :manga="selectedManga"
        :loading="detailLoading"
        :is-privacy-mode="isPrivacyMode"
        @back="closeMangaDetail"
        @select-chapter="openChapterReader"
        @toggle-bookmark="toggleBookmark"
        @open-queue="showDownloadQueue = true"
      />

      <!-- SCREEN 3: DEDICATED MANGA READER SCREEN -->
      <MangaReader
        v-else-if="activeScreen === 'manga-reader' && activeReading"
        :manga-slug="activeReading.mangaSlug"
        :title="activeReading.title"
        :thumb="activeReading.thumb"
        :cover="activeReading.cover"
        :chapter-id="activeReading.chapterId"
        :chapter-number="activeReading.chapterNumber"
        :images="activeReading.images"
        :chapter-list="selectedManga?.chapters || selectedManga?.chapterList || []"
        @select-chapter="(ch) => openChapterReader({ chapter: ch, manga: selectedManga || { slug: activeReading.mangaSlug, title: activeReading.title } })"
        @next-chapter="handleNextChapter"
        @prev-chapter="handlePrevChapter"
        @close="closeReader"
      />

      <!-- SCREEN 4: DEDICATED CINEMA STREAMING HOME (Kura Rich Streaming Pattern) -->
      <CinemaHomeView
        v-else-if="activeScreen === 'video-home'"
        :is-privacy-mode="isPrivacyMode"
        @select-video="openVideoPlayer"
      />

      <!-- SCREEN 5: DEDICATED VIDEO WATCH SCREEN (Kura 70/30 Screen Pattern - NOT A FLOATING MODAL) -->
      <VideoWatchView
        v-else-if="activeScreen === 'video-watch' && selectedVideo"
        :video="selectedVideo"
        :detail="videoDetailData"
        :loading="videoDetailLoading"
        :provider="selectedVideo.provider || videoProvider"
        :related-videos="activeRelatedVideos"
        :is-privacy-mode="isPrivacyMode"
        @back="closeVideoPlayer"
        @select-video="openVideoPlayer"
        @toggle-bookmark="toggleBookmark"
      />

      <!-- SCREEN 6: PUSTAKA SAYA (LIBRARY) -->
      <main v-else-if="activeScreen === 'library'" class="container">
        <LibraryView
          @selectMangaDetail="openMangaDetail"
          @readOfflineChapter="openChapterReader"
          @openVideo="openVideoPlayer"
          @openLocalManga="handleOpenLocalManga"
          @openLocalVideo="handleOpenLocalVideo"
        />
      </main>

      <!-- SCREEN 7: PENGATURAN (SETTINGS) -->
      <main v-else-if="activeScreen === 'settings'" class="container">
        <SettingsView
          :current-theme="currentTheme"
          :is-privacy-mode="isPrivacyMode"
          :offline-chapter-count="offlineCount"
          @set-theme="applyTheme"
          @toggle-privacy-mode="isPrivacyMode = !isPrivacyMode"
          @clear-offline="handleClearOffline"
          @navigate="handleNavigate"
        />
      </main>

      <!-- SCREEN 8: TENTANG KURA (DEDICATED SCREEN) -->
      <main v-else-if="activeScreen === 'about'" class="container">
        <AboutView @navigate="handleNavigate" />
      </main>
    </div>

    <!-- MOBILE SHELL: Floating Frosted Glass Bottom Dock (hidden in reader mode) -->
    <MobileDock
      v-if="!isDesktop && activeScreen !== 'manga-reader'"
      :current-tab="currentTab"
      :offline-count="offlineCount"
      @navigate="handleNavigate"
    />

    <!-- Global Toast Notification System -->
    <KuraToast />
  </div>
</template>

<style scoped>
.kura-app-shell {
  display: flex;
  min-height: 100vh;
  background-color: var(--kura-bg);
  color: var(--kura-text-primary);
  width: 100%;
}

.kura-main-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-bottom: calc(var(--mobile-dock-height) + 24px);
  transition: margin-left var(--duration-normal) var(--ease-spring);
}

.kura-main-canvas.full-screen-reader {
  margin-left: 0 !important;
  padding-bottom: 0 !important;
}

@media (min-width: 768px) {
  .kura-main-canvas {
    margin-left: var(--sidebar-width-expanded);
    padding-bottom: var(--space-8);
  }

  .kura-app-shell.sidebar-collapsed .kura-main-canvas {
    margin-left: var(--sidebar-width-collapsed);
  }
}

/* Catalog General */
.catalog-view {
  padding-top: var(--space-4);
}

.catalog-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

@media (min-width: 768px) {
  .catalog-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.view-heading {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--kura-text-primary);
  margin-bottom: var(--space-1);
}

.view-sub {
  font-size: var(--text-sm);
  color: var(--kura-text-muted);
}

/* Filter Pills Bar */
.filter-pills-bar {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.4rem 0.85rem;
  font-size: var(--text-xs);
  font-weight: 600;
  border-radius: var(--radius-pill);
  border: 1px solid var(--kura-border-subtle);
  background: var(--kura-surface);
  color: var(--kura-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.filter-chip:hover {
  background: var(--kura-surface-hover);
  color: var(--kura-text-primary);
  border-color: var(--kura-accent);
}

.filter-chip.active {
  background: var(--kura-accent);
  color: #000;
  border-color: var(--kura-accent);
  font-weight: 700;
}

/* Video Grid - Hybrid Responsive 2-Col Mobile, up to 4-Col Desktop */
.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }
}

@media (min-width: 1280px) {
  .video-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
  }
}

/* Skeletons */
.video-skeleton {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  background: var(--kura-surface);
}

.shimmer-skeleton {
  position: relative;
  overflow: hidden;
}

.shimmer-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Pagination Bar */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-8);
  padding: var(--space-4) 0;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.5rem 1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-pill);
  border: 1px solid var(--kura-border-subtle);
  background: var(--kura-surface);
  color: var(--kura-text-primary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--kura-surface-hover);
  border-color: var(--kura-accent);
  color: var(--kura-accent);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator {
  font-size: var(--text-sm);
  color: var(--kura-text-muted);
  font-weight: 600;
}

/* States */
.state-box {
  padding: var(--space-12) var(--space-4);
  text-align: center;
  border-radius: var(--radius-lg);
  border: 1px dashed var(--kura-border-subtle);
  margin: var(--space-6) 0;
}

.error-box {
  border-color: var(--kura-error);
  color: var(--kura-error);
}

.retry-btn {
  margin-top: var(--space-4);
  padding: 0.5rem 1.25rem;
  background: var(--kura-surface);
  border: 1px solid var(--kura-error);
  color: var(--kura-text-primary);
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}
</style>
