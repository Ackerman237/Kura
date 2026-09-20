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

## 🔮 Milestone 3: PWA & Performance Enhancements (Selesai ✅)
- [x] **PWA & Offline Capability**:
  - Web App Manifest (`manifest.json`) untuk installasi standalone aplikasi di Android/iOS/Desktop.
  - Service Worker (`sw.js`) dengan strategi *Stale-While-Revalidate* dan offline app shell caching.
  - Download chapter manga ke **IndexedDB** untuk dibaca kapan saja tanpa koneksi internet.
- [x] **Pustaka Saya (My Library View)**:
  - Hub terpusat riwayat baca (*Continue Reading*), daftar chapter tersimpan offline, dan bookmark favorit.
- [ ] **Unified Media Aggregator**:
  - Universal search endpoint yang menggabungkan hasil manga dan anime dalam satu query.
- [ ] **Distributed Cache Support**:
  - Opsi adapter Redis untuk deployment cluster multi-container.
