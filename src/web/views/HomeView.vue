<script setup>
import { computed } from 'vue';
import HomeHeroBillboard from '../components/home/HomeHeroBillboard.vue';
import HomeContinueReadingRail from '../components/home/HomeContinueReadingRail.vue';
import HomeTrendingRail from '../components/home/HomeTrendingRail.vue';
import HomeLatestReleasesGrid from '../components/home/HomeLatestReleasesGrid.vue';
import { MOCK_COMICS } from '../data/mockComics.js';

const props = defineProps({
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  bookmarkedIds: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  liveComics: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['select-comic', 'toggle-bookmark', 'navigate-catalog']);

const displayComics = computed(() => {
  if (props.liveComics && props.liveComics.length) {
    return props.liveComics;
  }
  return MOCK_COMICS;
});
</script>

<template>
  <div class="kura-home-view container">
    <!-- 1. Hero Premiere Spotlight Billboard -->
    <HomeHeroBillboard
      :comics="displayComics"
      :is-privacy-mode="isPrivacyMode"
      :bookmarked-ids="bookmarkedIds"
      @select-comic="(c) => emit('select-comic', c)"
      @toggle-bookmark="(c) => emit('toggle-bookmark', c)"
    />

    <!-- 2. Continue Reading Rail -->
    <HomeContinueReadingRail
      @select-comic="(c) => emit('select-comic', c)"
    />

    <!-- 3. Top 10 Trending Popular Rail -->
    <HomeTrendingRail
      :comics="displayComics"
      :is-privacy-mode="isPrivacyMode"
      @select-comic="(c) => emit('select-comic', c)"
    />

    <!-- 4. Latest Releases Grid with Type Filter -->
    <HomeLatestReleasesGrid
      :comics="displayComics"
      :is-loading="isLoading"
      :is-privacy-mode="isPrivacyMode"
      :bookmarked-ids="bookmarkedIds"
      @select-comic="(c) => emit('select-comic', c)"
      @toggle-bookmark="(c) => emit('toggle-bookmark', c)"
      @navigate-catalog="emit('navigate-catalog')"
    />
  </div>
</template>

<style scoped>
.kura-home-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 20px;
  padding-bottom: 56px;
}
</style>
