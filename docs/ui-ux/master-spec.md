# Master UI/UX Specification: Kura

Dokumen ini adalah cetak biru teknis resmi untuk perombakan UI/UX Kura (aplikasi self-hosted pembaca manga dan streaming video) berdasarkan audit menyeluruh, ekstraksi pola modern (MangaDex, Tachiyomi, YouTube, 21st.dev), serta 22 dokumen spesifikasi arsitektur Noctra.

---

## 1. Prinsip Desain & Identitas Visual

- **Metodologi**: *Study → Extract → Adapt → Unify*.
  - Meniru kepadatan informasi dan utilitas dari platform teruji (MangaDex, YouTube, Doujindesu), namun membuang kekacauan visual (tanpa iklan, tanpa popunder, tanpa styling Web 2.0 yang usang).
- **Estetika**: *Sleek Modern Glassmorphism & High-Density Dark Mode*.
- **Aturan Performa**:
  - Semua animasi **100% berbasis CSS GPU Compositing** (`transform` & `opacity`).
  - Nol animasi berbasis layout reflow (`width`, `height`, `margin`, `padding`, `top`, `left` dilarang dianimasikan).
  - Target perangkat: Lancar 60 FPS di laptop dan smartphone berkapasitas RAM 8GB atau lebih rendah.
  - Mendukung penuh preferensi sistem `@media (prefers-reduced-motion: reduce)`.

---

## 2. Arsitektur Responsif: Adaptive Hybrid Shell

Alih-alih membuat dua situs web terpisah yang menyulitkan pemeliharaan, Kura menggunakan **1 Logika & State Terpadu** (Vue 3 Composables) dengan **2 Cangkang Navigasi Adaptif**:

```
                              ┌──────────────────────────────┐
                              │     CORE LOGIC & STATE       │
                              │ (Scraper API, IndexedDB, PWA)│
                              └──────────────┬───────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
         [ DESKTOP SHELL (>= 768px) ]                  [ MOBILE SHELL (< 768px) ]
    • Sidebar Kiri YouTube (240px <-> 68px)        • Floating Frosted Glass Dock (Bawah)
    • Topbar Bersih khusus Omnisearch (Ctrl+K)     • Swipeable Bottom Sheet Drawer
    • Video Theater Mode (Split 70/30)             • Sticky Mini-Player on Scroll
    • Reader: Support Double-Page Spread           • Reader: Webtoon Strip & Tap Zones
```

---

## 3. Sistem Token Desain (Design Tokens)

Implementasi menggunakan CSS Custom Properties murni tanpa dependensi runtime berat:

### A. Palet Tema

| Token | Sumi Charcoal (Default) | Cinema Amber | AMOLED True Black | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-base` | `#0E0F12` | `#110D0A` | `#000000` | Latar belakang viewport utama |
| `--bg-surface` | `#17181C` | `#1C1714` | `#0A0A0A` | Permukaan kartu, sidebar, panel |
| `--bg-elevated` | `#22242A` | `#26201B` | `#141414` | Hover item, modal, menu popover |
| `--border-subtle` | `rgba(255, 255, 255, 0.07)` | `rgba(255, 200, 150, 0.08)`| `rgba(255, 255, 255, 0.12)` | Border pemisah & kartu |
| `--border-focus` | `rgba(255, 107, 0, 0.45)` | `rgba(245, 158, 11, 0.5)` | `rgba(255, 107, 0, 0.6)` | Fokus input pencarian & tombol |
| `--accent-primary`| `#FF6B00` | `#F59E0B` | `#FF7A1A` | Warna oranye identitas Kura |
| `--accent-glow` | `rgba(255, 107, 0, 0.16)` | `rgba(245, 158, 11, 0.16)`| `rgba(255, 107, 0, 0.22)` | Efek cahaya lembut elemen aktif |
| `--text-primary` | `#F4F4F6` | `#FBF7F0` | `#FFFFFF` | Teks heading & judul komik |
| `--text-secondary`| `#9CA3AF`| `#A8A29E` | `#A1A1AA` | Sinopsis & chapter list |
| `--text-muted` | `#636674` | `#6E665E` | `#71717A` | Metadata waktu & teks non-aktif |

### B. Tipografi & Skala
- **Font Utama**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Font Angka / Metrik**: Font monospace sistem (`JetBrains Mono`, `ui-monospace`, `monospace`) untuk indikator chapter (`Ch. 142`), resolusi video (`1080p`), dan durasi (`24:15`).
- **Skala Ukuran**:
  - `text-2xs`: `10px` (Micro-tag genre & kategori).
  - `text-xs`: `11px` (Badge chapter, durasi video).
  - `text-sm`: `13px` (Judul komik 2-baris, label menu).
  - `text-base`: `14px` (Sinopsis, teks input).
  - `text-lg`: `16px` (Sub-heading seksi beranda).
  - `text-xl`: `20px` (Judul layar & judul dialog).

### C. Timing Animasi & Easing (60 FPS)
- `--ease-spring`: `cubic-bezier(0.16, 1, 0.3, 1)` (Transisi drawer, modal, floating dock).
- `--ease-out`: `cubic-bezier(0, 0, 0.2, 1)` (Micro-lift hover kartu dan tombol).
- `--duration-tap`: `120ms` (Umpan balik sentuhan).
- `--duration-normal`: `180ms` (Hover kartu dan filter chip).
- `--duration-sheet`: `250ms` (Buka/tutup bottom sheet drawer).

---

## 4. Sistem Ikonografi (Icon Pack)

- **Keputusan**: Mengadopsi **Lucide Icons** (`@lucide/vue-next`).
- **Aturan**: Menghapus seluruh emoji teks OS (`📖`, `🎬`, `📚`, `⚙️`, `📥`) untuk mencegah inkonsistensi rendering visual antar sistem operasi (Windows, Android, iOS).
- **Daftar Pemetaan Ikon Utama**:
  - Navigasi Home: `Home`
  - Navigasi Manga: `BookOpen`
  - Navigasi Sinema: `Clapperboard` / `Film`
  - Navigasi Pustaka: `Bookmark` / `Library`
  - Navigasi Unduhan: `ArrowDownCircle`
  - Navigasi Pengaturan: `Settings`
  - Pencarian Global: `Search`
  - Mode Baca: `Columns` (Double), `Rows` (Webtoon), `FileText` (Single)
  - Indikator Server/Resolusi: `Server`, `Tv`, `Sparkles`
  - Aksi Unduh: `Download`, `CheckCircle2` (Tersimpan), `Loader2` (Mengunduh)

---

## 5. Spesifikasi Komponen UI Utama

### A. Desktop Sidebar (Inspirasi: YouTube)
- **Dimensi**:
  - Mode Terbuka (Expanded): Lebar `240px`, padding `12px 8px`.
  - Mode Ciut (Collapsed): Lebar `68px`, ikon terpusat di tengah dengan tooltip hover instan.
- **Micro-Interaction**: Garis aksen oranye `3px` di sisi kiri saat item aktif, disertai latar kapsul `rgba(255, 107, 0, 0.12)`.

### B. Mobile Floating Glass Dock (Inspirasi: iOS Dynamic Island & Raycast)
- **Dimensi**: Melayang di bagian bawah dengan `bottom: calc(12px + env(safe-area-inset-bottom))`, lebar `calc(100% - 32px)` (maksimal `420px`), tinggi `58px`.
- **Material**: `rgba(18, 19, 23, 0.88)` dengan `backdrop-filter: blur(20px) saturate(180%)` dan border `1px solid rgba(255, 255, 255, 0.1)`.
- **Sliding Indicator**: Satu kapsul oranye halus yang meluncur (`transform: translateX(...)`) saat berpindah tab.

### C. Kartu Manga (Manga Card)
- **Aspek Rasio**: `3 : 4.5` (Proporsi cover komik Jepang).
- **Struktur**:
  - Sudut melengkung `10px`, border subtle `1px solid rgba(255, 255, 255, 0.07)`.
  - Badge tipe di pojok kiri atas (contoh: `DOUJIN`, `MANGA`, `MANHWA`).
  - Badge chapter terbaru di pojok kanan bawah menempel pada gradasi hitam dasar (contoh: `Ch. 84`).
  - Efek hover desktop: Micro-lift `translateY(-3px) scale(1.015)` dengan transisi `180ms ease-out`.

### D. Kartu Video (Cinema Card)
- **Aspek Rasio**: `16 : 9` (Widescreen landscape).
- **Struktur**: Badge durasi dan resolusi di pojok kanan bawah (contoh: `24:15` | `HD`). Micro progress bar di dasar thumbnail jika video sudah pernah ditonton.

### E. Lembar Detail & Chapter List
- **Desktop**: Dialog pop-in elegan (`max-width: 780px`) dengan latar belakang backdrop blur.
- **Mobile**: **Bottom Sheet Drawer** (`height: 85vh`) dengan pegangan gesture drag-down untuk menutup.
- **Daftar Chapter**: Kepadatan tinggi (tinggi baris `42px`), tombol sortir urutan (Asc/Desc), teks redup untuk chapter yang sudah selesai dibaca, serta tombol unduh offline IndexedDB.

### F. Layar Baca (Reader Engine)
- **3 Mode Baca**:
  1. *Webtoon (Long Strip)*: Scroll vertikal rapat tanpa jeda.
  2. *Single Page*: Tampilan satu halaman dengan sentuhan kiri/kanan.
  3. *Double Page*: Tampilan dua halaman bersisian untuk layar desktop/tablet.
- **Zonasi Sentuhan (Touch Zones)**:
  - 30% area tengah: Memunculkan/menyembunyikan toolbar atas dan bilah navigasi bawah.
  - 35% area kiri: Halaman sebelumnya.
  - 35% area kanan: Halaman berikutnya.
- **Micro-Progress Bar**: Garis tipis `3px` di bagian paling bawah layar pembaca, menampilkan progres halaman tanpa menghalangi visual komik.

### G. Layar Video Player (Theater Split 70/30)
- **Desktop**:
  - Kolom kiri (70%): Pemutar video iframe anti-popunder sandbox.
  - Kolom kanan (30%): Daftar pemilihan server, resolusi, dan episode terkait yang dapat di-scroll mandiri.
- **Mobile**: Video player sticky menempel di bagian atas saat pengguna men-scroll daftar episode di bawahnya.

---

## 6. Sistem Dev-Mode / Masking Sensor NSFW (Blueprint Noctra)

Sesuai spesifikasi `Dokumentasi-Noctra/placeholder-svg/`:

### A. Aset Masking Lokal
1. `placeholder-cover.svg` (Aspek rasio 3:4.5) → Menggantikan sampul manga/komik.
2. `placeholder-thumbnail.svg` (Aspek rasio 16:9) → Menggantikan thumbnail video.
3. `placeholder-page.svg` (Proporsi lembar baca) → Menggantikan lembaran gambar pada reader.

### B. Mekanisme Aktivasi
- Diaktifkan melalui:
  1. Akses URL: `/mode-pengembangan`
  2. Query string: `?dev=1` atau `?nsfw_mask=1`
  3. Tombol toggle switch di menu **Pengaturan (Settings)**.
- Saat aktif:
  - Gambar tidak memanggil tautan NSFW asli dari penyedia web scraper eksternal.
  - Gambar langsung me-render SVG placeholder lokal, sementara metadata (judul, chapter, sinopsis, nomor halaman) tetap berfungsi 100% untuk kebutuhan pengetesan.

---

## 7. Status Roadmap Proyek

- **Fase 1: Audit & Bug Investigation** (SELESAI)
- **Fase 2: Riset Referensi & Ekstraksi Mikro** (SELESAI)
- **Fase 3: Sintesis & Master Dokumen Spesifikasi** (SELESAI - Ditandai dengan dokumen ini)
- **Fase 4: Fondasi Desain & Token Sistem** (BERIKUTNYA)
  - Pemasangan pustaka Lucide icons.
  - Pembuatan file CSS tokens & utilitas tema.
  - Implementasi aset SVG masking & dev-mode state toggle.
  - Pembuatan Shell Desktop (Sidebar) & Mobile (Floating Dock).
- **Fase 5: Rekonstruksi View & Komponen** (BERIKUTNYA)
  - Pembaruan Grid Manga & Video.
  - Rekonstruksi Detail Modal & Bottom Sheet.
  - Rekonstruksi Reader Engine (3 mode) & Video Theater (70/30).
  - Integrasi Pustaka & Meteran Kuota IndexedDB.
- **Fase 6: Audit Akhir, Polish & Validasi Responsif** (BERIKUTNYA)
  - Uji performa 60 FPS pada profil RAM 8GB.
  - Uji kesiapan PWA, Cloudflare Tunnel, dan Docker container.
