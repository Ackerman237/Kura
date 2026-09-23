# 07. Project Roadmap & Backlog

Dokumen ini memetakan milestone dan prioritas pengembangan project ke depan.

---

## 🎯 Milestone 1: Scraping Engine & Security Hardening (Selesai ✅)
- [x] Implementasi 4 provider scraper (Doujindesu, NekoPoi, Hentai.tv, Eporner).
- [x] Mitigasi SSRF level socket (Anti-DNS Rebinding via Undici).
- [x] Streaming payload size limiter & DoS mitigation.
- [x] Sliding-window rate limiter & Upstream throttler.
- [x] Proxy manager dengan multi-round racing.
- [x] Refactoring arsitektur modular (Clean Code & SRP: Pure Parser, Client, Facade).
- [x] 195 automated Node tests passing 100% (`npm test`). Browser UI tests remain separate.

---

## 🚀 Milestone 2: Frontend Reader & Streaming Client (Implemented / Partial)
- [x] **UI Manga Reader**:
  - Tampilan baca manga vertikal (*webtoon-style infinite scroll*) dan horizontal (*single page*). Double-page spread masih direncanakan.
  - Mode fullscreen, pengingat halaman terakhir (*reading progress tracking*).
  - Prefetch chapter berikutnya: planned / usage belum terverifikasi di implementasi aktif.
- [x] **UI Video Streaming Player**:
  - Embed player responsive dengan pemilih kualitas (*1080p/720p/480p*).
  - Player frame proxy anti-popunder sandbox isolasi Tier-2.
  - Switcher server alternatif dan daftar tautan unduh offline.
- [x] **Modern Aesthetic & UX**:
  - Dark mode premium, Pan-CJK typography tokens, micro-interactions, layout grid adaptif (mobile, tablet, desktop).

---

## 🔮 Milestone 3: PWA & Offline Capability (Selesai ✅)
- [x] **PWA & Offline Capability**:
  - Web App Manifest (`manifest.json`) untuk installasi standalone aplikasi di Android/iOS/Desktop.
  - Service Worker (`sw.js`) dengan strategi *Stale-While-Revalidate* dan offline app shell caching.
  - Download chapter manga ke **IndexedDB** untuk dibaca kapan saja tanpa koneksi internet.
- [x] **Pustaka Saya (My Library View)**:
  - Hub terpusat riwayat baca (*Continue Reading*), daftar chapter tersimpan offline, dan bookmark favorit.

---

## ⚡ Milestone 4: Smart Client-Side Caching & Local Offline Hub (Selesai ✅)
- [x] **Client-Side Cache Multi-Tier (`clientCache.js`)**:
  - In-Memory LRU Map untuk navigasi instan (0ms tab switching).
  - Persistent Cache Storage via Web Cache API (`kura-api-cache-v1`) dengan TTL terkonfigurasi.
  - Pengaturan fleksibel di menu Settings (Pilihan TTL: 15m, 1h, 6h, 24h, purge buttons).
- [x] **Offline Local Hub & File Extractor (`localFileExtractor.js`)**:
  - Dukungan upload manual berkas `.zip`, `.cbz`, dan `.mp4` langsung di browser.
  - Ekstraksi arsip client-side tanpa membebani bandwidth atau disk server.
  - Terintegrasi langsung dengan pembaca komik (MangaReader) dan pemutar video (WatchPlayerContainer).

---

## 📥 Milestone 5: IDM-Style Download Manager & Server Disk Engine (Implemented / Partial)
- [x] **Dual Mode Download**:
  - Mode Browser (Direct client download) & Mode Server Disk (Direct streaming ke filesystem host).
- [x] **Persistent Queue Management**:
  - Antrian download ala IDM (status, pause, resume, cancel, retry).
  - Floating Download Drawer dengan indikator progres via SSE (`/api/video/download/progress/:jobId`).
- [x] **Multi-Provider Stream & Media Download**:
  - Download chapter manga (ZIP bundling otomatis): planned / belum terverifikasi.
  - Video download Eporner direct MP4 dan provider lain: kemampuan bergantung pada source; HLS/ffmpeg saver belum tersedia di source aktif.
  - Custom file naming templates & presets: planned / usage belum terverifikasi.

---

## 📚 Milestone 6: Open-Source Documentation & GPL-3.0 Licensing (Selesai ✅)
- [x] Relisensi ke **GNU General Public License v3.0 (GPL-3.0)** mengikuti standar ArchiveTune/rukamori.
- [x] Pemisahan kredit pihak ketiga & disclaimer hukum ke berkas terpisah `CREDITS.md`.
- [x] Pembersihan menyeluruh kode dari referensi blueprint sebelumnya.
- [x] Dokumentasi komprehensif `README.md` dengan ilustrasi SFW UI mockup.

---

## 🔮 Future Backlog
- [ ] **Unified Media Aggregator**:
  - Universal search endpoint yang menggabungkan hasil manga dan anime dalam satu query.
- [ ] **Distributed Cache Support**:
  - Opsi adapter Redis untuk deployment cluster multi-container.

