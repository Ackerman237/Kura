# ADR-002: Proteksi SSRF & DNS Rebinding pada Level Socket Dispatcher

## Status
**Accepted & Implemented** (September 2026)

## Konteks
Pemeriksaan keamanan IP blacklist sederhana yang hanya dilakukan sebelum request (pre-flight validation via `dns.lookup()`) rentan terhadap serangan **TOCTOU (Time-of-Check to Time-of-Use)** melalui **DNS Rebinding**. Pada serangan ini, DNS server penyerang mengembalikan IP publik yang sah saat dicek pertama kali, namun me-resolve ke IP privat/loopback internal (`127.0.0.1`, `169.254.169.254`) saat koneksi HTTP aktual dieksekusi sepersekian milidetik kemudian.

## Keputusan
Menggunakan `undici.Agent` dengan custom socket dispatcher di `src/http.js`:
1. Menerapkan hook pada callback `lookup` dan `connect` di level pembukaan socket TCP Undici.
2. Memeriksa IP target secara instan saat koneksi fisik TCP akan dibuat.
3. Memutuskan koneksi (`socket.destroy()`) seketika jika IP tujuan terindikasi berada di range privat atau loopback sebelum byte request pertama dikirimkan ke jaringan.

## Konsekuensi
- **Positif**:
  - Kerentanan TOCTOU DNS Rebinding tertutup secara tuntas pada level transport.
  - Tidak ada dependensi C/C++ native addons; tetap menggunakan Node.js built-in API + `undici`.
- **Trade-off**:
  - Menambah 1 dependensi eksternal (`undici`), tetapi ini merupakan standar industri resmi Node.js (engine dasar dari global `fetch` bawaan Node).
