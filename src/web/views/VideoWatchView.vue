<script setup>
import { ref, computed } from 'vue';
import { ArrowLeft } from 'lucide-vue-next';
import { useToast } from '../composables/useToast.js';
import WatchPlayerContainer from '../components/video-watch/WatchPlayerContainer.vue';
import WatchVideoMeta from '../components/video-watch/WatchVideoMeta.vue';
import WatchEpisodeRail from '../components/video-watch/WatchEpisodeRail.vue';
import WatchRelatedSidebar from '../components/video-watch/WatchRelatedSidebar.vue';

const props = defineProps({
  video: {
    type: Object,
    required: true,
  },
  detail: {
    type: Object,
    default: null,
  },
  relatedVideos: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    default: 'htv',
  },
  isPrivacyMode: {
    type: Boolean,
    default: false,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['back', 'select-video', 'toggle-bookmark']);

const toast = useToast();

const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: props.detail?.title || props.video.title,
      url: window.location.href,
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Tautan video berhasil disalin ke clipboard!');
  }
};
</script>

<template>
  <div class="kura-video-watch-view container">
    <!-- Sub-Navbar: Back Button -->
    <div class="watch-subnav">
      <button type="button" class="back-btn" @click="emit('back')">
        <ArrowLeft :size="16" />
        <span>Kembali ke Katalog Sinema</span>
      </button>
    </div>

    <!-- 70/30 Dual-Column Architecture -->
    <div class="watch-layout-grid">
      <!-- Left 70% Column: Sticky Player, Meta, and Episodes -->
      <div class="watch-main-column">
        <div class="sticky-player-anchor">
          <WatchPlayerContainer
            :video="video"
            :detail="detail"
            :loading="loading"
            :provider="provider"
            @back="emit('back')"
          />
        </div>

        <WatchVideoMeta
          :video="video"
          :detail="detail"
          :provider="provider"
          :is-bookmarked="isBookmarked"
          @toggle-bookmark="emit('toggle-bookmark', video)"
          @share="handleShare"
        />

        <WatchEpisodeRail
          v-if="detail?.episodes && detail.episodes.length > 1"
          :episodes="detail.episodes"
          :current-episode-slug="video.slug || video.id"
          @select-episode="(ep) => emit('select-video', ep)"
        />
      </div>

      <!-- Right 30% Column: Independent Scroll Recommendations -->
      <div class="watch-sidebar-column">
        <WatchRelatedSidebar
          :videos="relatedVideos"
          :provider="provider"
          :is-privacy-mode="isPrivacyMode"
          @select-video="(v) => emit('select-video', v)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.kura-video-watch-view {
  padding-top: 16px;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.watch-subnav {
  display: flex;
  align-items: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--kura-text-muted, #94a3b8);
  font-family: var(--kura-font-sans, sans-serif);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: var(--kura-accent, #e5a93c);
  transform: translateX(-3px);
}

.watch-layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}

@media (min-width: 1024px) {
  .watch-layout-grid {
    grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
    gap: 24px;
  }

  .sticky-player-anchor {
    position: relative;
    width: 100%;
  }

  .watch-sidebar-column {
    position: sticky;
    top: 76px;
  }
}

@media (max-width: 1023px) {
  .sticky-player-anchor {
    position: relative;
    width: 100%;
  }
}

.watch-main-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.watch-sidebar-column {
  min-width: 0;
}

/* Mobile Portrait Optimization */
@media (max-width: 768px) {
  .kura-video-watch-view {
    padding-top: 8px;
    padding-bottom: 84px;
    gap: 12px;
  }

  .watch-subnav {
    padding: 0 4px;
  }

  .watch-layout-grid {
    gap: 14px;
  }

  .watch-main-column {
    gap: 12px;
  }
}

/* Mobile Landscape Cinematic Mode */
@media (orientation: landscape) and (max-height: 540px) {
  .kura-video-watch-view {
    padding: 0 !important;
    max-width: 100vw !important;
    gap: 0 !important;
  }

  .watch-subnav {
    display: none !important;
  }

  .sticky-player-anchor {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
  }

  .watch-sidebar-column {
    display: none !important;
  }
}
</style>
