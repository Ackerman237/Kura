<div align="center">

  <img src="docs/assets/kura-logo-horizontal.svg" alt="Kura Logo" width="440" />

  <p><strong>Your private, self-hosted storehouse of manga and cinema.</strong></p>
  <p><em>Khazanah bacaan manga dan tontonan sinema mandiri — cepat, hening, dan bebas iklan.</em></p>

  <p>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%E2%89%A518.17-339933?style=flat-square&logo=node.js" alt="Node.js" /></a>
    <img src="https://img.shields.io/badge/Modules-ESM%20Only-f7df1e?style=flat-square&logo=javascript" alt="ESM" />
    <img src="https://img.shields.io/badge/Tests-164%20Passing-34D399?style=flat-square&logo=node.js" alt="Tests" />
    <img src="https://img.shields.io/badge/Security-SSRF%20%26%20DNS%20Guarded-E8613C?style=flat-square" alt="Security" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" /></a>
  </p>

</div>

---

## 📖 Tentang Kura (蔵)

**Kura** (bahasa Jepang: 蔵, yang berarti gudang penyimpanan pusaka tradisional) adalah platform media mandiri (*self-hosted manga reader & video streaming*) dan scraping engine berkinerja tinggi.

Kura dibangun untuk pembaca dan penonton yang menginginkan privasi mutlak, kecepatan tinggi, dan kenyamanan tanpa gangguan iklan judi, popunder pembajak tab, atau pelacak pihak ketiga. Seluruh preferensi, riwayat, dan metadata tersimpan aman di server milik Anda sendiri (*privacy-first*).

---

## ✨ Pilar Keunggulan Kura

- 🛡️ **Pertahanan Anti-Iklan 3-Tier**: 
  Sistem isolasi video player berlapis (Tier 1: Ekstraksi Direct MP4 via `curl.exe` tanpa iklan; Tier 2: Reverse-proxy iframe dengan pembersihan domain iklan, injeksi shims `guardShim`/`stealthShim`, dan CSP sandbox tanpa `allow-same-origin`; Tier 3: Direct fallback allowlist).
- 🔒 **Keamanan Tingkat Enterprise**: 
  Mitigasi SSRF dan DNS Rebinding pada level socket TCP via Undici custom dispatcher, proteksi DoS body bomb (stream limits), per-hop redirect validation, dan sanitasi URL scheme ketat.
- ⚡ **Arsitektur Modular Murni (Clean Code & SRP)**: 
  Pemisahan total antara logika parser murni (*pure DOM/JSON parsing*) dan client jaringan (*transport client*), memungkinkan 100% offline unit-testability tanpa ketergantungan koneksi internet.
- 🎨 **Sistem Desain Minimalis Jepang**: 
  Palet warna 60-30-10 berlatar arang *Sumi* (`#17181C`), aksen stempel *Vermilion Shu-iro* (`#E8613C`), dan kertas *Washi* (`#ECE8E1`) dengan standar kontras WCAG AAA (14.5:1) dan sistem spasial 8pt.
- 🚀 **Zero Runtime Dependencies**: 
  Hanya menggunakan 1 dependensi eksternal (`undici` untuk socket security), sisanya menggunakan native Node.js runtime.

---

## 🗂️ Sumber Media yang Didukung

| Modul | Tipe Media | Autentikasi | Fitur Utama |
| :--- | :--- | :--- | :--- |
| **Doujindesu** | Manga / Doujinshi / Manhwa | App Secret + Salt | Katalog, pencarian, detail chapter, ekstraksi gambar chapter |
| **NekoPoi** | Video / Animasi Subtitle | Publik (None) | Katalog episode, rekomendasi relasi, stream & sanitized iframe |
| **Hentai.tv** | Streaming Animasi 2D | Publik (None) | Pencarian RSC payload, serial, episode, trending & views |
| **Eporner** | Video Tube Web | Publik (None) | Resolusi bertingkat (360p - 1080p direct MP4), kategori, related |

---

## 🚀 Memulai Cepat (Quick Start)

### 1. Prasyarat
- Node.js **≥ 18.17 LTS** (atau Bun / Deno yang mendukung global `fetch`)
- Kredensial Doujindesu (opsional jika hanya memakai video/anime)

### 2. Instalasi & Setup Lingkungan
```bash
# Clone repositori
git clone https://github.com/Ackerman237/self-hosted-manga-and-anime.git
cd self-hosted-manga-and-anime

# Salin konfigurasi environment
cp .env.example .env

# Jalankan seluruh rangkaian pengujian unit (164 tests)
npm test
```

### 3. Penggunaan Dasar SDK

```javascript
import { 
  scrapeMangaList, 
  scrapeNekoDetail, 
  scrapeHentaiDetail, 
  scrapeEpornerDetail 
} from './src/index.js';

// Mengambil daftar manga terbaru
const mangaList = await scrapeMangaList({ page: 1, type: 'manga' });
console.log(mangaList);

// Mengambil detail video dengan player iframe yang sudah disanitasi
const video = await scrapeNekoDetail('slug-episode-contoh');
console.log(video.stream);
```

---

## 📚 Pusat Dokumentasi Teknis

Seluruh dokumentasi arsitektur, standar keamanan, referensi API, dan rekam keputusan (ADR) tersusun rapi di folder [`docs/`](docs/):

- 📄 [`docs/01-overview/project-charter.md`](docs/01-overview/project-charter.md) — Piagam visi dan sasaran Kura.
- 📄 [`docs/02-architecture/design-system.md`](docs/02-architecture/design-system.md) — 22 kaidah desain, palet 60-30-10, dan aset logo SVG.
- 📄 [`docs/02-architecture/video-player-ad-isolation.md`](docs/02-architecture/video-player-ad-isolation.md) — Spesifikasi teknis pertahanan video 3-Tier.
- 📄 [`docs/02-architecture/system-design.md`](docs/02-architecture/system-design.md) — Blueprint arsitektur modular 3-Layer.
- 📄 [`docs/03-security/security-policy.md`](docs/03-security/security-policy.md) — Kebijakan keamanan jaringan & mitigasi SSRF.
- 📄 [`docs/04-api-reference/api-contracts.md`](docs/04-api-reference/api-contracts.md) — Spesifikasi DTO dan kontrak input/output.
- 📄 [`docs/04-api-reference/sdk-doujin-scraper.md`](docs/04-api-reference/sdk-doujin-scraper.md) — Dokumentasi lengkap SDK engine bawaan.
- 📄 [`docs/05-decisions/`](docs/05-decisions/) — Architecture Decision Records (ADR-001 & ADR-002).
- 📄 [`docs/06-roadmap/roadmap-and-backlog.md`](docs/06-roadmap/roadmap-and-backlog.md) — Roadmap pengembangan frontend & fitur lanjutan.

---

## 🤝 Penghargaan & Atribusi (Credits & Acknowledgements)

Proyek **Kura (蔵)** dibangun di atas fondasi solid dari komunitas open-source:

1. **Scraping Engine Asli**:  
   Modul data-collection inti dikembangkan berdasarkan library `doujin-scraper` yang awalnya dibuat oleh **[Hengki (@kyy0887)](https://github.com/kyy0887/doujin-scraper)** di bawah lisensi MIT. Kami menyampaikan terima kasih dan apresiasi sebesar-besarnya atas karya awal yang menjadi fondasi ekstraksi data project ini.
2. **Arsitektur & Resiliensi**:  
   Pola pemisahan *pure parser*, sistem isolasi iklan video player 3-tier, serta manajemen proxy terinspirasi dari arsitektur proyek **WibuDex**.

---

## ⚖️ Lisensi (License)

Proyek ini dilisensikan di bawah lisensi **[MIT](LICENSE)** © 2026 Kura Contributors & Hengki.
Disediakan untuk kepentingan pembelajaran, riset, dan penggunaan personal mandiri (*educational and personal self-hosted use only*).
