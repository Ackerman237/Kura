/**
 * Kura (蔵) — Centralized Brand & String Localization (Indonesian)
 * No hardcoded strings in components to ensure maintainability and theming.
 */

export const BRAND = {
  name: 'Kura',
  kanji: '蔵',
  tagline: 'Khazanah bacaan manga dan tontonan sinema mandiri.',
  subline: 'Self-hosted media storehouse',
  version: '1.0.0',
};

export const I18N = {
  nav: {
    manga: 'Khazanah Manga',
    cinema: 'Sinema Video',
    library: 'Perpustakaan',
    history: 'Riwayat',
    searchPlaceholder: 'Cari manga, manhwa, atau anime...',
  },
  reader: {
    backToDetail: 'Kembali ke Detail',
    nextChapter: 'Bab Selanjutnya',
    prevChapter: 'Bab Sebelumnya',
    chapterList: 'Daftar Bab',
    loadingChapter: 'Menyiapkan bab komik...',
    loadingPage: (cur, tot) => `Memuat halaman ${cur}/${tot}...`,
    errorLoad: 'Gagal memuat halaman komik. Periksa koneksi ke server.',
    retry: 'Coba Lagi',
    modeStrip: 'Mode Gulir Panjang (Webtoon)',
    modePaged: 'Mode Halaman Tunggal',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    fitWidth: 'Paskan Lebar',
  },
  player: {
    directStream: 'Pemutar Bersih (Langsung MP4)',
    proxyStream: 'Pemutar Terproteksi (Anti-Iklan)',
    fallbackIframe: 'Pemutar Sumber Langsung (Fallback)',
    switchSource: 'Ganti Sumber',
    selectEpisode: 'Pilih Episode',
    nextEpisode: 'Episode Selanjutnya',
    prevEpisode: 'Episode Sebelumnya',
    errorStream: 'Aliran video belum tersedia atau server penyedia lambat.',
  },
  card: {
    latest: 'Terbaru',
    views: 'Tayang',
    rating: 'Skor',
    typeManga: 'Manga',
    typeManhwa: 'Manhwa',
    typeManhua: 'Manhua',
    typeDoujin: 'Doujinshi',
  },
  common: {
    close: 'Tutup',
    cancel: 'Batal',
    loading: 'Memuat data...',
    emptyState: 'Belum ada koleksi yang tersimpan di khazanah Anda.',
    explore: 'Jelajahi Sekarang',
  },
};
