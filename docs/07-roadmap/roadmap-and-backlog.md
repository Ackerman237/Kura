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
- [x] 164 automated tests passing 100%.

---

## 🚀 Milestone 2: Frontend Reader & Streaming Client (Selesai ✅)
- [x] **UI Manga Reader**:
  - Tampilan baca manga vertikal (*webtoon-style infinite scroll*) & horizontal (*single/double page*).
  - Mode fullscreen, pengingat halaman terakhir (*reading progress tracking*).
  - Pre-fetching gambar chapter berikutnya di background untuk transisi mulus.
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

## 📥 Milestone 5: IDM-Style Download Manager & Server Disk Engine (Selesai ✅)
- [x] **Dual Mode Download**:
  - Mode Browser (Direct client download) & Mode Server Disk (Direct streaming ke filesystem host).
- [x] **Persistent Queue Management**:
  - Antrian download ala IDM (status, pause, resume, cancel, retry).
  - Floating Download Drawer dengan indikator progres realtime via SSE (`/api/downloads/events`).
- [x] **Multi-Provider Stream & Media Download**:
  - Support download chapter manga (ZIP bundling otomatis).
  - Support video download untuk Eporner (direct MP4), HentaiTV (HLS/ffmpeg stream saver), dan NekoPoi (direct link extractor).
  - Custom file naming templates & presets di Settings.

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

