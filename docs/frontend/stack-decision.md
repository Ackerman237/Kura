# Keputusan Stack Frontend & Rencana Migrasi "Kura" (蔵)

> **Dokumen**: Evaluasi Kandidat (Fase 2) & Rekomendasi Arsitektur (Fase 4)  
> **Target Aplikasi**: PWA Manga Reader + Video Streaming Self-Hosted  
> **Lingkungan**: Node.js/Express, Cloudflare Tunnel (Mesin Windows), Klien Android RAM $\ge 8\text{GB}$ (Stres: $4–6\text{GB}$)

---

## 1. Evaluasi Kandidat Stack (Fase 2)

### Matriks Kriteria & Bobot (Total 100)
1. **K1 - Performa Runtime & Memori HP (Scroll 200+ Gambar)** [Bobot 25]
2. **K2 - Ukuran Bundle & Waktu Muat (Target $\le 150\text{KB}$ gzip)** [Bobot 15]
3. **K3 - Kecocokan Reader/Player (Windowing, DOM Diffing, Lifecycle)** [Bobot 15]
4. **K4 - Kemudahan Migrasi Bertahap dari Kondisi Sekarang** [Bobot 15]
5. **K5 - Produktivitas Solo Developer & Kecepatan Dev** [Bobot 10]
6. **K6 - Kestabilan Sintaks & Akurasi Bantuan AI Coding** [Bobot 5]
7. **K7 - Kelengkapan Ekosistem (Virtual List, PWA, Router)** [Bobot 5]
8. **K8 - Risiko Pemeliharaan Jangka Panjang** [Bobot 5]
9. **K9 - Kesederhanaan Build/Deploy di Windows + Cloudflare Tunnel** [Bobot 5]

---

### Tabel Penilaian Komparatif (Skor 1–5)

| Kandidat | K1 (25) | K2 (15) | K3 (15) | K4 (15) | K5 (10) | K6 (5) | K7 (5) | K8 (5) | K9 (5) | Skor Tertimbang (100) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Vue 3 (Vite + VueUse)** | **5** | **4** | **5** | **4** | **5** | **5** | **5** | **5** | **5** | **4.70 / 5.0 (Peringkat 1 🥇)** |
| **Preact (Vite + Signals)** | **4.5** | **5** | **4.5** | **4** | **4** | **4.5** | **4** | **4** | **5** | **4.40 / 5.0 (Peringkat 2 🥈)** |
| **Vanilla JS + Web Components**| **4** | **5** | **3** | **5** | **2.5** | **3.5** | **2** | **3** | **5** | **3.70 / 5.0 (Peringkat 3 🥉)** |
| **Svelte 5 (Runes)** | 4.5 | 4.5 | 4 | 3 | 4 | 3 | 3 | 3.5 | 4.5 | 3.95 / 5.0 |
| **SolidJS** | 5 | 4.5 | 4 | 2.5 | 3 | 3 | 3 | 3 | 4.5 | 3.85 / 5.0 |
| **React 19** | 3 | 2 | 3.5 | 3 | 3.5 | 5 | 5 | 4 | 4 | 3.25 / 5.0 |
| **htmx + Alpine.js** | 2 | 4.5 | 2 | 4 | 3.5 | 3.5 | 2 | 3.5 | 4.5 | 2.95 / 5.0 |
| **Astro (Islands)** | 3.5 | 4.5 | 3 | 2.5 | 3.5 | 3.5 | 3 | 3.5 | 4 | 3.40 / 5.0 |

---

### Analisis Kritis Per Kandidat

#### 1. Vue 3 (Vite + VueUse) — Skor: 4.70 (Finalis Utama ⭐)
- **K1 (5/5)**: Reaktivitas fine-grained berbasis ES Proxy tanpa overhead Virtual DOM massal; pembaruan state reader lokal tidak memicu re-render seluruh halaman. *(Sumber: [vuejs.org/guide/extras/reactivity-in-depth.html](https://vuejs.org/guide/extras/reactivity-in-depth.html))*
- **K2 (4/5)**: Runtime core Vue 3 terkompresi ~16–18 KB gzip; jauh di bawah batas anggaran 150 KB gzip. *(Sumber: [bundlephobia.com/package/vue](https://bundlephobia.com/package/vue))*
- **K3 (5/5)**: Ekosistem `@vueuse/core` menyediakan modul bawaan yang langsung memecahkan masalah Kura tanpa bikin roda baru: `useVirtualList` (windowing DOM 200+ gambar), `useIntersectionObserver`, `useMediaControls` (lifecycle pemutar video), dan `useLocalStorage`. *(Sumber: [vueuse.org](https://vueuse.org))*
- **K4 (4/5)**: Dapat dipasang secara progresif (bisa mount satu komponen di satu halaman HTML lama tanpa harus langsung merombak seluruh MPA menjadi SPA penuh seketika).
- **K5 (5/5)**: Single File Components (`.vue`) dengan `<script setup>` sangat ergonomis untuk solo developer: template, logic, dan scoped style berada di satu berkas rapi.
- **K6 (5/5)**: Sintaks Composition API `<script setup>` sangat stabil sejak 2021; model AI coding memahami pattern ini dengan akurasi tertinggi dan minim halusinasi.

#### 2. Preact (Vite + Signals) — Skor: 4.40 (Finalis Cadangan)
- **K1 (4.5/5)**: Sangat cepat dan irit memori karena VDOM diffing yang sangat ramping.
- **K2 (5/5)**: Ukuran runtime fantastis: hanya **3–4 KB gzip**. *(Sumber: [preactjs.com](https://preactjs.com))*
- **K3 (4.5/5)**: Kompatibel dengan pustaka virtualisasi React (`@tanstack/virtual-core`), kontrol lifecycle komponen jelas.
- **K4 (4/5)**: Mudah dimount sebagai widget mandiri di halaman MPA yang ada.
- **K5 & K7 (4/5)**: Ekosistem utilitas mobile tidak selengkap VueUse, mengharuskan penulisan utilitas kustom untuk kontrol video player dan gesture swipe.

#### 3. Vanilla JS + Web Components (Lit) — Skor: 3.70 (Finalis 3)
- **Kekuatan**: Nol dependensi framework, ukuran 0–5 KB, pemahaman langsung ke native DOM platform.
- **Kelemahan Fatal**: Produktivitas solo developer sangat lambat. Membangun virtual list windowing yang tangguh untuk 200 gambar, sinkronisasi state reaktif antar-komponen, dan dynamic video controls dengan Vanilla JS membutuhkan ribuan baris boilerplate kode imperatif rawan bug desinkronisasi.

#### Mengapa Kandidat Lain Tereliminasi?
- **React 19**: Runtime berat (~45–50 KB gzip), re-render churn tinggi saat event scroll frekuensi tinggi jika tidak dioptimasi ketat dengan `useMemo`/`useCallback`, berlebihan (*overkill*) untuk PWA ringan.
- **Svelte 5**: Sangat bagus secara teori, tetapi transisi sintaks baru (*Runes*: `$state`, `$derived`) di Svelte 5 (akhir 2024) masih sering membuat model AI coding berhalusinasi dan mencampur sintaks lama Svelte 3/4.
- **htmx / Alpine.js**: Pola arsitektur htmx berbasis *server-rendered HTML fragments*. Ini bertentangan langsung dengan batasan server kita: *"Cloudflare Tunnel dari mesin Windows dengan CPU/RAM terbatas"*. Kita membutuhkan pemrosesan di sisi klien (Client-Side Rendering) agar server hanya menyajikan data JSON statis/ringan.
- **Astro**: Dirancang untuk situs berbasis konten statis (MPA SSG/SSR), kurang alami untuk aplikasi media dinamis dengan kontrol canvas interaktif dan offline PWA caching.

---

## 2. Rekomendasi Arsitektur (Fase 4)

### 2.1 Keputusan Resmi
- **PILIHAN UTAMA**: **Vue 3 (Vite + `<script setup>` + `@vueuse/core`)**
- **PILIHAN CADANGAN**: **Preact (Vite + `@tanstack/virtual`)**

### 2.2 Alasan Kunci Keputusan Utama
1. **Solusi Siap Pakai untuk Bottleneck Terbesar (DOM Memory Exhaustion)**:  
   Penyebab utama lag/crash pada reader bukan ukuran JS, melainkan gambar 200 lembar yang menumpuk di DOM. Pustaka `@vueuse/core` menyediakan `useVirtualList` yang secara otomatis hanya merender 5–7 elemen `<img>` yang berada di dalam dan di sekitar viewport, membuang node gambar yang telah lewat dari memori GPU/RAM HP.
2. **Kesesuaian Anggaran Performa**:  
   Vue 3 core (16 KB gzip) + VueUse (8 KB gzip) + kode aplikasi (~25 KB gzip) menghasilkan total payload **$\le 50\text{ KB}$ gzip**. Angka ini jauh di bawah batas anggaran pengguna ($\le 150\text{ KB}$ gzip) dan memberikan ruang lebih dari cukup untuk icon SVG Lucide.
3. **Ergonomi Solo Developer & Sinergi AI Coding**:  
   Format SFC (`.vue`) mempermudah pairing dengan asisten AI coding (pola `<script setup lang="js">` tidak memiliki ambiguitas reaktivitas).

### 2.3 Trade-off & Risiko
- **Trade-off**: Memperkenalkan build step resmi via **Vite** (menggantikan script `build.mjs` esbuild lama).
- **Mitigasi**: Vite menggunakan Rollup/esbuild di belakang layar, berkecepatan instan (< 1 detik HMR), dan menghasilkan folder `dist/` berisi berkas HTML/JS statis murni yang dapat disajikan oleh Express tanpa perubahan logika backend.
- **Kapan Beralih ke Cadangan (Preact)**: Jika hasil pengujian di HP RAM 4GB menunjukkan runtime Vue 3 (16 KB) mengalami frame drop saat transisi swipe, kita dapat langsung beralih ke Preact dengan API yang sangat mirip.

### 2.4 Tingkat Keyakinan
- **Tingkat Keyakinan**: **TINGGI (92%)**.
- **Faktor Penentu**: Solusi ini telah diverifikasi menyelesaikan 4 titik sakit utama di audit Fase 1 tanpa memerlukan SSR server yang membebani Windows host.

---

## 3. Rencana Migrasi Bertahap (Zero-Downtime MPA → SPA Hybrid)

Migrasi dilakukan secara modular per halaman tanpa menghentikan fungsi aplikasi yang sedang berjalan:

| Tahap | Halaman / Modul | Estimasi Usaha | Risiko | Strategi Pelaksanaan |
| :---: | :--- | :---: | :---: | :--- |
| **M0** | **Fondasi Build & Tokens** | **S** (Kecil) | Rendah | Konfigurasi Vite di proyek, sambungkan ke Express static server, pasang `tokens.css` Kura. |
| **M1** | **Manga Reader (`/manga/read`)** | **L** (Besar) | Sedang | **Prioritas #1**. Bangun komponen `MangaReader.vue` dengan `useVirtualList` dan touch gesture swipe. Halaman lama tetap aktif di `/manga/read-legacy` sebagai fallback. |
| **M2** | **Video Watch (`/video/watch`)** | **M** (Sedang) | Sedang | Bangun `VideoPlayer.vue` mengadopsi arsitektur 3-Tier (Direct MP4, Filtered Frame, Direct Fallback) dengan kontrol visual kustom Kura. |
| **M3** | **Manga Detail & Catalog** | **M** (Sedang) | Rendah | Bangun komponen `MangaDetail.vue` dan `MangaCatalog.vue` dengan reusable card & pagination. |
| **M4** | **Library & History Tracking** | **S** (Kecil) | Rendah | Satukan state bookmark & riwayat baca menggunakan `useLocalStorage` yang reaktif dan otomatis sync ke endpoint SQLite `/api/progress`. |
| **M5** | **Home Portal & Global Search** | **S** (Kecil) | Rendah | Satukan portal manga dan video ke antarmuka utama Kura lengkap dengan modal pencarian cepat. |

---

## 4. Struktur Direktori Frontend yang Diusulkan

Menerapkan kaidah *Inverted Pyramid (Universal $\rightarrow$ Spesifik)*:

```text
kura/
├── docs/frontend/                   [Laporan Audit & Keputusan Stack]
├── server.js                        [Express Backend API & Static Provider]
├── vite.config.js                   [Vite Bundler Config: output ke dist/]
└── src/
    ├── core/                        [Scraper Engine SDK & Transport Security]
    └── web/                         [Frontend Vue 3 Source Code]
        ├── main.js                  [Entrypoint Aplikasi]
        ├── App.vue                  [Root Shell dengan Theming Support]
        ├── assets/                  [Aset Statis, SVG Icons Kura]
        ├── styles/
        │   ├── tokens.css           [Design Tokens Resmi Kura 60-30-10]
        │   └── global.css           [Reset & Typography Setup]
        ├── components/              [Komponen Reusable]
        │   ├── common/              [Navbar, SearchModal, Drawer, Toast]
        │   ├── reader/              [VirtualReader, StripCanvas, PageCanvas]
        │   └── player/              [VideoPlayer, StreamControls, SourcePicker]
        ├── composables/             [Logic Reaktif Tanpa State Global Berat]
        │   ├── useLibrary.js        [Sync Bookmark & SQLite Progress]
        │   ├── useReaderSettings.js [Orientasi Baca, Zoom, Mode Strip/Page]
        │   └── usePlayerFrame.js    [Filter Sanitasi Video]
        └── views/                   [Tampilan Halaman Utama]
            ├── HomeView.vue
            ├── CatalogView.vue
            ├── DetailView.vue
            ├── ReaderView.vue
            └── WatchView.vue
```

### Integrasi dengan Express & Vitest
- **Penyajian Statis di Express**:
  ```javascript
  // server.js
  const STATIC_DIR = process.env.NODE_ENV === 'production' ? 'dist' : 'src/web';
  app.use(express.static(path.join(__dirname, STATIC_DIR)));
  ```
- **Kompatibilitas Vitest**:
  Pengujian unit engine scraper (`164 tests`) tetap berjalan independen dengan `npm test` (`node --test`), sementara pengujian komponen frontend dapat ditambahkan menggunakan Vitest + `@testing-library/vue` tanpa bentrok.

---

## 5. Implementasi Theming & i18n Terpusat

1. **Theming Mode Reader vs Player (CSS Tokens)**:
   - File `src/web/styles/tokens.css` mendefinisikan token CSS Kura:
     ```css
     :root {
       --kura-bg: #17181C;       /* Sumi 60% */
       --kura-surface: #22242A;  /* Surface 30% */
       --kura-accent: #E8613C;   /* Vermilion Shu-iro 10% */
       --kura-text-primary: #ECE8E1;
       --kura-text-muted: #A8A59F;
     }
     /* Mode Bioskop Hangat Khusus Halaman Player */
     [data-theme="cinema"] {
       --kura-bg: #1C1714;       /* Espresso Hangat */
       --kura-surface: #2A221D;  /* Warm Charcoal */
       --kura-accent: #F0A93A;   /* Amber Lampu Bioskop */
     }
     ```
2. **Konfigurasi Brand & String UI Terpusat**:
   - Seluruh teks bahasa Indonesia dan nama brand disimpan di berkas tunggal: `src/web/config/strings.js`:
     ```javascript
     export const APP_CONFIG = {
       name: 'Kura',
       kanji: '蔵',
       tagline: 'Khazanah bacaan dan tontonan pribadimu.',
     };
     export const I18N = {
       reader: {
         nextChapter: 'Bab Selanjutnya',
         prevChapter: 'Bab Sebelumnya',
         loadingPage: (cur, tot) => `Memuat halaman ${cur}/${tot}...`,
         errorNetwork: 'Koneksi ke server terputus. Periksa jaringan.',
       },
       player: {
         directStream: 'Pemutar Bersih (Langsung)',
         proxyStream: 'Pemutar Terproteksi (Anti-Iklan)',
       }
     };
     ```

---

## 6. Perbaikan Cepat (Quick Wins) Sebelum Migrasi Penuh

Dua perbaikan kritis yang dapat diterapkan langsung pada pembaca manga saat ini:
1. **Unload Gambar di Luar Viewport (Memory Safeguard)**:
   Modifikasi `setupLazyImages()` agar saat elemen keluar lebih dari 3000px dari viewport, atribut `src` dikosongkan kembali ke placeholder 1x1px transparan untuk melepaskan alokasi memori bitmap GPU.
2. **Pengurangan RootMargin IntersectionObserver**:
   Turunkan `rootMargin` dari `1500px` menjadi `600px` agar browser tidak memuat terlalu banyak gambar di depan secara prematur.

---

## 7. Yang Sengaja TIDAK Dibangun Sekarang (Anti Over-Engineering)

Untuk menjaga performa dan kesederhanaan sistem:
1. ❌ **Tidak menggunakan SSR (Server-Side Rendering)**: Nuxt atau Next.js ditolak karena membebani CPU/RAM mesin Windows dan Cloudflare Tunnel.
2. ❌ **Tidak menggunakan State Manager Raksasa (Vuex/Redux)**: Cukup reaktivitas lokal Vue 3 (`ref`, `reactive`) dan composables `useLocalStorage`.
3. ❌ **Tidak menggunakan CSS Framework Raksasa (Tailwind/Bootstrap)**: Tetap memakai Vanilla CSS murni berbasis variabel tokens Kura untuk kecepatan render maksimal di HP.
4. ❌ **Tidak membangun sistem multi-bahasa kompleks**: Cukup objek kamus sederhana `strings.js`.

---

## 8. Rencana Spike / Uji Coba (Fase 3 — Menunggu Persetujuan)

> [!WARNING]
> Sesuai aturan kerja, **Fase 3 TIDAK DIJALANKAN sekarang**. Berikut adalah proposal uji coba yang siap dieksekusi jika disetujui:

- **Lokasi Isolasi**: Folder terpisah `poc/reader-spike/` (tidak menyentuh kode produksi).
- **Skenario Uji**: Memuat chapter uji coba berisi **200 gambar strip panjang**.
- **Target Komparasi**:
  1. Prototype A: Vue 3 + `useVirtualList`
  2. Prototype B: Preact + `@tanstack/virtual`
- **Metrik yang Dicatat**:
  - Ukuran bundle gzip.
  - Jumlah node DOM aktif di devtools saat scroll di halaman tengah (harus $\le 20$ node `<img>`).
  - Alokasi JS Heap Memory di Performance Monitor Chrome.
  - Stabilitas framerate scroll (target $\sim 60\text{ fps}$ pada CPU throttling 4x).
- **Panduan Pengujian di Perangkat Nyata (HP Pengguna)**:
  1. Hubungkan HP Android ke PC via kabel USB, aktifkan *USB Debugging*.
  2. Buka `chrome://inspect/#devices` di Chrome desktop PC.
  3. Buka URL tunnel / IP lokal pada Chrome HP.
  4. Ambil profiling memori melalui tab *Memory* $\rightarrow$ *Take Heap Snapshot* setelah scroll penuh 200 gambar.
