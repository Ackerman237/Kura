# Riset Referensi UI Layout Video & Streaming (21st.dev)

Dokumen ini mendokumentasikan hasil riset dan kurasi komponen antarmuka dari **21st.dev** untuk membangun **Halaman Nonton Video / Streaming Bergaya YouTube** dan **Beranda Grid Video/Manga** pada proyek Kura (`self-hosted-manga-reader`).

---

## 1. Peta Layout Halaman Nonton (Watch Page Blueprint)

Layout halaman nonton mengadopsi arsitektur dua kolom ala YouTube desktop (rasio ~70:30) yang bertransisi menjadi susunan vertikal bertumpuk (single column) di perangkat mobile:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Navbar / Header]: Brand Logo | Omnisearch (Ctrl+K) | User / Settings  │
├───────────────┬────────────────────────────────────────┬───────────────┤
│ [Sidebar]     │ [Kolom Utama: Video & Diskusi (70%)]  │ [Kolom Kanan] │
│ (Collapsible) │ 1. Main Video Player (16:9 Cinema)     │ [Up Next /    │
│               │ 2. Video Title & Primary Actions       │  Related Feed]│
│               │    (Like, Share, Download, Bookmark)   │ Compact video │
│               │ 3. Channel Info & Expandable Desc Box  │ cards with    │
│               │ 4. Comments Section & Nested Replies   │ hover preview │
├───────────────┴────────────────────────────────────────┴───────────────┤
│ [Mobile Dock]: Floating Navigation Bar (Layar < 768px)                │
└────────────────────────────────────────────────────────────────────────┘
```

### Pemetaan Bagian & Kandidat Komponen 21st.dev:

1. **Player (Video Player Core & Layering)**
   - *Kandidat 1*: `limeplay/player-layout` — Abstraksi kontainer pemutar video komprehensif dengan pemisahan pointer-events layer, control overlays, dan gesture surface.
   - *Kandidat 2*: `ruixen.ui/video-player-pro` — Player lengkap dengan timeline progress slider, volume slider, gear settings modal (playback speed & caption), dan ambient backdrop glow.

2. **Info Video & Channel Bar (Metadata & Expandable Description)**
   - *Kandidat 1*: `cnippet-dev/cnippet-accordion` — Pola akordeon collapsible halus untuk kotak deskripsi video YouTube ("...more / show less") lengkap dengan metadata tags.
   - *Kandidat 2*: `cult-ui/youtube-video-player` — Komponen metadata info video gaya YouTube dengan indikator durasi dan badge kategori.

3. **Up Next / Related Videos (Sidebar Rekomendasi)**
   - *Kandidat 1*: `cult-ui/side-panel-video` — Panel samping khusus antrean video rekomendasi dengan tata letak thumbnail horizontal yang hemat ruang.
   - *Kandidat 2*: `ruixen.ui/hover-play-card` — Kartu video dengan interaksi preview video berputar otomatis (muted preview loop) saat cursor mouse diarahkan (hover).

4. **Komentar (Discussion & Nested Thread)**
   - *Kandidat 1*: `efferd/comments` — Sistem komentar lengkap dengan avatar, badge waktu relatif, reply button, penghapusan komentar, dan form submission dengan skeleton loader.
   - *Kandidat 2*: `vaib215/reddit-nested-thread-reply` — Struktur hierarki komentar bercabang (nested thread tree) yang ringan dengan garis pemandu cabang yang rapi.

5. **Grid Beranda (Video & Manga Catalog Cards)**
   - *Kandidat 1*: `ruixen.ui/hover-play-card` — Sangat cocok untuk feed video utama beranda dengan efek video preview dinamis tanpa perlu membuka halaman baru.
   - *Kandidat 2*: `ravikatiyar162/video-thumbnail-player` — Layout kartu media dengan rasio 16:9/2:3, overlay badge durasi/bab, dan play button yang adaptif untuk kartu manga maupun video.

6. **Navbar / Omnisearch**
   - *Kandidat 1*: `efferd/header-with-search` — Header modern dengan input search terintegrasi di tengah, modal pencarian cepat (`Ctrl+K`), dan drawer responsif.
   - *Kandidat 2*: `shadcnblockscom/navbar-5` — Topbar bersih bergaya YouTube dengan logo di kiri, navigation rail links, dan tombol pengaturan di kanan.

7. **Sidebar (Collapsible YouTube Navigation)**
   - *Kandidat 1*: `shadcn/sidebar` — Standar baku navigasi samping (collapsible rail: 240px saat melebar ke 64px saat mengecil, keyboard toggle, dan tooltip).
   - *Kandidat 2*: `uniquesonu/dashboard-with-collapsible-sidebar` — Sidebar responsif yang beralih mulus antara fixed rail pada desktop dan off-canvas drawer pada mobile.

---

## 2. Tabel Kandidat Komponen

| Bagian | Nama Komponen | Author | URL 21st.dev (.md) | Dependensi npm | Lisensi | Alasan Cocok |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Player** | `Player Layout` | limeplay | [limeplay/player-layout.md](https://21st.dev/@limeplay/components/player-layout.md) | Minimal (React native) | MIT | Struktur layering HUD control & gesture surface yang tepat tanpa konflik `pointer-events`. |
| **Player** | `Video Player Pro` | ruixen.ui | [ruixen.ui/video-player-pro.md](https://21st.dev/@ruixen.ui/components/video-player-pro.md) | `lucide-react`, `framer-motion` | Unknown | Kontrol lengkap (timeline scrubber, volume popup, selector kecepatan playback, ambient glow). |
| **Info Video** | `Accordion` | cnippet-dev | [cnippet-dev/cnippet-accordion.md](https://21st.dev/@cnippet-dev/components/cnippet-accordion.md) | `lucide-react`, `@base-ui-components/react` | MIT | Sangat cocok untuk YouTube expandable description box dengan animasi tinggi yang mulus. |
| **Info Video** | `YouTube Video Player` | cult-ui | [cult-ui/youtube-video-player.md](https://21st.dev/@cult-ui/components/youtube-video-player.md) | `motion`, `lucide-react` | MIT | Tata letak metadata video YouTube autentik dengan chip badge informasi channel. |
| **Up Next** | `Side Panel Video` | cult-ui | [cult-ui/side-panel-video.md](https://21st.dev/@cult-ui/components/side-panel-video.md) | `motion`, `react-player`, `react-use-measure` | Unknown | Desain horizontal compact card yang dirancang khusus untuk daftar putar/rekomendasi video. |
| **Up Next** | `HoverPlayCard` | ruixen.ui | [ruixen.ui/hover-play-card.md](https://21st.dev/@ruixen.ui/components/hover-play-card.md) | `lucide-react`, `framer-motion` | Unknown | Efek auto-preview muted video saat kursor berada di atas thumbnail rekomendasi. |
| **Komentar** | `Comments` | efferd | [efferd/comments.md](https://21st.dev/@efferd/components/comments.md) | `lucide-react`, `framer-motion` | Unknown | Komponen komentar lengkap dengan avatar, input form, tombol balas berjenjang, dan skeleton state. |
| **Komentar** | `Reddit Nested Thread Reply` | vaib215 | [vaib215/reddit-nested-thread-reply.md](https://21st.dev/@vaib215/components/reddit-nested-thread-reply.md) | `lucide-react` | Unknown | Struktur pohon diskusi beranting (nested hierarchy) yang sangat rapi untuk diskusi episode/chapter. |
| **Grid Beranda**| `HoverPlayCard` | ruixen.ui | [ruixen.ui/hover-play-card.md](https://21st.dev/@ruixen.ui/components/hover-play-card.md) | `lucide-react`, `framer-motion` | Unknown | Memberikan pengalaman katalog interaktif di mana pengguna bisa melihat cuplikan tanpa klik. |
| **Grid Beranda**| `Video Thumbnail Player` | ravikatiyar162 | [ravikatiyar162/video-thumbnail-player.md](https://21st.dev/@ravikatiyar162/components/video-thumbnail-player.md) | `lucide-react` | Unknown | Layout kartu thumbnail proporsional dengan badge durasi dan judul yang mudah diadopsi. |
| **Navbar** | `Header with Search` | efferd | [efferd/header-with-search.md](https://21st.dev/@efferd/components/header-with-search.md) | `lucide-react` | Unknown | Omnisearch bar terpusat dengan shortcut keyboard dan dukungan responsif mobile. |
| **Navbar** | `Navbar 5` | shadcnblockscom | [shadcnblockscom/navbar-5.md](https://21st.dev/@shadcnblockscom/components/navbar-5.md) | `lucide-react`, `@radix-ui/react-navigation-menu` | MIT | Header bersih standar enterprise dengan menu aksi cepat dan logo branding. |
| **Sidebar** | `Sidebar` | shadcn | [shadcn/sidebar.md](https://21st.dev/@shadcn/components/sidebar.md) | `lucide-react`, `@radix-ui/react-slot`, `class-variance-authority` | MIT | Tolok ukur resmi navigasi rail (240px <-> 64px) dengan status aktif dan pengelompokan menu. |
| **Sidebar** | `Dashboard with Collapsible Sidebar` | uniquesonu | [uniquesonu/dashboard-with-collapsible-sidebar.md](https://21st.dev/@uniquesonu/components/dashboard-with-collapsible-sidebar.md) | `lucide-react` | Unknown | Navigasi samping minimalis dengan animasi transisi yang mulus. |

---

## 3. Analisis Kompatibilitas dengan Proyek Kura

Berdasarkan pemeriksaan langsung terhadap `package.json` dan struktur proyek:

```json
{
  "dependencies": {
    "@vueuse/core": "^15.0.0",
    "express": "^5.2.1",
    "lucide-vue-next": "^1.0.0",
    "undici": "^8.10.2",
    "vue": "^3.5.43"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.9",
    "vite": "^8.3.0"
  }
}
```

### Temuan Kritis:
1. **Framework Mismatch**: Seluruh komponen 21st.dev dibangun di atas ekosistem **React 18/19, JSX/TSX, dan Tailwind CSS**, sedangkan proyek Kura menggunakan **Vue 3 (Composition API, `<script setup>`), Vite 8, dan Vanilla CSS Tokens**.
2. **Dependensi Eksternal**:
   - `framer-motion` / `motion`: **TIDAK TERPASANG & TIDAK COCOK**. Di Vue 3, animasi harus menggunakan bawaan `<Transition>`, CSS transitions/animations, atau `@vueuse/motion`.
   - `lucide-react`: **TIDAK PERLU**. Kura sudah memiliki `lucide-vue-next: ^1.0.0` yang menyediakan seluruh ikon setara secara native.
   - `@radix-ui/*` / `@base-ui-components/react`: Primitif React. Di Vue 3, state ini dapat ditangani secara native melalui Vue `ref()`, composables dari `@vueuse/core`, atau `radix-vue`.
   - `media-chrome`: Belum terpasang. Player bawaan browser `<video>` atau custom HLS.js wrapper lebih ringan dan tidak membebani bundle size.
   - Tailwind CSS: Kura menggunakan sistem CSS Variables (`src/web/styles/tokens.css` & `global.css`). Kelas utilitas Tailwind harus ditransformasikan ke CSS token yang ada.

### Keputusan:
Komponen dari 21st.dev **TIDAK BOLEH di-copy-paste langsung sebagai kode mentah**. Semua komponen di atas difungsikan sebagai **Referensi Arsitektur & Pola Visual (Visual & Layout Reference Only)**. Implementasinya ke dalam Kura dilakukan dengan membuat Vue 3 Single File Component (`.vue`) yang mereplikasi struktur DOM, z-index layering, dan interaksi CSS-nya.

---

## 4. Rekomendasi 2 Komponen Prioritas (Jatah Install Harian)

Jika pengguna ingin memanfaatkan jatah unduhan/install harian (2x per hari pada akun gratis 21st.dev) untuk menginspeksi source code lengkapnya:

1. **`limeplay/player-layout`** (`https://21st.dev/@limeplay/components/player-layout.md`)
   - **Alasan**: Aspek paling rumit dalam membangun video player bergaya YouTube adalah manajemen **layering CSS dan pointer-events** (memisahkan layer video render, layer klik play/pause di tengah, layer double-tap seek 10 detik di sisi kiri/kanan, dan layer kontrol scrubber/volume di bagian bawah). Source code komponen ini memberikan blueprint pasti bagaimana arsitektur kontainer disusun tanpa merusak interaksi kontrol.
2. **`efferd/comments`** (`https://21st.dev/@efferd/components/comments.md`)
   - **Alasan**: Sistem komentar modern memiliki struktur state tree yang mendalam (input form, tombol trigger reply per baris komentar, nesting sub-balasan, skeleton loader saat mengambil data, serta optimistic UI saat menghapus atau menyukai komentar). Mengunduh komponen ini mempermudah pemetaan model data dan layout responsif untuk thread diskusi di bawah video.

---

## 5. Daftar Tag & URL yang Kosong / Gagal (404)

Daftar URL berikut telah diuji dan terbukti tidak ditemukan (HTTP 404) atau tidak memiliki padanan dokumen markdown di 21st.dev, sehingga **tidak perlu dicoba kembali**:

1. `https://21st.dev/community/components/s/video-streaming.md` (HTTP 404 — Tag tidak terdaftar).
2. `https://21st.dev/community/components/s/stream.md` (HTTP 404 — Tag tidak terdaftar).
3. `https://21st.dev/community/components/s/youtube.md` (HTTP 404 — Tag tidak terdaftar sebagai kategori slug).
4. `https://21st.dev/search?q=video+player` (Bukan endpoint markdown; route pencarian 21st.dev mengembalikan halaman shell aplikasi client-side tanpa file `.md`).
