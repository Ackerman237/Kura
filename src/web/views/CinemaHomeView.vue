<script setup>
import { ref, onMounted } from 'vue';
import { fetchHtvList, fetchNekoList, fetchTubeList, fetchHtvGenres, fetchTubeCategories } from '../services/api.js';
import CinemaHeroBillboard from '../components/cinema/CinemaHeroBillboard.vue';
import CinemaTrendingRail from '../components/cinema/CinemaTrendingRail.vue';
import CinemaStudioSwitcher from '../components/cinema/CinemaStudioSwitcher.vue';
import CinemaCatalogGrid from '../components/cinema/CinemaCatalogGrid.vue';

const props = defineProps({
  isPrivacyMode: {
    type: Boolean,
    default: false,
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
    if (currentProvider.value === 'neko') {
      data = await fetchNekoList(page);
    } else if (currentProvider.value === 'htv') {
      data = await fetchHtvList({ page, genre: selectedGenre.value || undefined });
    } else if (currentProvider.value === 'tube') {
      data = await fetchTubeList({ page, category: selectedGenre.value || undefined });
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

onMounted(() => {
  loadGenres();
  loadVideos(1);
});
</script>

<template>
  <div class="kura-cinema-home-view container">
    <!-- 1. Hero Premiere Spotlight Billboard -->
    <CinemaHeroBillboard
      :video="videoList[0] || null"
      :provider="currentProvider"
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

    <!-- 4. Full Symmetrical Video Catalog Grid with Genre Filter & Pagination -->
    <CinemaCatalogGrid
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
