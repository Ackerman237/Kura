# Spesifikasi UI & Fitur Situs Pembaca Komik + Panduan Identitas Berbeda

**Tujuan:** struktur UI dan fitur setara situs pembaca komik referensi, tetapi identitas (nama, logo, warna, font, ilustrasi, teks) sepenuhnya milikmu sendiri.

**Catatan penting tentang sumber daftar ini:** daftar fitur di bawah disusun dari pola umum situs pembaca komik Indonesia, bukan hasil membuka situs referensinya langsung. Anggap ini titik awal. Untuk hasil yang presisi, cocokkan dengan screenshot halaman detail, halaman baca, dan halaman filter dari situs referensi (bagian 6).

---

## 1. Halaman dan fitur

### 1.1 Beranda
- Header: logo, menu (Home, Daftar, Genre, Bookmark), kolom search dengan shortcut `Ctrl+K`, tombol tema, avatar/masuk.
- Area pengumuman (maksimal 1 baris kecil, bukan banner besar).
- Rekomendasi / Populer dengan tab periode (Hari ini, Minggu ini, Bulan ini, Semua).
- Update terbaru dalam grid kartu, dengan toggle tampilan grid ⇄ list.
- Kartu: cover, judul (maksimal 2 baris), chapter terbaru, waktu relatif ("2 jam lalu"), badge (Baru, Populer, tipe, negara/bahasa).
- Pagination atau infinite scroll dengan skeleton loading.

### 1.2 Daftar dan pencarian
- Search dengan autocomplete (judul, alt title, penulis).
- Filter: genre/tag (bisa include dan exclude), tipe, status (berjalan/tamat), urutan (terbaru, populer, A–Z, rating).
- Filter tersinkron ke URL supaya bisa dibagikan.
- Chips filter aktif yang bisa dihapus satu per satu + tombol "Reset".

### 1.3 Halaman detail
- Cover besar, judul, judul alternatif.
- Blok metadata: penulis/circle, artis, parodi, karakter, tag, bahasa, status, rating, jumlah view.
- Sinopsis yang bisa dilipat.
- Tombol utama: "Mulai baca" atau "Lanjutkan (Chapter X)", ditambah "Bookmark".
- Daftar chapter: urut naik/turun, kolom cari chapter, penanda sudah dibaca, tanggal rilis.
- Rekomendasi terkait (carousel).
- Komentar (opsional, fase akhir).

### 1.4 Halaman baca (reader)
- Mode: scroll vertikal (webtoon) dan per halaman.
- Kontrol: chapter sebelumnya/berikutnya, dropdown pilih chapter, lompat halaman, kembali ke halaman detail.
- Lebar gambar: fit width / original / kolom sempit.
- Lazy loading + preload 2–3 gambar berikutnya.
- Shortcut keyboard (panah, `J/K`, `F` fullscreen), zona tap di mobile.
- Toolbar yang otomatis tersembunyi saat scroll ke bawah.
- Menyimpan progres baca otomatis.
- Tombol "Laporkan gambar rusak".

### 1.5 Bookmark, riwayat, pengaturan
- Bookmark dan riwayat "Lanjutkan membaca" (mulai dari penyimpanan lokal, akun menyusul).
- Pengaturan reader: mode baca, lebar gambar, tema, kepadatan grid.

### 1.6 Konten dewasa (kalau situsmu memuatnya)
- Gate usia 18+ di pintu masuk, dengan pilihan blur cover sampai gate disetujui.
- Filter/blacklist tag yang bisa diatur pengguna, dan blacklist tetap di sisi server untuk kategori yang memang dilarang.
- Halaman terpisah untuk kebijakan konten dan cara melapor.

### 1.7 Admin
- Tambah/edit judul, unggah chapter (urutan halaman bisa diseret), kelola tag dan genre, antrean laporan.

### 1.8 Non-fungsional
- Gambar diproses ke WebP/AVIF, di-cache lewat CDN atau image proxy.
- PWA (bisa dipasang), layout responsif dari 360px sampai desktop lebar.
- SEO dasar: judul halaman, deskripsi, Open Graph.

---

## 2. Membuat identitas yang benar-benar berbeda

### 2.1 Pertahankan (struktur dan alur)
- Urutan section di beranda dan hierarki informasi di halaman detail.
- Alur dari beranda → detail → baca → lanjut chapter.
- Kumpulan fitur di bagian 1.

### 2.2 Ubah total (identitas)

| Elemen | Yang harus berbeda |
|---|---|
| Nama & logo | Nama, wordmark, dan ikon baru. Jangan mirip dengan situs referensi. |
| Palet warna | Pilih palet sendiri (1 warna aksen + netral). Jangan pakai kombinasi warna aksen yang sama dengan referensi. |
| Tipografi | Pasangan font berbeda (satu untuk judul, satu untuk isi). |
| Ikon | Satu keluarga ikon SVG konsisten (Lucide / Phosphor / Heroicons), bukan emoji. |
| Bentuk komponen | Radius sudut, ketebalan border, gaya bayangan, dan rasio kartu dibuat sendiri. |
| Ilustrasi/maskot | Buat atau pesan sendiri; jangan pakai karakter dari karya orang lain sebagai maskot. |
| Teks & nada bahasa | Tulis ulang semua microcopy (tombol, pesan kosong, pesan error) dengan gaya suaramu. |
| Motion | Animasi transisi dan hover dengan karakter tersendiri. |
| Detail kecil | Nama fitur, label tab, dan urutan minor di navbar diubah. |

### 2.3 Jangan lakukan
- Menyalin logo, gambar, aset, teks, atau file CSS/HTML/JS dari situs referensi.
- Hotlink atau scrape aset situs referensi. Bangun ulang semuanya dari nol.
- Memakai nama, slogan, atau tampilan yang bisa dikira situs referensi.

### 2.4 Cara praktis
1. Pilih nama dan arah visual dulu (3 kata sifat, misalnya "tenang, gelap, editorial").
2. Tetapkan design tokens: warna, font, radius, spasi, bayangan (satu file, satu sumber kebenaran).
3. Baru bangun halaman memakai token itu, sehingga ganti identitas nanti cukup mengubah token.

---

## 3. Pemetaan komponen 21st.dev

Link dan detail komponen ada di dua file sebelumnya:
- `21stdev-links-video-streaming.md`
- `21stdev-links-youtube-netflix-layout.md`

| Kebutuhan | Tag yang dicari |
|---|---|
| Header + search + Ctrl+K | `navigation`, `search` |
| Banner pengumuman | `notification`, `card` |
| Tab periode / tipe | `tabs`, `chip` |
| Grid kartu cover | `card`, `hover-play-card` |
| Toggle grid ⇄ list | `toggle-group`, `filter` |
| Badge kartu | `badge` |
| Panel filter genre | `filter`, `chip`, `accordion` |
| Daftar chapter | `table`, `accordion`, `card` |
| Carousel rekomendasi | `carousel` |
| Dialog gate usia / laporan | `dialog` |
| Sidebar admin | `sidebar` |

---

## 4. Urutan pengerjaan yang disarankan

1. **Fondasi:** design tokens, layout dasar (header, kontainer, tema gelap), komponen kartu dan badge.
2. **Beranda** dengan data contoh.
3. **Detail + daftar chapter.**
4. **Reader** (mode vertikal dulu, lalu per halaman, lalu shortcut dan simpan progres).
5. **Search + filter** yang tersinkron ke URL.
6. **Bookmark dan riwayat** (lokal dulu).
7. **Gate usia + pengaturan konten** (kalau relevan), lalu admin, lalu PWA/SEO.

---

## 5. Konten dan risiko yang perlu dipikirkan sejak awal

- **Sumber konten adalah risiko terbesar, bukan UI.** Menyalin tampilan dan fitur situs lain tidak masalah selama aset dan kodenya bukan salinan. Yang berisiko adalah menyajikan scan berhak cipta tanpa izin. Untuk versi publik, pakai konten milik sendiri, berlisensi, atau unggahan pengguna dengan mekanisme takedown.
- **Konten dewasa di Indonesia** punya risiko hukum dan pemblokiran tersendiri (UU Pornografi, pemblokiran oleh Komdigi). Kalau situsmu memuatnya, minimal pasang gate usia dan jangan dibuka untuk publik tanpa pertimbangan matang. Sebagai proyek belajar atau pribadi, pakai data contoh dan bukan konten sungguhan.
- **Konten yang melibatkan anak di bawah umur** tidak boleh ada dalam bentuk apa pun; blacklist di sisi server untuk kategori itu.
- **Iklan:** banner slot/judi seperti di screenshot referensi pertamamu ilegal di Indonesia. Kosongkan slot iklan, atau isi dengan pengumuman internal.

---

## 6. Yang perlu kamu kirim supaya spesifikasi ini presisi

Screenshot dari situs referensi (boleh dengan cover disensor) untuk:
1. Beranda (sudah ada versi situs lain)
2. Halaman detail satu judul
3. Halaman baca (atas dan tengah)
4. Halaman daftar/filter
5. Tampilan mobile untuk beranda dan halaman baca

Dengan itu, bagian 1 bisa saya perbaiki mengikuti tata letak dan fitur yang sebenarnya.
