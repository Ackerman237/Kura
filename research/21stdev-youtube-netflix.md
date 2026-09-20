# Riset Referensi Layout Beranda YouTube & Netflix (21st.dev)

Dokumen ini berisi hasil riset dan analisis mendalam terhadap referensi antarmuka 21st.dev untuk mengimplementasikan dua pola beranda unggulan pada proyek Kura:
1. **Pola YouTube Home**: Header pencarian lebar, dual-mode sidebar (icon rail ⇄ drawer penuh via hamburger), pita chips kategori horizontal, grid video 16:9 dengan hover preview, serta rak Shorts 9:16.
2. **Pola Netflix Home**: Fixed icon rail vertikal di sisi kiri, billboard hero editorial dengan backdrop sinematik, serta rak carousel baris poster horizontal bertingkat ("New this week", "Trending Now").

---

## 1. Tabel Pemetaan Bagian Layout → Komponen Kandidat

| Bagian Layout | Komponen Kandidat | Author | URL 21st.dev (.md) | Dependensi npm | Lisensi | Alasan Cocok & Peran |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **YouTube Header** | `Header with Search` | Efferd | [header-with-search.md](https://21st.dev/@efferd/components/header-with-search.md) | `lucide-react` | Unknown | Menampilkan search pill lebar di tengah, tombol mikrofon/shortcut `Ctrl+K`, bell notifikasi, dan avatar profil. |
| **YouTube Header (Alt)** | `Navbar 1` | Preet Suthar | [navbar-1.md](https://21st.dev/@preetsuthar17/components/navbar-1.md) | `lucide-react`, `cva` | Unknown | Navigasi atas yang ringkas dengan logo kiri, search bar fleksibel, dan aksi pengguna kanan. |
| **Sidebar YouTube** | `Sidebar Navbar` | Arihant Jain | [sidebar-navbar.md](https://21st.dev/@arihantcodes_1f7b8c4d/components/navbars/sidebar-navbar.md) | `lucide-react` | Unknown | Mendukung toggle eksplisit icon-only rail ⇄ menu bertingkat berlabel, sangat pas untuk Subscriptions & Playlists. |
| **Sidebar YouTube (Alt)**| `Sidebar` | Manu Arora | [sidebar.md](https://21st.dev/@manuarora700/components/sidebar.md) | `framer-motion` | MIT | Transisi pelebaran rail yang sangat mulus dan estetika high-density dark mode. |
| **Category Chips** | `Chip` | Preet Suthar | [chip.md](https://21st.dev/@preetsuthar17/components/chip.md) | `lucide-react`, `cva` | Unknown | Varian chip pill aktif (kontras terang/putih), outline netral, dan state terfilter untuk pita kategori YouTube. |
| **Category Chips (Alt)** | `Filter Grid` | Özer (interior.dev) | [filter-grid.md](https://21st.dev/@ddoemonn/components/filter-grid.md) | `motion` | MIT | Segmented control chips yang mengatur reflow dan animasi filter pada konten grid di bawahnya. |
| **Video Grid (16:9)** | `HoverPlayCard` | Ruixen UI | [hover-play-card.md](https://21st.dev/@ruixen.ui/components/hover-play-card.md) | `lucide-react`, `framer-motion` | Unknown | Kartu video interaktif yang memutar cuplikan video bisu (muted loop) otomatis saat kursor berada di atas kartu. |
| **Video Grid (Alt)** | `Video Thumbnail Player` | Ravi Katiyar | [video-thumbnail-player.md](https://21st.dev/@ravikatiyar162/components/video-thumbnail-player.md) | `lucide-react` | Unknown | Tata letak thumbnail 16:9 profesional dengan badge durasi di pojok kanan bawah, avatar channel, dan judul 2-baris. |
| **Rak Shorts (9:16)** | `Stories Carousel` | Hayden Bleasel | [stories-carousel.md](https://21st.dev/@haydenbleasel/components/stories-carousel.md) | `clsx`, `tailwind-merge` | Unknown | Sangat ringan; format strip kartu vertikal 9:16 ideal untuk rak Shorts dengan geser horizontal fluida. |
| **Rak Shorts (Alt)** | `Card Fan Carousel` | Aayush Duhan | [card-fan-carousel.md](https://21st.dev/@aayush-duhan/components/card-fan-carousel.md) | `motion`, `lucide-react` | MIT | Alternatif presentasi vertikal Shorts dengan transisi fokus tengah yang dinamis. |
| **Menu Kartu (3 Dots)** | `Dropdown Menu` | shadcn | [dropdown-menu.md](https://21st.dev/@shadcn/components/dropdown-menu.md) | `@radix-ui/react-dropdown-menu` | MIT | Popover aksi cepat kartu: "Simpan ke Tonton Nanti", "Tambahkan ke Playlist", "Bagikan", "Sembunyikan". |
| **Overlay Drawer** | `Sheet` | shadcn | [sheet.md](https://21st.dev/@shadcn/components/sheet.md) | `@radix-ui/react-dialog` | MIT | Backdrop gelap semi-transparan dengan slide-in panel saat sidebar dibuka penuh menutupi konten. |
| **Netflix Icon Rail** | `Dock` | shadcn / community | [dock.md](https://21st.dev/community/components/s/dock.md) | `motion` | MIT | Rail vertikal ramping tetap di sisi kiri layar dengan susunan ikon navigasi utama (Search, Home, TV, Trending). |
| **Netflix Hero** | `Hero Carousel` | Crafter UI | [hero-carousel.md](https://21st.dev/@crafterui/components/hero-carousel.md) | `framer-motion` | MIT | Billboard editorial layar penuh dengan background re-grading dinamis, kartu fokus, tombol Play dan Watch Trailer. |
| **Netflix Media Rows** | `Carousel` | shadcn | [carousel.md](https://21st.dev/@shadcn/components/carousel.md) | `embla-carousel-react` | MIT | Baris poster horizontal bertingkat ("New this week", "Trending Now") dengan tombol navigasi panah kiri/kanan. |
| **Netflix Media (Alt)** | `Home Section` | Ruixen UI | [home-section.md](https://21st.dev/@ruixen.ui/components/home-section.md) | `lucide-react`, `motion` | Unknown | Rak beranda khusus media streaming dengan poster vertikal 2:3 dan efek transisi hover zoom. |

---

## 2. Kompatibilitas dengan Proyek Kura

Pemeriksaan konfigurasi lingkungan Kura (`package.json`):
- **Core Framework**: `vue: ^3.5.43` (Composition API, `<script setup>`), `vite: ^8.3.0`
- **Ikon**: `lucide-vue-next: ^1.0.0`
- **Utilitas**: `@vueuse/core: ^15.0.0`
- **Sistem Desain**: Vanilla CSS Tokens (`src/web/styles/tokens.css` & `global.css`)
- **Server**: Node.js ESM, Express 5, Undici 8

### Evaluasi Penerapan:
1. **Tidak Bisa Dipakai Langsung (Copy-Paste Mentah)**:
   - Seluruh komponen 21st.dev ditulis dalam **React/Next.js (TSX)** dan menggunakan sintaks utility classes **Tailwind CSS**.
   - Proyek Kura adalah **Vue 3 murni tanpa Tailwind/PostCSS**.
   - Karenanya, kode React mentah **TIDAK BOLEH** disalin langsung ke dalam aplikasi.
2. **Sebagai Referensi Visual, Layout & Interaksi (100% Cocok)**:
   - Pola CSS flexbox/grid, perhitungan rasio aspek (`16/9`, `9/16`, `2/3`), posisi `position: sticky` / `position: fixed`, dan transisi transform hardware-accelerated dari 21st.dev dapat diadopsi langsung ke dalam komponen Single File Component (`.vue`) Kura.
3. **Kebutuhan Dependensi Baru**:
   - **TIDAK PERLU DEPENDENSI NPM BARU**.
   - `lucide-react` digantikan 1:1 oleh `lucide-vue-next` yang sudah terpasang.
   - `framer-motion` / `motion` digantikan oleh Vue 3 native `<Transition>`, `<TransitionGroup>`, dan CSS GPU transforms.
   - `embla-carousel` digantikan oleh CSS Scroll Snap (`scroll-snap-type: x mandatory`) yang dikontrol melalui composables `@vueuse/core` (`useScroll`), menghasilkan performa 60 FPS tanpa menambah ukuran bundle JavaScript.

### Rekomendasi Ikon Fungsional (SVG Standar dari `lucide-vue-next`):
Dilarang memakai teks emoji untuk antarmuka. Gunakan ikon resmi dari `lucide-vue-next`:
- **Home**: `<Home :size="20" />`
- **Shorts / Trending**: `<Flame :size="20" />` atau `<Zap :size="20" />`
- **Subscriptions**: `<FolderHeart :size="20" />` atau `<Tv :size="20" />`
- **Library / You**: `<Compass :size="20" />` atau `<Library :size="20" />`
- **Search**: `<Search :size="18" />`
- **Menu / Hamburger**: `<Menu :size="20" />`
- **Bell / Notifikasi**: `<Bell :size="20" />`
- **Play / Trailer**: `<Play :size="18" />` & `<Film :size="18" />`
- **Titik Tiga**: `<MoreVertical :size="18" />`

---

## 3. Perbandingan Mendalam: Sidebar Manu Arora vs Sidebar Navbar Arihant Jain

Kebutuhan antarmuka YouTube Home: Sidebar harus mampu beroperasi dalam dua mode eksplisit:
1. **Mode Ringkas (Icon Rail)**: Lebar ~72px, ikon di atas dan label teks mini di bawahnya (Home, Shorts, Subscriptions, You).
2. **Mode Penuh (Full Drawer)**: Lebar ~240px, ikon sejajar dengan teks nama menu, memiliki sub-kategori yang dapat dilipat (Subscriptions, History, Playlist), dan memicu overlay gelap saat dibuka di atas konten.

| Aspek | Sidebar (Manu Arora / Aceternity UI) | Sidebar Navbar (Arihant Jain / Spectrum UI) |
| :--- | :--- | :--- |
| **Mekanisme Pemicu** | **Hover-driven** (otomatis melebar saat kursor melintas). | **State-driven** (dikontrol via prop/event boolean). |
| **Kesesuaian dengan YouTube** | Kurang sesuai. YouTube tidak otomatis membuka sidebar saat kursor lewat; YouTube membutuhkan tombol hamburger eksplisit. | **Sangat dekat**. Memiliki pemisahan mode eksplisit antara icon-only dan full menu. |
| **Dukungan Touchscreen & Aksesibilitas** | Lemah di mobile/tablet karena event `hover` tidak ada di perangkat sentuh. | Baik, karena berbasis klik tombol toggle dan keyboard shortcut. |
| **Grup Menu Bertingkat** | Sederhana, fokus pada daftar link datar. | **Mendukung grup bertingkat & collapsible**, sangat pas untuk daftar channel langganan. |
| **Dependensi** | Butuh `framer-motion`. | Hanya `lucide-react` dan CSS flex/transition sederhana. |

### Kesimpulan & Rencana Modifikasi:
Komponen **Sidebar Navbar (Arihant Jain)** jauh lebih dekat dengan arsitektur YouTube. Modifikasi yang diperlukan saat diporting ke Vue 3 Kura (`DesktopSidebar.vue`):
1. **Kontrol Terpusat**: Hubungkan lebar sidebar dengan state reaktif global (`isSidebarExpanded`). Tombol hamburger di header berfungsi sebagai toggle state ini.
2. **Layout Icon Rail Vertikal**: Pada mode collapsed (68-72px), atur flexbox menjadi `flex-direction: column; align-items: center;` dengan label teks berukuran 10px di bawah ikon (mengikuti layout asli YouTube Web).
3. **Overlay & Stacking**: Saat `isSidebarExpanded === true` pada viewport < 1312px (breakpoint YouTube), render elemen `<div class="sidebar-backdrop" @click="toggleSidebar"></div>` dengan `opacity: 0.5; z-index: 40;`.
4. **Animasi Halus**: Terapkan easing `transition: transform 0.2s cubic-bezier(0.05, 0, 0.2, 1), width 0.2s ease` murni melalui CSS tokens.

---

## 4. Rekomendasi 2 Komponen Prioritas (Jatah Install Harian)

Bila jatah harian (2x unduh) pada 21st.dev ingin dimanfaatkan untuk menginspeksi source code implementasi:

1. **`crafterui/hero-carousel`** ([hero-carousel.md](https://21st.dev/@crafterui/components/hero-carousel.md))
   - **Alasan**: Desain billboard Netflix dengan filmstrip thumbnail yang terintegrasi ke backdrop foto utama dan perhitungan color re-grading adalah komponen yang paling kompleks dari sisi CSS layout dan gesture drag/wheel. Mengambil kodenya memberikan cetak biru arsitektur hero sinematik yang siap diadaptasi ke Vue.
2. **`haydenbleasel/stories-carousel`** ([stories-carousel.md](https://21st.dev/@haydenbleasel/components/stories-carousel.md))
   - **Alasan**: Rak Shorts 9:16 memerlukan penanganan rasio aspek vertikal yang kaku namun tetap fleksibel terhadap scroll container. Komponen ini memiliki dependensi yang sangat bersih (`clsx, tailwind-merge`) dan struktur DOM horizontal carousel yang paling mudah ditransformasikan menjadi Vue 3 SFC berkinerja tinggi.

---

## 5. Rencana Implementasi Bertahap (Roadmap Eksekusi)

Berikut urutan pengerjaan logis tanpa mengubah kode proyek pada fase riset ini:

```
[Tahap 1: Shell Navigasi] 
   └── Sinkronisasi Header Omnisearch + Dual-Mode Sidebar (Rail ⇄ Drawer).
[Tahap 2: Pita Kategori] 
   └── Category Chips Ribbon dengan scroll-snap horizontal dan tombol navigasi panah kiri/kanan.
[Tahap 3: Netflix Hero Billboard] 
   └── Hero Showcase sinematik (backdrop gelap, metadata badge, tombol Play/Trailer).
[Tahap 4: Grid Video 16:9] 
   └── Refactor VideoCard dengan rasio 16:9 YouTube, badge durasi/Mix, dan menu titik tiga.
[Tahap 5: Rak Shorts & Carousel Media] 
   └── Implementasi rak kartu vertikal 9:16 (Shorts) dan baris poster horizontal bertingkat Netflix.
```

---

## 6. Daftar URL & Tag yang Gagal / Kosong

Daftar tag kategori berikut telah diuji pada 21st.dev dan menghasilkan **HTTP 404** (tidak ada halaman markdown), sehingga dicatat agar tidak dicoba kembali:
1. `https://21st.dev/community/components/s/vertical-nav.md` (HTTP 404 — Tag tidak valid; gunakan tag `sidebar.md` atau `dock.md`).
2. `https://21st.dev/community/components/s/netflix.md` (HTTP 404 — Tidak ada kategori khusus Netflix; gunakan tag `carousel.md` atau `hero-carousel.md`).
3. `https://21st.dev/community/components/s/video-streaming.md` (HTTP 404).
4. `https://21st.dev/community/components/s/stream.md` (HTTP 404).
5. `https://21st.dev/community/components/s/youtube.md` (HTTP 404).

*Catatan Tag yang Terverifikasi Aktif*: `navigation.md`, `search.md`, `sidebar.md`, `filter.md`, `tabs.md`, `card.md`, `badge.md`, `dropdown-menu.md`, `sheet.md`, `dock.md`, `carousel.md`.
