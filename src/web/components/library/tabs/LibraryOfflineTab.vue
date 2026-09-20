<script setup>
import { ref } from 'vue';
import { HardDrive, Play, Trash2, FolderUp, Film, BookOpen, Loader2 } from 'lucide-vue-next';
import { extractCbzImages, createLocalVideoObject } from '../../../services/localFileExtractor.js';

const props = defineProps({
  chapters: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['read-chapter', 'delete-chapter', 'open-local-manga', 'open-local-video']);

const fileInputRef = ref(null);
const isExtracting = ref(false);
const extractProgress = ref(0);
const extractStatus = ref('');
const isDragging = ref(false);

const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

const processFile = async (file) => {
  if (!file) return;
  const name = file.name.toLowerCase();

  if (name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mkv') || file.type.startsWith('video/')) {
    const videoObj = createLocalVideoObject(file);
    emit('open-local-video', videoObj);
    return;
  }

  if (name.endsWith('.cbz') || name.endsWith('.zip') || file.type.includes('zip')) {
    isExtracting.value = true;
    extractProgress.value = 5;
    extractStatus.value = `Mengekstrak "${file.name}"...`;

    try {
      const result = await extractCbzImages(file, (pct) => {
        extractProgress.value = pct;
      });
      emit('open-local-manga', result);
    } catch (err) {
      alert(`Gagal membuka CBZ: ${err.message}`);
    } finally {
      isExtracting.value = false;
      extractProgress.value = 0;
      extractStatus.value = '';
    }
    return;
  }

  alert('Format berkas tidak didukung. Harap pilih berkas .mp4, .webm, .cbz, atau .zip.');
};

const onFileChange = (e) => {
  const file = e.target.files?.[0];
  if (file) processFile(file);
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const onDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) processFile(file);
};
</script>

<template>
  <div class="library-tab-content">
    <!-- Local File Dropzone / Picker Card -->
    <div
      class="local-dropzone-card"
      :class="{ 'is-dragging': isDragging, 'is-loading': isExtracting }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept=".mp4,.webm,.mkv,.cbz,.zip,video/*"
        class="hidden-file-input"
        @change="onFileChange"
      />

      <div v-if="isExtracting" class="dropzone-loader">
        <Loader2 :size="28" class="spin-icon" />
        <span class="loader-text">{{ extractStatus }} ({{ extractProgress }}%)</span>
        <div class="extract-progress-bar">
          <div class="bar-fill" :style="{ width: `${extractProgress}%` }"></div>
        </div>
      </div>

      <div v-else class="dropzone-content" @click="triggerFileSelect">
        <div class="dropzone-icons">
          <div class="type-badge video"><Film :size="15" /> <span>Video MP4/WEBM</span></div>
          <div class="type-badge comic"><BookOpen :size="15" /> <span>Komik CBZ/ZIP</span></div>
        </div>
        <div class="dropzone-label-box">
          <h4 class="dropzone-title">
            <FolderUp :size="16" />
            <span>Buka Berkas Lokal (Putar Video / Baca CBZ)</span>
          </h4>
          <p class="dropzone-subtitle">
            Seret berkas ke sini atau <u>klik untuk memilih berkas dari HP/Komputer Anda</u>. 100% diproses di browser tanpa internet.
          </p>
        </div>
        <button type="button" class="browse-files-btn">Pilih Berkas</button>
      </div>
    </div>

    <!-- Offline Chapters Section -->
    <div class="offline-section-header">
      <h3 class="sub-heading">Bab Komik Tersimpan di Database Browser</h3>
      <span class="sub-count">{{ chapters.length }} Bab Tersedia</span>
    </div>
    <div v-if="chapters.length === 0" class="empty-state">
      <HardDrive :size="40" class="empty-icon" />
      <h3 class="empty-title">Belum Ada Bab Tersimpan Offline</h3>
      <p class="empty-desc">Unduh bab dari halaman detail manga agar dapat dibaca kapan saja tanpa koneksi internet.</p>
    </div>

    <div v-else class="offline-grid">
      <div
        v-for="ch in chapters"
        :key="ch.chapterId"
        class="offline-card"
        @click="emit('read-chapter', ch)"
      >
        <div class="thumb-box">
          <img :src="ch.thumb || ''" :alt="ch.title" class="thumb-img" loading="lazy" />
        </div>

        <div class="info-box">
          <h4 class="manga-name" :title="ch.title">{{ ch.title }}</h4>
          <span class="chapter-badge">Bab {{ ch.chapterNumber || ch.chapterTitle }}</span>
          <span v-if="ch.imageCount" class="page-count">{{ ch.imageCount }} Halaman Tersimpan</span>
        </div>

        <div class="card-actions">
          <button
            type="button"
            class="action-btn delete"
            title="Hapus dari Penyimpanan Offline"
            @click.stop="emit('delete-chapter', ch)"
          >
            <Trash2 :size="14" />
          </button>
          <button
            type="button"
            class="action-btn play"
            title="Baca Bab Offline"
          >
            <Play :size="14" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library-tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  padding: 64px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--kura-text-muted, #94a3b8);
}

.empty-icon {
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 8px;
}

.empty-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.empty-desc {
  font-size: 0.82rem;
  margin: 0;
  max-width: 400px;
}

.offline-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .offline-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .offline-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.offline-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.offline-card:hover {
  border-color: var(--kura-accent, #e5a93c);
  transform: translateY(-2px);
}

.thumb-box {
  width: 50px;
  height: 68px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #090a0f;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.manga-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-badge {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 700;
  color: #34d399;
}

.page-count {
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: #ffffff;
}

.action-btn.play {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.offline-card:hover .action-btn.play {
  background: var(--kura-accent, #e5a93c);
  color: #000000;
}

/* Local Dropzone Styles */
.hidden-file-input {
  display: none;
}

.local-dropzone-card {
  border: 2px dashed rgba(229, 169, 60, 0.35);
  border-radius: 12px;
  background: rgba(229, 169, 60, 0.03);
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.local-dropzone-card:hover,
.local-dropzone-card.is-dragging {
  border-color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.08);
  transform: translateY(-1px);
}

.dropzone-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.dropzone-icons {
  display: flex;
  gap: 8px;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.type-badge.video {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.type-badge.comic {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.dropzone-label-box {
  flex: 1;
  min-width: 240px;
}

.dropzone-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0 0 4px 0;
}

.dropzone-subtitle {
  font-size: 0.78rem;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
  line-height: 1.4;
}

.browse-files-btn {
  background: var(--kura-accent, #e5a93c);
  color: #0b0c10;
  font-weight: 700;
  font-size: 0.8rem;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.browse-files-btn:hover {
  opacity: 0.9;
}

.dropzone-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  color: var(--kura-accent, #e5a93c);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loader-text {
  font-size: 0.85rem;
  font-weight: 600;
}

.extract-progress-bar {
  width: 100%;
  max-width: 320px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--kura-accent, #e5a93c);
  transition: width 0.15s ease;
}

.offline-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sub-heading {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.sub-count {
  font-size: 0.75rem;
  color: var(--kura-text-muted, #94a3b8);
}
</style>
