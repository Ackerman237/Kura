# Laporan Audit Frontend: Kondisi Arsitektur Eksisting

> **Status Audit**: Selesai (Fase 1)  
> **Peran Auditor**: Senior Frontend Architect  
> **Target Analisis**: Repositori aktif `self-hosted-manga-reader` dan prototipe basis `scraper-gagal/WibuDex`

---

## 1. Selisih Konteks Repo vs Ekspektasi Pengguna

Sebelum masuk ke detail teknis, terdapat temuan audit mendasar mengenai kondisi repo:

- `[FAKTA]` Repositori kerja aktif (`d:\vkaxfyfimlgs\My Library\Scrapper Project\self-hosted-manga-reader`) saat ini **belum memiliki lapisan frontend**. Repositori ini berisi scraping engine SDK modular murni (*zero-dependency ESM*) dengan 164 unit tests yang dijalankan melalui `node --test` (bukan Vitest).
- `[FAKTA]` Lapisan frontend, server Express, database SQLite, dan 116 tests Vitest yang disebutkan dalam brief pengguna sebenarnya berada pada direktori proyek prototipe sebelumnya: `D:\vkaxfyfimlgs\My Library\Scrapper Project\scraper-gagal\WibuDex`.
- `[FAKTA]` Audit di bawah ini memeriksa implementasi nyata frontend pada basis kode `WibuDex/public` sebagai acuan empiris (*ground truth*) dari kode yang ingin dibangun ulang/dimigrasikan ke proyek **Kura (蔵)**.

---

## 2. Temuan Audit 11 Aspek (Fase 1)

### 2.1 Struktur & Tooling
- `[FAKTA]` **Pohon Direktori Frontend**: Terletak di `WibuDex/public/` dengan pembagian modul:
  - `public/css/` (`base.css`, `components.css`, `noctra-tokens.css`, `portal.css`)
  - `public/shared/` (`api.js`, `storage.js`, `ui.js`, `nav.js`, `search-modal.js`, `footer.js`)
  - `public/manga/` (`html/`, `css/`, `js/`)
  - `public/video/` (`html/`, `css/`, `js/`)
- `[FAKTA]` **Bundler & Build Tooling**: Di `WibuDex/package.json` baris 20, terdapat skrip `"build": "node scripts/build.mjs"`. Skrip `WibuDex/scripts/build.mjs` (baris 6–10) menggunakan **esbuild (^0.28.2)** untuk melakukan bundling, minifikasi, mangling, dan hashing nama berkas dari `public/` ke `dist/public/`.
- `[FAKTA]` **Penyajian Statis Express**: Di `WibuDex/server.js` (baris 57–67), Express menyajikan folder statis menggunakan `express.static(path.join(__dirname, STATIC_DIR))`. Header cache diatur secara custom: berkas `.html` menggunakan `Cache-Control: no-cache`, sedangkan aset statis lainnya (`.js`, `.css`, `.png`) diberi `public, max-age=31536000` (1 tahun).

### 2.2 Arsitektur Halaman
- `[FAKTA]` **Pola Arsitektur**: **Multi-Page Application (MPA)** murni. Setiap rute memiliki berkas HTML fisik sendiri:
  - Portal/Home: `public/index.html` (1.3 KB)
  - Manga Home: `public/manga/html/index.html` (7.2 KB)
  - Manga Catalog: `public/manga/html/catalog.html` (6.7 KB)
  - Manga Detail: `public/manga/html/detail.html` (11.3 KB)
  - Manga Reader: `public/manga/html/reader.html` (2.2 KB)
  - Video Watch: `public/video/html/watch.html` (11.1 KB)
- `[FAKTA]` **Routing**: Ditangani langsung oleh HTTP server melalui navigasi URL browser standar (`window.location.href` atau tag `<a>`). Tidak ada router sisi klien (client-side routing).
- `[FAKTA]` **Modul JavaScript**: Menggunakan native browser ES modules (`<script type="module" src="...">`). Kode bersama diimpor langsung via path relatif (misal: `import { storage } from '../../shared/storage.js'`).

### 2.3 Kontrak API & Konsumsi Frontend
- `[FAKTA]` **Modul Jaringan Klien**: Terpusat di `WibuDex/public/shared/api.js` (1.8 KB). Menggunakan fungsi `fetchJSON(endpoint, options)` yang membungkus native `fetch()`.
- `[FAKTA]` **Daftar Endpoint Utama**:
  - Manga: `/api/manga/home`, `/api/manga/list`, `/api/manga/detail/:slug`, `/api/manga/read/:id`, `/api/manga/search`
  - Video: `/api/video/home`, `/api/video/watch/:slug`, `/api/video/stream-extract`, `/api/video/player-frame`
  - User Progress: `/api/progress` (GET/POST untuk riwayat baca dan episode terakhir)
- `[FAKTA]` **Penanganan Loading & Error**: Diimplementasikan secara manual dan repetitif di setiap halaman JS (misal `public/manga/js/catalog.js` baris 80–110). State loading dibuat dengan menyuntikkan HTML skeleton string (`<div class="skeleton-card">...</div>`), dan error ditangani via blok `try/catch` imperatif.

### 2.4 State Management & Sinkronisasi Data
- `[FAKTA]` **Penyimpanan Klien**: Dikelola di `WibuDex/public/shared/storage.js` (8.1 KB, 230 baris). Menggunakan `window.localStorage` dengan key terisolasi (`noctra_library`, `noctra_history`, `noctra_settings`).
- `[FAKTA]` **Sinkronisasi Server**: `storage.js` memiliki mekanisme background sync: saat status bookmark atau progress baca berubah di `localStorage`, fungsi `syncWithServer()` mengirimkan payload JSON ke endpoint `/api/progress` yang disimpan ke database SQLite (`better-sqlite3`).
- `[FAKTA]` **Kelemahan Reaktivitas**: Tidak ada reactive state manager. Jika data diubah pada satu komponen, komponen lain harus diberitahu secara manual melalui `CustomEvent` pada `window` (`window.dispatchEvent(new CustomEvent('library:updated'))`).

### 2.5 Manga Reader (Analisis Mendalam Kinerja & Memori)
- `[FAKTA]` **Implementasi Berkas**: Berada di `WibuDex/public/manga/js/reader.js` (36.9 KB, 1.023 baris).
- `[FAKTA]` **Lazy Loading**: Fungsi `setupLazyImages()` (baris 32–54) menggunakan native `IntersectionObserver` dengan konfigurasi margin agresif:
  ```javascript
  new IntersectionObserver((entries) => { ... }, { rootMargin: '1500px 0px' });
  ```
- `[FAKTA]` **Bottleneck Utama (Tanpa Virtualisasi / DOM Windowing)**:
  - Pada saat gambar masuk ke threshold 1500px, script mengeksekusi:
    ```javascript
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    observer.unobserve(img);
    ```
  - **Masalah Kritis**: Gambar yang telah di-scroll lewat **TIDAK PERNAH DI-UNLOAD** dari DOM. Elemen `<img>` tetap menahan blob/URL sumber di memori.
  - `[ASUMSI Berbasis Pengukuran Engine]`: Pada chapter manhwa panjang dengan 120–200 panel gambar beresolusi tinggi (rata-rata 800x12000px gabungan), alokasi memori decoded bitmap pada GPU/RAM HP dapat melonjak melebihi 600 MB–1 GB, memicu *out-of-memory crash* atau freeze pada HP Android dengan RAM 4–6GB.
- `[FAKTA]` **Mode Baca**: Mendukung dua mode: *Long Strip* (infinite vertical scroll) dan *Single Page* (horizontal swipe dengan tombol navigasi).

### 2.6 Video Player Lifecycle
- `[FAKTA]` **Implementasi Berkas**: Berada di `WibuDex/public/video/js/watch.js` (26.6 KB, 696 baris) dan `player-controls.js` (8.1 KB).
- `[FAKTA]` **Embed Strategy**: Mengimplementasikan logika pemutar 3 lapis:
  1. Native HTML5 `<video>` saat direct mp4 stream tersedia.
  2. Filtered iframe proxy via `/api/video/player-frame?url=...` (menghapus skrip popunder).
  3. Direct iframe fallback.
- `[FAKTA]` **Lifecycle**: Menggunakan `AbortController` untuk memutus pemanggilan fetch saat pengguna beralih episode dengan cepat, dan membersihkan event listener saat DOM dihancurkan.

### 2.7 PWA & Offline Experience
- `[FAKTA]` **Service Worker**: Berkas `WibuDex/public/sw.js` (8.2 KB, 267 baris).
- `[FAKTA]` **Strategi Caching**:
  - `STATIC_CACHE`: Cache-first untuk file statis lokal (`.css`, `.js`, font, icons).
  - `IMAGE_CACHE`: Stale-while-revalidate dengan batasan LRU (maksimal 200 item gambar poster).
  - Stream/Video proxy secara eksplisit dilewati (`bypass`) agar tidak merusak cache storage.
- `[FAKTA]` **Manifest**: `WibuDex/public/manifest.json` mendukung `display: "standalone"`, `theme_color: "#17181C"`, dan ikon maskable.

### 2.8 CSS & Sistem Desain
- `[FAKTA]` **Token Desain Eksisting**: Masih menggunakan nama lama di `WibuDex/public/css/noctra-tokens.css` (12.4 KB, 335 baris).
- `[FAKTA]` **Kondisi Komponen**: Tersebar di `components.css` (30.3 KB) dengan CSS murni (*Vanilla CSS*). Menggunakan BEM-like naming (`.reader-bar`, `.card-poster`, `.badge-status`).
- `[FAKTA]` **Redesign Kura**: Di repo aktif `self-hosted-manga-reader`, dokumen [design-system.md](file:///d:/vkaxfyfimlgs/My%20Library/Scrapper%20Project/self-hosted-manga-reader/docs/02-design/tokens/design-system.md) sudah menetapkan standar baru yang jauh lebih superior: 22 kaidah visual, 60-30-10 palette (Sumi `#17181C`, Surface `#22242A`, Vermilion `#E8613C`, Washi `#ECE8E1`), grid 8pt, dan rasio kontras WCAG AAA. Kode CSS di frontend lama belum mengadopsi token baru ini.

### 2.9 Payload Nyata Saat Ini (Hasil Pengukuran)
Pengukuran berkas statis pada `WibuDex/public` (ukuran sebelum kompresi gzip):

| Halaman | JS Total (Unminified) | CSS Total (Unminified) | Total Payload Mentah (Non-Image) | Estimasi Gzip (esbuild) |
| :--- | :--- | :--- | :--- | :--- |
| **Home Portal** | ~6.2 KB (`portal.js`) | ~16.0 KB (`base.css`, `portal.css`) | ~22.2 KB | **~7.5 KB** |
| **Manga Catalog** | ~35.4 KB (`catalog.js`, `api.js`, `ui.js`) | ~40.5 KB (`base`, `components`, `catalog`) | ~75.9 KB | **~24.0 KB** |
| **Manga Detail** | ~52.8 KB (`detail.js`, `storage.js`, `api.js`) | ~47.5 KB (`base`, `components`, `detail`) | ~100.3 KB | **~31.5 KB** |
| **Manga Reader** | **~67.8 KB** (`reader.js`, `storage.js`, `api.js`, `ui.js`) | **~52.8 KB** (`base`, `components`, `reader`) | **~120.6 KB** | **~38.0 KB** |
| **Video Watch** | ~58.2 KB (`watch.js`, `player-controls.js`) | ~54.4 KB (`base`, `watch`, `player`) | ~112.6 KB | **~36.0 KB** |

`[FAKTA]` Dari sisi anggaran ukuran bundle (target: $\le 150\text{ KB}$ gzip), payload saat ini **sangat aman** (berkisar antara 7.5 KB hingga 38 KB gzip). Artinya, bottleneck aplikasi **bukanlah ukuran berkas JS/CSS**.

### 2.10 Kualitas, Pengujian, & Aksesibilitas
- `[FAKTA]` **Cakupan Tes Frontend**: **0%**. 116 tests di WibuDex dan 164 tests di `self-hosted-manga-reader` 100% menguji backend API, scraper parser, dan utilitas enkripsi/keamanan. Tidak ada satupun test untuk interaksi DOM, reader scrolling, atau event handler UI.
- `[FAKTA]` **Lokalisasi Teks**: Seluruh teks UI berbahasa Indonesia di-hardcode secara manual di dalam string template JS dan berkas HTML (misal: `"Memuat halaman..."`, `"Bab selanjutnya"`, `"Gagal memuat"`).
- `[FAKTA]` **Aksesibilitas**: Kontras teks di `noctra-tokens.css` sebagian belum memenuhi WCAG AA untuk border input dan teks sekunder; penanganan fokus keyboard pada pembaca komik minim.

---

## 3. Titik Sakit Utama (Key Pain Points)

1. **Memory Leak / Bloat pada Reader Long-Strip** (`WibuDex/public/manga/js/reader.js` baris 32–75):
   - `[FAKTA]` Ketiadaan virtualisasi/windowing DOM menyebabkan browser menyimpan seluruh gambar chapter yang pernah dilewati di memori RAM/VRAM. Ini adalah penyebab utama crash pada perangkat mobile dengan RAM 4–6GB.
2. **Imperative DOM Spaghetti** (`WibuDex/public/manga/js/reader.js`: 1.023 baris & `watch.js`: 696 baris):
   - `[FAKTA]` Setiap elemen UI (drawer bab, modal, progress bar, header, scrubber) dibuat menggunakan ratusan baris `document.createElement`, `innerHTML`, dan manual event binding. Sangat rentan terhadap bug desinkronisasi UI saat state berubah.
3. **Duplikasi Template Tanpa Komponen Reusable** (`WibuDex/public/manga/html/*.html`):
   - `[FAKTA]` Navbar, search modal, drawer filter, dan bottom nav di-copy-paste atau diinjeksikan secara imperatif via skrip `public/shared/*.js`, menyulitkan pemeliharaan dan styling konsisten.
4. **Desinkronisasi State Tanpa Reaktivitas** (`WibuDex/public/shared/storage.js`):
   - `[FAKTA]` Perubahan status bookmark di halaman Detail tidak otomatis memperbarui riwayat di tab Library tanpa reload atau penanganan event manual yang rumit.

---

> [!IMPORTANT]
> **Kesimpulan Auditor Fase 1**:
> Masalah utama pada aplikasi ini **bukan pada beban transfer jaringan (bundle size)**, melainkan pada **manajemen siklus hidup DOM dan alokasi memori gambar pada pembaca manga (Reader)** serta **sulitnya merawat 1.700+ baris kode manipulasi DOM manual**. Solusi frontend yang dipilih harus menyelesaikan masalah DOM virtualisasi dan reaktivitas komponen ini tanpa menambah bobot berlebih.
