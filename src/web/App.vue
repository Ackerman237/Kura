<script setup>
import { ref, onMounted } from 'vue';
import { BRAND, I18N } from './config/strings.js';
import MangaCard from './components/common/MangaCard.vue';
import MangaReader from './components/reader/MangaReader.vue';

// Navigation State
const activeTab = ref('manga'); // 'manga' | 'cinema'
const searchQuery = ref('');

// Reader Modal State
const activeReading = ref(null);

// Sample curated manga list for demonstrative storehouse display
const sampleMangaList = ref([
  {
    title: 'Jujutsu Kaisen',
    altTitle: '呪術廻戦 (Sorcery Fight)',
    slug: 'jujutsu-kaisen',
    type: 'manga',
    rating: 8.9,
    status: 'Ongoing',
    latestChapter: 268,
    thumb: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Solo Leveling (Only I Level Up)',
    altTitle: '나 혼자만 레벨업',
    slug: 'solo-leveling',
    type: 'manhwa',
    rating: 9.3,
    status: 'Completed',
    latestChapter: 200,
    thumb: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Tales of Demons and Gods',
    altTitle: '妖神记 (Yāo Shén Jì)',
    slug: 'tales-of-demons-and-gods',
    type: 'manhua',
    rating: 8.5,
    status: 'Ongoing',
    latestChapter: 485,
    thumb: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
  {
    title: 'Fate/stay night: Heaven’s Feel',
    altTitle: 'フェイト/ステイナイト',
    slug: 'fate-stay-night',
    type: 'doujinshi',
    rating: 9.1,
    status: 'Completed',
    latestChapter: 32,
    thumb: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
]);

// 100 sample images generator to demonstrate smooth 60fps virtual windowed reader
const generateSampleChapter = (manga) => {
  const sampleImages = Array.from({ length: 80 }, (_, i) => {
    // Generate placeholder panel images
    return `https://picsum.photos/800/1200?random=${i + 1}`;
  });

  activeReading.value = {
    title: manga.title,
    chapterNumber: manga.latestChapter || '1',
    images: sampleImages,
  };
};

const handleSelectManga = (manga) => {
  generateSampleChapter(manga);
};

const closeReader = () => {
  activeReading.value = null;
};
</script>

<template>
  <div class="kura-app" :data-theme="activeTab === 'cinema' ? 'cinema' : 'default'">
    <!-- Top Navigation Bar -->
    <header class="app-header">
      <div class="header-inner container">
        <!-- Logo Brand -->
        <a href="/" class="brand-link" :title="BRAND.tagline">
          <img
            src="/assets/branding/kura-logo-horizontal.svg"
            alt="Kura"
            class="brand-logo-img"
          />
        </a>

        <!-- View Switcher Tabs -->
        <nav class="nav-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'manga' }"
            @click="activeTab = 'manga'"
          >
            📚 {{ I18N.nav.manga }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'cinema' }"
            @click="activeTab = 'cinema'"
          >
            🎬 {{ I18N.nav.cinema }}
          </button>
        </nav>

        <!-- Right Quick Controls -->
        <div class="header-actions">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="I18N.nav.searchPlaceholder"
              class="search-input"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-main container">
      <!-- MANGA STOREHOUSE VIEW -->
      <section v-if="activeTab === 'manga'" class="view-section">
        <div class="section-heading">
          <h2 class="section-title">Khazanah Komik Terbaru</h2>
          <p class="section-subtitle">
            Koleksi manga, manhwa Korea, dan manhua China tersimpan aman di server pribadi Anda.
          </p>
        </div>

        <!-- Responsive Card Grid (8pt Framework) -->
        <div class="manga-grid">
          <MangaCard
            v-for="manga in sampleMangaList"
            :key="manga.slug"
            :manga="manga"
            @select="handleSelectManga"
          />
        </div>
      </section>

      <!-- CINEMA STREAMING VIEW -->
      <section v-else class="view-section">
        <div class="section-heading">
          <h2 class="section-title">Sinema Streaming Video</h2>
          <p class="section-subtitle">
            Pemutaran video berkualitas tinggi dengan sistem proteksi isolasi iklan 3-Tier.
          </p>
        </div>

        <div class="cinema-empty-banner">
          <p class="empty-text">
            Siap diintegrasikan dengan modul scraper <strong>NekoPoi</strong>, <strong>Hentai.tv</strong>, dan <strong>Eporner</strong>.
          </p>
          <button class="cta-btn" @click="activeTab = 'manga'">
            Kembali ke Khazanah Manga
          </button>
        </div>
      </section>
    </main>

    <!-- Fullscreen Manga Virtual Reader (Opened on click) -->
    <MangaReader
      v-if="activeReading"
      :title="activeReading.title"
      :chapter-number="activeReading.chapterNumber"
      :images="activeReading.images"
      @close="closeReader"
      @next-chapter="alert('Bab selanjutnya!')"
      @prev-chapter="alert('Bab sebelumnya!')"
    />
  </div>
</template>

<style scoped>
.kura-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--kura-bg);
  transition: background-color var(--transition-normal);
}

/* Header */
.app-header {
  position: sticky;
  top: 0;
  height: var(--header-height);
  background-color: rgba(23, 24, 28, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--kura-border-subtle);
  z-index: 100;
}

[data-theme="cinema"] .app-header {
  background-color: rgba(28, 23, 20, 0.92);
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.brand-link {
  display: flex;
  align-items: center;
}

.brand-logo-img {
  height: 38px;
  width: auto;
}

/* Nav Tabs */
.nav-tabs {
  display: flex;
  gap: var(--space-2);
  background-color: var(--kura-surface);
  padding: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--kura-border-subtle);
}

.tab-btn {
  padding: var(--space-1) var(--space-4);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--kura-text-muted);
  transition: all var(--transition-fast);
}

.tab-btn.active {
  background-color: var(--kura-accent);
  color: var(--kura-text-inverse);
}

/* Search */
.header-actions {
  display: flex;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--kura-surface);
  border: 1px solid var(--kura-border-strong);
  border-radius: var(--radius-md);
  padding: 6px var(--space-3);
  width: 240px;
}

.search-icon {
  font-size: var(--text-xs);
  opacity: 0.7;
}

.search-input {
  background: transparent;
  border: none;
  color: var(--kura-text-primary);
  font-family: inherit;
  font-size: var(--text-xs);
  outline: none;
  width: 100%;
}

.search-input::placeholder {
  color: var(--kura-text-muted);
}

/* Main */
.app-main {
  flex: 1;
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.section-heading {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--kura-text-primary);
  letter-spacing: -0.01em;
}

.section-subtitle {
  font-size: var(--text-sm);
  color: var(--kura-text-muted);
  margin-top: 4px;
}

/* Responsive Manga Grid */
.manga-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .manga-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .manga-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-6);
  }
}

@media (min-width: 1200px) {
  .manga-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Cinema View */
.cinema-empty-banner {
  background-color: var(--kura-surface);
  border: 1px dashed var(--kura-border-strong);
  border-radius: var(--radius-lg);
  padding: var(--space-12) var(--space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.empty-text {
  color: var(--kura-text-muted);
  max-width: 480px;
}

.cta-btn {
  background-color: var(--kura-accent);
  color: var(--kura-text-inverse);
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
}
</style>
