# Identitas Brand & Spesifikasi Logo Kura (蔵)

Dokumen ini mendokumentasikan filosofi nama, konsep simbolik, dan pedoman penggunaan logo resmi untuk **Kura (蔵)**.

---

## 1. Filosofi & Esensi Brand

- **Nama**: **Kura** (bahasa Jepang: 蔵)
- **Makna Tradisional**: Lumbung atau gudang pusaka tradisional Jepang berdinding tebal dan tahan api, tempat keluarga menyimpan barang-barang paling berharga.
- **Korelasi Produk**: Mewakili konsep *self-hosted media library*—koleksi manga dan video favorit Anda tersimpan aman dan terawat di server milik Anda sendiri (*private storehouse*), bukan bergantung pada cloud pihak ketiga yang rentan sensor atau iklan berbahaya.
- **Asosiasi Simbolik**: Tempurung kura-kura (*tortoise shell*) yang mandiri dan melindungi. Pola heksagonal tradisional Jepang **Kikkō (亀甲)** melambangkan ketangguhan dan umur panjang.
- **Tagline**: *"Your private storehouse of manga and cinema."* / *"Khazanah bacaan dan tontonan pribadimu."*

---

## 2. Sistem Logo Ganda (Dual-Logo System)

Terinspirasi dari identitas modern klub olahraga dan sistem identitas digital terkemuka, Kura menerapkan hierarki dua varian logo:

```text
               SISTEM LOGO KURA (蔵)
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
  [ OFFICIAL CREST ]              [ MINIMAL GLYPH ]
  - Lambang Heksagon Kikkō        - Siluet Heksagon Solid
  - Partisi Panel Manga           - Cutout Negatif Play Triangle
  - Konsentris Play Button        - Ukuran mikro (16px–48px)
  - Penggunaan Makro (Hero/About) - Favicon & App Icon
```

---

## 3. Spesifikasi Berkas Vektor (SVG)

Seluruh berkas logo Kura dirancang menggunakan geometri matematika murni berformat SVG tanpa dependensi raster:

### A. Official Crest (*Logo Resmi*)
- **Berkas**: [`docs/assets/branding/kura-logo-crest.svg`](../../assets/branding/kura-logo-crest.svg)
- **Karakter Visual**: Bingkai heksagon ganda dengan garis partisi panel (*koma*) manga yang memusat ke tombol *Play*.
- **Rekomendasi Penempatan**:
  - Halaman awal pembuka (*Splash Screen*).
  - Modal dialog *About Application*.
  - Banner utama GitHub README dan poster rilis.
  - Kartu OpenGraph / media sosial.

### B. Minimal Glyph (*Logo Simpel*)
- **Berkas**: [`docs/assets/branding/kura-logo-simple.svg`](../../assets/branding/kura-logo-simple.svg)
- **Karakter Visual**: Heksagon solid Vermilion (`#E8613C`) dengan teknik *evenodd negative space* segitiga Play tembus pandang.
- **Rekomendasi Penempatan**:
  - **Favicon Browser** ($16\times16\text{px}$, $32\times32\text{px}$).
  - **Mobile / PWA / Desktop App Icon** ($192\times192\text{px}$, $512\times512\text{px}$).
  - Pojok watermark pemutar video.
  - Ikon status bar sistem.

### C. Horizontal Lockup (*Header & Navbar*)
- **Berkas**: [`docs/assets/branding/kura-logo-horizontal.svg`](../../assets/branding/kura-logo-horizontal.svg)
- **Karakter Visual**: Kombinasi simbol minimal $48\text{px}$ + Wordmark `KURA` (*Washi White*) + Kanji `蔵` (*Vermilion*) + Subtitle Deskriptor.
- **Rekomendasi Penempatan**:
  - Top navigation bar aplikasi web desktop.
  - Header dokumen dan laporan resmi.

---

## 4. Clearspace & Aturan Larangan

1. **Ruang Aman (Clearspace)**:
   - Jarak minimum di sekeliling logo setara dengan $1/4$ dari tinggi logo untuk mencegah elemen teks lain bertabrakan.
2. **Larangan Distorsi**:
   - Jangan meregangkan (*stretch*) atau mengubah rasio aspek logo.
   - Jangan mengganti warna segitiga play menjadi warna non-kontras.
   - Jangan menambahkan bayangan jatuh (*heavy drop shadow*) yang tebal.
