<script setup>
import { Eye, Clock, Star, Bookmark, Share2, ShieldCheck, Tag } from 'lucide-vue-next';
import WatchDownloadPanel from './WatchDownloadPanel.vue';


const props = defineProps({
  video: {
    type: Object,
    required: true,
  },
  detail: {
    type: Object,
    default: null,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    default: 'htv',
  },
  downloadSettings: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['toggle-bookmark', 'share']);
</script>

<template>
  <div class="watch-video-meta">
    <div class="meta-header-row">
      <div class="title-wrap">
        <h1 class="video-main-title">{{ detail?.title || video.title }}</h1>
        <p v-if="detail?.japaneseTitle || video.altTitle" class="video-alt-title">
          {{ detail?.japaneseTitle || video.altTitle }}
        </p>
      </div>

      <div class="meta-action-buttons">
        <button
          type="button"
          class="meta-btn"
          :class="{ active: isBookmarked }"
          :title="isBookmarked ? 'Hapus dari Simpanan' : 'Simpan Video'"
          @click="emit('toggle-bookmark', video)"
        >
          <Bookmark :size="16" :fill="isBookmarked ? 'currentColor' : 'none'" />
          <span>{{ isBookmarked ? 'Tersimpan' : 'Simpan' }}</span>
        </button>

        <button type="button" class="meta-btn" title="Bagikan Video" @click="emit('share', video)">
          <Share2 :size="16" />
          <span>Bagikan</span>
        </button>

        <!-- Download Panel -->
        <WatchDownloadPanel
          :video="video"
          :detail="detail"
          :provider="provider"
          :download-settings="downloadSettings"
        />

      </div>
    </div>

    <!-- Stat Strip -->
    <div class="meta-stat-strip">
      <div v-if="detail?.views || video.views" class="stat-pill">
        <Eye :size="13" />
        <span>{{ detail?.views || video.views }} Tayangan</span>
      </div>

      <div v-if="detail?.date || video.date || video.added" class="stat-pill">
        <Clock :size="13" />
        <span>{{ detail?.date || video.date || video.added }}</span>
      </div>

      <div v-if="detail?.rating || video.rating" class="stat-pill rating">
        <Star :size="13" class="star-icon" />
        <span>{{ detail?.rating || video.rating }}</span>
      </div>

      <div class="stat-pill sandbox-tag">
        <ShieldCheck :size="13" />
        <span>Sandbox Ad-Blocker Aktif</span>
      </div>
    </div>

    <!-- Genres / Tags -->
    <div v-if="(detail?.genres && detail.genres.length) || (video.tags && video.tags.length)" class="meta-genres-wrap">
      <span
        v-for="g in (detail?.genres || video.tags || [])"
        :key="typeof g === 'string' ? g : g.name"
        class="genre-chip"
      >
        <Tag :size="10" />
        {{ typeof g === 'string' ? g : g.name }}
      </span>
    </div>

    <!-- Synopsis -->
    <div v-if="detail?.synopsis || detail?.description || video.synopsis" class="meta-synopsis-box">
      <h3 class="synopsis-heading">Sinopsis & Keterangan</h3>
      <p class="synopsis-text">
        {{ detail?.synopsis || detail?.description || video.synopsis }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.watch-video-meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  padding: 16px 20px;
}

.meta-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.title-wrap {
  flex: 1;
  min-width: 260px;
}

.video-main-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
  word-break: break-word;
}

.video-alt-title {
  font-size: 0.8rem;
  color: var(--kura-text-muted, #94a3b8);
  margin: 4px 0 0;
}

.meta-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-pill, 9999px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--kura-text-secondary, #cbd5e1);
  font-family: var(--kura-font-sans, sans-serif);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.meta-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.meta-btn.active {
  background: rgba(229, 169, 60, 0.18);
  border-color: rgba(229, 169, 60, 0.45);
  color: var(--kura-accent, #e5a93c);
}

.meta-stat-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.7rem;
  color: var(--kura-text-muted, #94a3b8);
}

.stat-pill.rating {
  color: #fbbf24;
  font-weight: 700;
}

.star-icon {
  fill: currentColor;
}

.stat-pill.sandbox-tag {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(52, 211, 153, 0.25);
}

.meta-genres-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.genre-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--kura-text-secondary, #cbd5e1);
}

.meta-synopsis-box {
  border-top: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  padding-top: 12px;
}

.synopsis-heading {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--kura-accent, #e5a93c);
  margin: 0 0 6px;
}

.synopsis-text {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
}
</style>
