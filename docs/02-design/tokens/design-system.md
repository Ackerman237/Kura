# Sistem Desain & Panduan Visual "Kura" (蔵)

Dokumen ini adalah spesifikasi resmi Sistem Desain untuk **Kura** (蔵)—sebuah platform media mandiri (*self-hosted media storehouse*) untuk membaca manga dan menonton streaming.

Sistem desain ini dibangun berdasarkan sintesis **Arah 1: Japanese Minimalist (Palet Sumi & Washi)** dengan **Arah 4: Fluid Pure Reader (Disiplin UI Konten-Utama)**, dipadukan dengan 22 kaidah ilmu desain visual modern dan standar aksesibilitas WCAG 2.1.

---

## 1. Identitas Brand & Filosofi

- **Nama**: **Kura** (Jepang: 蔵)
- **Makna**: Gudang penyimpanan pusaka/khazanah tradisional Jepang yang kokoh dan tahan api. Merepresentasikan tempat penyimpanan koleksi manga dan video pribadi di server rumah sendiri (*self-hosted*).
- **Metafora Tambahan (Indonesia)**: Tempurung kura-kura (*shell*) yang mandiri, tahan banting, dan dibawa ke mana-mana. Pola heksagonal tradisional Jepang **Kikkō (亀甲)** menjadi inspirasi geometris logo dan grid.
- **Tagline**: *"Your private storehouse of manga and cinema."* / *"Khazanah bacaan dan tontonan pribadimu."*

### 1.1 Aset Logo Resmi (Format SVG Vector)

Kura mengadopsi sistem hierarki logo ganda (*Dual-Logo System*) yang fleksibel untuk berbagai resolusi:

| Varian Logo | Lokasi Berkas | Karakter & Kegunaan |
| :--- | :--- | :--- |
| **Official Crest**<br>*(Logo Resmi)* | [`docs/assets/branding/kura-logo-crest.svg`](../../assets/branding/kura-logo-crest.svg) | Emblem heksagon *Kikkō* lengkap dengan partisi panel manga (*koma*), lingkaran konsentris, dan tombol *play*. Digunakan pada Splash screen, About Modal, dan header README. |
| **Minimal Glyph**<br>*(Logo Simpel)* | [`docs/assets/branding/kura-logo-simple.svg`](../../assets/branding/kura-logo-simple.svg) | Siluet heksagon solid dengan *negative-space* segitiga play. Dioptimalkan untuk ukuran mikro: Favicon browser ($16\times16\text{px}$ / $32\times32\text{px}$) dan App Icon ($192\text{px}$ / $512\text{px}$). |
| **Horizontal Lockup**<br>*(Header & Navbar)* | [`docs/assets/branding/kura-logo-horizontal.svg`](../../assets/branding/kura-logo-horizontal.svg) | Kombinasi ikon simpel + tipografi `KURA` (*Washi*) + kanji `蔵` (*Vermilion*). Digunakan pada navbar utama aplikasi web desktop. |

> [!TIP]
> Rincian lengkap pedoman clearspace dan filosofi visual logo dapat dibaca pada [identity-and-logo.md](../brand/identity-and-logo.md).

---

## 2. Palet Warna (Aturan 60–30–10 & WCAG Compliance)

Sistem warna menerapkan pembagian porsi visual **60% Latar, 30% Struktur/Kartu, 10% Aksen Interaktif**:

| Token CSS | Nilai HEX | Peran & Porsi | Rasio Kontras WCAG | Deskripsi / Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| `--kura-bg` | `#17181C` | **Background (60%)** | — | Charcoal hangat (*Sumi*). Bukan hitam murni (`#000000`) agar mata tidak lelah. |
| `--kura-surface` | `#22242A` | **Surface / Cards (30%)** | — | Warna kontainer kartu manga, modal pop-up, bar navigasi, dan drawer. |
| `--kura-surface-hover`| `#2A2D35` | Surface State | — | State hover untuk kartu dan item list interaktif. |
| `--kura-accent` | `#E8613C` | **Primary Accent (10%)** | **5.24:1** (AA) | Merah-oranye vermilion (*Shu-iro*), seperti stempel cap *hanko*. Tombol Play, tab aktif, scrubber. |
| `--kura-accent-hover`| `#F0714E` | Accent Hover | — | State hover tombol primer. |
| `--kura-text-primary`| `#ECE8E1` | Teks Utama | **14.53:1** (AAA) | Putih hangat kertas washi. Judul manga, teks sinopsis, label tombol utama. |
| `--kura-text-muted`  | `#A8A59F` | Teks Sekunder | **7.22:1** (AAA) | Teks metadata (chapter, author, tanggal rilis, durasi video). |
| `--kura-border-subtle`| `#33363E` | Border Dekoratif | 1.45:1 | Garis pemisah tipis (*hairline*) antar kartu dan section (bukan untuk kontrol form). |
| `--kura-border-strong`| `#5A5F6D` | **Control Border** | **3.12:1** (UI AA)| Border wajib untuk input teks, search bar, radio, dan switch agar terbaca jelas. |

### Semantic Feedback Colors
Warna status fungsional yang dikalibrasi untuk latar gelap:
- **Success**: `#34D399` (Mint emerald lembut - status bookmark, unduhan selesai)
- **Warning**: `#FBBF24` (Amber hangat - notifikasi episode tertunda)
- **Danger**: `#F87171` (Coral crimson - error jaringan, server offline)
- **Info**: `#60A5FA` (Sky blue - update aplikasi, metadata scraper)

> [!IMPORTANT]
> **Aturan Kontras Tombol Aksen**:
> Pada latar tombol aksen `--kura-accent` (`#E8613C`), teks label **wajib** menggunakan warna gelap `--kura-bg` (`#17181C`, kontras 5.24:1 AA), **bukan** putih, demi kenyamanan membaca optimal.

---

## 3. Tipografi & Hierarki Teks

### Font Stack
1. **Heading / Brand**: `Zen Kaku Gothic New`, `Shippori Mincho`, sans-serif (mendukung glyph Kanji/Kana dan alfabet Latin dengan anggun).
2. **Body & UI**: `Inter`, `system-ui`, sans-serif (tingkat keterbacaan tinggi pada layar mobile).
3. **Metadata & Status**: `JetBrains Mono`, monospace (untuk chapter number, ukuran berkas, bitrate stream, IP status).

### Skala Tipografi & Line Height
- **Hero Title**: `2.25rem` (36px) — `line-height: 1.2`
- **Section Heading (H1/H2)**: `1.5rem` (24px) — `line-height: 1.3`
- **Card Title (H3)**: `1.0rem` (16px) — `line-height: 1.4` (font-weight: 600)
- **Body Text**: `0.9375rem` (15px) — `line-height: 1.6` (sinopsis dan paragraf)
- **Caption / Meta**: `0.8125rem` (13px) — `line-height: 1.4` (`--kura-text-muted`)

---

## 4. Sistem Spasial & Grid (8pt Framework)

Sistem ruang Kura bertumpu pada kelipatan dasar **8px** (dengan subdivisi mikro **4px**):

```css
--space-1: 4px;   /* Micro spacing: gap icon-ke-text, badge padding */
--space-2: 8px;   /* Small: padding tombol mini, internal chip */
--space-3: 12px;  /* Compact: gap antar form element */
--space-4: 16px;  /* Base: padding kartu, gap grid mobile */
--space-6: 24px;  /* Medium: margin section mobile, desktop grid gap */
--space-8: 32px;  /* Large: padding kontainer desktop */
--space-12: 48px; /* Touch target standar / navbar height */
--space-16: 64px; /* Macro: pemisah antar section besar */
```

### Layout Grid Kura
1. **Mobile (< 768px)**: 4 Kolom, Gutter 16px, Margin Layar 16px.
2. **Tablet (768px – 1024px)**: 8 Kolom, Gutter 20px, Margin Layar 24px.
3. **Desktop (> 1024px)**: 12 Kolom, Gutter 24px, Max-Width Kontainer 1280px.

---

## 5. Kaidah Kelengkungan Sudut (Concentric Border Radius)

Untuk mencegah distorsi visual pada elemen bertumpuk (nested elements), Kura menerapkan rumus geometris:
$$\mathbf{R_{\text{luar}} = R_{\text{dalam}} + \text{Padding}}$$

- **Outer Card Container**: `12px`
  - Internal Cover Poster (dengan padding 4px): $12px - 4px =$ `8px`
- **Interactive Control (Input, Button)**: `8px`
- **Pill / Status Badge**: `9999px` (Full round)
- **Manga Reader Canvas**: `0px` (Strict full-bleed edges)

---

## 6. Disiplin Reader & Player (Arah 4: Ghost UI)

Kura menerapkan prinsip bahwa **konten adalah bintang**:
1. **Auto-Hide Chrome**: Saat membaca manga atau menonton video, seluruh panel navigasi, header, dan progress scrubber otomatis menghilang setelah 3 detik tanpa interaksi pengguna (*idle*).
2. **Safe Tap Zones**:
   - **Kiri 30%**: Halaman sebelumnya (*prev chapter/page*).
   - **Tengah 40%**: Toggle HUD / menu navigasi.
   - **Kanan 30%**: Halaman berikutnya (*next chapter/page*).
3. **Scrim Proteksi Kontras**: Jika judul atau status ditumpuk di atas cover gambar/video, wajib menggunakan gradien scrim:
   `background: linear-gradient(180deg, rgba(23, 24, 28, 0) 0%, rgba(23, 24, 28, 0.88) 100%);`

---

## 7. Komponen Interaktif & Aksesibilitas Mobile

1. **Target Sentuh Minimum (Touch Targets)**:
   Semua tombol, ikon navigasi, dan kontrol player wajib memiliki bounding box minimal **$48 \times 48\text{px}$** (bahkan jika visual ikonnya berukuran $20\text{px}$, bungkus dalam wrapper padding transparan).
2. **Family Ikon**:
   Menggunakan set ikon bergaris tipis bergaya editorial (Lucide / Phosphor), `stroke-width: 1.5px`, ujung membulat (*round cap*), ukuran baku $20\text{px}$ (inline) dan $24\text{px}$ (standalone action).
3. **Form Controls (Dropdown & Radio)**:
   - Radio button memiliki lingkaran terluar $20\text{px}$ dengan border `--kura-border-strong` dan titik aksen aktif $10\text{px}$.
   - Dropdown wajib menyertakan chevron indikator yang berputar $180^\circ$ saat terbuka.
4. **Pesan Error**:
   - Ditampilkan di bawah elemen input terkait dengan warna `--kura-danger` (`#F87171`), ikon peringatan kecil, dan deskripsi solusi yang jelas (bukan sekadar kode error mentah).
5. **Empty State**:
   - Didesain dengan ilustrasi monokromatik halus bertema *Kura* (pintu lumbung tertutup atau rak buku kosong), judul singkat, dan satu tombol aksi jelas (misal: *"Jelajahi Manga Populer"*).
