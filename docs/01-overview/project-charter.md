# 01. Project Overview & Charter: Kura (蔵)

## 1. Ringkasan Eksekutif
**Kura** (蔵 - *Khazanah/Gudang Pusaka Pribadi*) adalah platform media mandiri (*self-hosted manga reader & cinema stream*) dan scraping engine berkinerja tinggi.

Kura dirancang untuk memberikan pengalaman membaca manga dan streaming video yang hening, cepat, dan bebas dari iklan berbahaya (*ad-free, zero tracking*). Seluruh data dan preferensi tersimpan aman di server milik pengguna sendiri (*privacy-first*), dengan arsitektur scraping tangguh yang terlindungi dari serangan SSRF, DNS Rebinding, DoS body bomb, dan pemblokiran IP.

---

## 2. Tujuan & Sasaran Utama
1. **Keandalan Scraping**: Mengekstrak data manga (list, genre, detail, chapter images) dan video streaming (list, detail, iframe embed player, direct mp4 download) secara konsisten dari berbagai struktur situs (REST SPA berenkripsi, WordPress HTML, Next.js RSC chunks, dan Tube APIs).
2. **Keamanan Kelas Enterprise**: Mencegah eksploitasi server internal saat melakukan outbound scraping melalui socket-level IP filter, URL sanitizer, dan per-hop redirect validation.
3. **Resiliensi & Anti-Abuse**: Mendukung proxy pooling dengan multi-round racing otomatis, rate limiter sliding window, dan upstream throttler untuk meminimalisir pemblokiran HTTP 429 oleh situs sumber.
4. **Desain Modular (Clean Code & SRP)**: Memisahkan parsing data murni (*pure logic*) dari layer jaringan (*transport client*), terinspirasi oleh arsitektur modular WibuDex.

---

## 3. Lingkup Project (Scope)

### Termasuk dalam Scope (In-Scope)
- Modul scraper: Doujindesu, NekoPoi, Hentai.tv, Eporner.
- Layer keamanan transport HTTP (`safeFetch` dengan Undici socket dispatcher).
- Layer proxy management otomatis dan racing test.
- In-memory LRU caching dan Rate Limiting.
- Integrasi ke frontend web client di fase berikutnya.

### Di Luar Scope (Out-of-Scope)
- Hosting atau penyimpanan permanen berkas media (konten di-stream secara langsung dari CDN penyedia sumber).
- Manajemen akun berbayar / bypass login bypass yang melanggar ketentuan hukum.

---

## 4. Stack Teknologi
- **Runtime**: Node.js (>= 18.17 LTS) / ESM murni (`type: "module"`).
- **Network Dispatcher**: Undici (Custom connection agent untuk anti-DNS rebinding).
- **Test Runner**: Node.js Native Test Runner (`node --test`).
- **Dependencies**: Zero runtime dependencies (kecuali `undici`).
