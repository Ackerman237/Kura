<script setup>
import { computed, ref, watch } from 'vue';
import { BookOpen, Film, Search, AlertCircle, LoaderCircle } from 'lucide-vue-next';
import ComicCard from '../components/common/ComicCard.vue';
import VideoCard from '../components/common/VideoCard.vue';
import { fetchMangaList, fetchHtvList, fetchNekoList, fetchTubeList } from '../services/api.js';

const props = defineProps({
  query: {
    type: String,
    default: '',
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  bookmarkedIds: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['select-comic', 'toggle-bookmark', 'select-video', 'clear-search']);

const isLoading = ref(false);
const errorMessage = ref('');
const mangaResults = ref([]);
const videoResults = ref([]);
const providerStatus = ref({ htv: 'idle', neko: 'idle', tube: 'idle' });
let requestId = 0;

const normalizedQuery = computed(() => props.query.trim());
const hasResults = computed(() => mangaResults.value.length > 0 || videoResults.value.length > 0);

const providerLabel = (provider) => {
  if (provider === 'htv') return 'HentaiTV';
  if (provider === 'neko') return 'NekoPoi';
  return 'Eporner';
};

const normalizeItems = (data) => data?.items || data?.results || data?.videos || data?.data || (Array.isArray(data) ? data : []);

const search = async () => {
  const query = normalizedQuery.value;
  if (!query) return;

  const currentRequestId = ++requestId;
  isLoading.value = true;
  errorMessage.value = '';
  mangaResults.value = [];
  videoResults.value = [];
  providerStatus.value = { htv: 'loading', neko: 'loading', tube: 'loading' };

  const results = await Promise.allSettled([
    fetchMangaList({ page: 1, limit: 12, q: query, forceRefresh: true }),
    fetchHtvList({ page: 1, q: query, forceRefresh: true }),
    fetchNekoList(1, { q: query, forceRefresh: true }),
    fetchTubeList({ page: 1, q: query, forceRefresh: true }),
  ]);

  if (currentRequestId !== requestId) return;

  const [mangaResult, htvResult, nekoResult, tubeResult] = results;
  mangaResults.value = mangaResult.status === 'fulfilled' ? normalizeItems(mangaResult.value).slice(0, 12) : [];

  const videoGroups = [
    { provider: 'htv', result: htvResult },
    { provider: 'neko', result: nekoResult },
    { provider: 'tube', result: tubeResult },
  ];

  videoResults.value = videoGroups.flatMap(({ provider, result }) => {
    providerStatus.value[provider] = result.status === 'fulfilled' ? 'success' : 'error';
    if (result.status !== 'fulfilled') return [];
    return normalizeItems(result.value).slice(0, 8).map((item) => ({ ...item, provider }));
  });

  if (mangaResult.status === 'rejected' && videoResults.value.length === 0) {
    errorMessage.value = 'Pencarian gagal pada semua sumber. Coba lagi.';
  } else if (!hasResults.value) {
    errorMessage.value = 'Tidak ada hasil yang cocok dengan kata kunci ini.';
  }

  isLoading.value = false;
};

watch(() => props.query, search, { immediate: true });
</script>

<template>
  <main class="universal-search-view container">
    <header class="universal-search-header">
      <div>
        <span class="universal-search-kicker"><Search :size="14" /> PENCARIAN UNIVERSAL</span>
        <h1 class="universal-search-title">Hasil untuk "{{ query }}"</h1>
        <p class="universal-search-summary">Manga dan video dari katalog Kura dalam satu hasil pencarian.</p>
      </div>
      <button type="button" class="universal-search-clear" @click="emit('clear-search')">Hapus pencarian</button>
    </header>

    <div v-if="isLoading" class="universal-search-loading" role="status" aria-live="polite">
      <LoaderCircle :size="20" class="spin-icon" />
      <span>Mencari di katalog manga dan video...</span>
    </div>

    <div v-else-if="errorMessage" class="universal-search-state" role="status" aria-live="polite">
      <AlertCircle :size="22" />
      <p>{{ errorMessage }}</p>
    </div>

    <template v-else>
      <section v-if="mangaResults.length" class="universal-search-section">
        <div class="universal-search-section-heading">
          <div><BookOpen :size="17" /><h2>Manga</h2></div>
          <span>{{ mangaResults.length }} hasil</span>
        </div>
        <div class="universal-manga-grid">
          <ComicCard
            v-for="comic in mangaResults"
            :key="comic.slug || comic.id"
            :comic="comic"
            :is-privacy-mode="isPrivacyMode"
            :is-bookmarked="bookmarkedIds.includes(comic.slug || comic.id)"
            view-mode="grid"
            @select="emit('select-comic', comic)"
            @toggle-bookmark="emit('toggle-bookmark', comic)"
          />
        </div>
      </section>

      <section class="universal-search-section">
        <div class="universal-search-section-heading">
          <div><Film :size="17" /><h2>Video</h2></div>
          <span>{{ videoResults.length }} hasil</span>
        </div>
        <div class="universal-provider-status">
          <span v-for="provider in ['htv', 'neko', 'tube']" :key="provider" :class="['provider-status', `status-${providerStatus[provider]}`]">
            {{ providerLabel(provider) }}
            <small v-if="provider === 'neko'">server-side</small>
          </span>
        </div>
        <div v-if="videoResults.length" class="universal-video-grid">
          <VideoCard
            v-for="video in videoResults"
            :key="`${video.provider}-${video.slug || video.id}`"
            :video="video"
            :provider="video.provider"
            :is-privacy-mode="isPrivacyMode"
            @select="emit('select-video', video)"
          />
        </div>
        <div v-else class="universal-search-empty">Tidak ada video yang cocok.</div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.universal-search-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-top: 24px;
  padding-bottom: var(--page-bottom-clearance, 80px);
}

.universal-search-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--kura-border-subtle);
}

.universal-search-kicker,
.universal-search-section-heading > div,
.universal-provider-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.universal-search-kicker {
  color: var(--kura-accent);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.universal-search-title {
  margin: 8px 0 4px;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  overflow-wrap: anywhere;
}

.universal-search-summary {
  margin: 0;
  color: var(--kura-text-muted);
  font-size: var(--text-base);
}

.universal-search-clear {
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--kura-border-strong);
  border-radius: var(--radius-sm);
  color: var(--kura-text-secondary, var(--kura-text-muted));
  font-weight: 600;
  white-space: nowrap;
}

.universal-search-clear:hover {
  color: var(--kura-accent);
  border-color: var(--kura-accent);
}

.universal-search-loading,
.universal-search-state,
.universal-search-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 140px;
  color: var(--kura-text-muted);
  text-align: center;
}

.universal-search-state {
  flex-direction: column;
  border: 1px dashed var(--kura-border-subtle);
  border-radius: var(--radius-md);
}

.universal-search-state p { margin: 0; }

.spin-icon { animation: universal-search-spin 0.9s linear infinite; }

@keyframes universal-search-spin {
  to { transform: rotate(360deg); }
}

.universal-search-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.universal-search-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.universal-search-section-heading > div { color: var(--kura-accent); }
.universal-search-section-heading h2 { margin: 0; color: var(--kura-text-primary); font-size: var(--text-lg); font-weight: 700; }
.universal-search-section-heading > span { color: var(--kura-text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }

.universal-manga-grid,
.universal-video-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.universal-provider-status {
  flex-wrap: wrap;
  gap: 8px;
}

.provider-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-sm);
  color: var(--kura-text-muted);
  font-size: var(--text-xs);
}

.provider-status small { color: var(--kura-text-dim); }
.status-success { border-color: rgba(52, 211, 153, 0.35); color: #34d399; }
.status-error { border-color: rgba(248, 113, 113, 0.35); color: #f87171; }

@media (min-width: 640px) {
  .universal-manga-grid,
  .universal-video-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .universal-manga-grid,
  .universal-video-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .universal-search-header { align-items: flex-start; flex-direction: column; }
  .universal-search-clear { width: 100%; }
}
</style>
