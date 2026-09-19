# ADR-001: Pemisahan Pure Parser & Client Network (Pola WibuDex)

## Status
**Accepted & Implemented** (September 2026)

## Konteks
Sebelumnya, setiap berkas scraper (`src/doujindesu.js`, `src/nekopoi.js`, `src/hentaitv.js`, `src/eporner.js`) bersifat monolitik: menggabungkan logika transport HTTP, parsing string regex/DOM, manajemen state, enkripsi, dan transformasi DTO dalam satu berkas besar (300–650 baris). Hal ini melanggar *Single Responsibility Principle* (SRP) dan menyulitkan pengujian parser tanpa mock jaringan.

## Keputusan
Mengadopsi pola pemisahan modular dari repositori referensi **WibuDex** (`Ackerman237/WibuDex`):
1. **`crypto.js`**: Algoritma enkripsi/dekripsi Doujindesu diisolasi murni tanpa state atau network.
2. **`parser.js`**: Seluruh parsing HTML/JSON/RSC dijadikan *100% pure functions* yang hanya menerima string mentah dan mengembalikan DTO bersih.
3. **`client.js`**: Seluruh konfigurasi header, User-Agent, origin assertion, dan panggilan HTTP dipusatkan di layer client.
4. **`src/<provider>.js`**: Berfungsi sebagai *Facade Orchestrator* tipis untuk mempertahankan kompatibilitas 100% dengan ekspor publik yang sudah ada.

## Konsekuensi
- **Positif**:
  - Logika parser dapat diuji secara terisolasi tanpa mock fetch (menghasilkan penambahan 39 pure unit tests baru).
  - Algoritma kriptografi Doujindesu teruji deterministik dengan golden test.
  - Zero breaking changes untuk consumer yang sudah mengimpor library.
- **Trade-off**:
  - Jumlah berkas bertambah di dalam `src/sources/`, tetapi struktur folder tetap terorganisir per provider.
