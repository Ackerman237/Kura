<script setup>
import { ref, onMounted, watch } from 'vue';
import { fetchHtvList, fetchNekoList, fetchTubeList, fetchHtvGenres, fetchTubeCategories } from '../services/api.js';
import CinemaHeroBillboard from '../components/cinema/CinemaHeroBillboard.vue';
import CinemaTrendingRail from '../components/cinema/CinemaTrendingRail.vue';
import CinemaStudioSwitcher from '../components/cinema/CinemaStudioSwitcher.vue';
import CinemaCatalogGrid from '../components/cinema/CinemaCatalogGrid.vue';
import CinemaUnifiedFeed from '../components/cinema/CinemaUnifiedFeed.vue';
import { mergeUnifiedFeed } from '../services/unifiedFeed.js';

const props = defineProps({
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  initialSearchQuery: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select-video']);

const currentProvider = ref('htv');
const videoList = ref([]);
const genresList = ref([]);
const selectedGenre = ref('');
const videoPage = ref(1);
const videoTotalPages = ref(50);
const videoLoading = ref(false);
const videoError = ref(null);
const searchQuery = ref(props.initialSearchQuery || '');

const loadGenres = async () => {
  try {
    if (currentProvider.value === 'htv') {
      const g = await fetchHtvGenres();
      genresList.value = Array.isArray(g) ? g : [];
    } else if (currentProvider.value === 'tube') {
      const c = await fetchTubeCategories();
      genresList.value = Array.isArray(c) ? c : [];
    } else {
      genresList.value = [];
    }
  } catch (e) {
    genresList.value = [];
  }
};

const loadVideos = async (page = 1) => {
  videoLoading.value = true;
  videoError.value = null;
  videoPage.value = page;

  try {
    let data;
    if (currentProvider.value === 'all') {
      const merged = await mergeUnifiedFeed([
        { provider: 'htv', fetcher: () => fetchHtvList({ page, q: searchQuery.value }) },
        { provider: 'neko', fetcher: () => fetchNekoList(page, { q: searchQuery.value }) },
        { provider: 'tube', fetcher: () => fetchTubeList({ page, q: searchQuery.value }) },
      ]);
      videoList.value = merged;
      videoTotalPages.value = 1;
      return;
    } else if (currentProvider.value === 'neko') {
      data = await fetchNekoList(page);
    } else if (currentProvider.value === 'htv') {
      data = await fetchHtvList({ page, q: searchQuery.value, genre: selectedGenre.value || undefined });
    } else if (currentProvider.value === 'tube') {
      data = await fetchTubeList({ page, q: searchQuery.value, category: selectedGenre.value || undefined });
    }

    const items = data.results || data.videos || data.data || (Array.isArray(data) ? data : []);
    videoList.value = items;
    if (data.totalPages) videoTotalPages.value = data.totalPages;
  } catch (err) {
    videoError.value = err.message || 'Gagal memuat katalog video.';
  } finally {
    videoLoading.value = false;
  }
};

const handleSelectProvider = (provId) => {
  currentProvider.value = provId;
  selectedGenre.value = '';
  loadGenres();
  loadVideos(1);
};

const handleSelectGenre = (genre) => {
  selectedGenre.value = genre;
  loadVideos(1);
};

const handleChangePage = (p) => {
  loadVideos(p);
  window.scrollTo({ top: 400, behavior: 'smooth' });
};

watch(
  () => props.initialSearchQuery,
  (nextQuery) => {
    const normalizedQuery = nextQuery || '';
    if (normalizedQuery === searchQuery.value) return;
    searchQuery.value = normalizedQuery;
    loadVideos(1);
  }
);

onMounted(() => {
  loadGenres();
  loadVideos(1);
});
</script>

<template>
  <div class="kura-cinema-home-view container">
    <!-- 1. Spotlight Hero Billboard -->
    <CinemaHeroBillboard
      v-if="videoList && videoList.length"
      :video="videoList[0] || null"
      :provider="currentProvider"
      :is-privacy-mode="isPrivacyMode"
      @select-video="(v) => emit('select-video', { ...v, provider: currentProvider })"
    />

    <!-- 2. Studio / Server Provider Switcher -->
    <CinemaStudioSwitcher
      :current-provider="currentProvider"
      @select-provider="handleSelectProvider"
    />

    <!-- 3. Top Trending Rail #1-#8 -->
    <CinemaTrendingRail
      :videos="videoList"
      :is-privacy-mode="isPrivacyMode"
      @select-video="(v) => emit('select-video', { ...v, provider: currentProvider })"
    />

    <!-- 4. Studio Catalog Grid OR Unified Feed -->
    <CinemaUnifiedFeed
      v-if="currentProvider === 'all'"
      :videos="videoList"
      :loading="videoLoading"
      :error="videoError"
      :is-privacy-mode="isPrivacyMode"
      @select-video="(v) => emit('select-video', v)"
      @retry="loadVideos(1)"
    />
    <CinemaCatalogGrid
      v-else
      :videos="videoList"
      :loading="videoLoading"
      :error="videoError"
      :genres="genresList"
      :selected-genre="selectedGenre"
      :provider="currentProvider"
      :is-privacy-mode="isPrivacyMode"
      :page="videoPage"
      :total-pages="videoTotalPages"
      @select-video="(v) => emit('select-video', { ...v, provider: currentProvider })"
      @select-genre="handleSelectGenre"
      @change-page="handleChangePage"
      @retry="loadVideos(videoPage)"
    />
  </div>
</template>

<style scoped>
.kura-cinema-home-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 20px;
  padding-bottom: 56px;
}
</style>
