# 04. Security Policy & Hardening Guidelines

## 1. Ikhtisar Keamanan
Sebagai engine yang berinteraksi secara aktif dengan jaringan luar (web scraping), security core project ini dirancang dengan prinsip **Zero Trust pada Jaringan Eksternal** dan **Pertahanan Berlapis (*Defense-in-Depth*)**.

Dokumen detail temuan audit lengkap per fase dapat dilihat pada:
👉 [**Security Audit & Problem Map (T0–T7)**](../audits/security-audit-problem-map.md)

---

## 2. Standar Proteksi yang Diterapkan

### A. Pencegahan SSRF & TOCTOU DNS Rebinding (T0, T2, T7)
1. **Validasi Skema & Port**:
   - Hanya skema `http:` dan `https:` yang diizinkan (`file:`, `ftp:`, `gopher:`, `javascript:` ditolak).
   - Port non-standar (misalnya `:8080`, `:22`, `:6379`) ditolak secara default.
2. **IP Blacklist & Private Range Enforcement**:
   - Seluruh blok IP privat dan link-local diblokir:
     - IPv4: `0.0.0.0/8`, `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10`.
     - IPv6: `::1`, `fc00::/7`, `fe80::/10`, IPv4-mapped IPv6 (`::ffff:127.0.0.1`).
     - Desimal & Heksadesimal: `2130706433`, `0x7f.0.0.1`.
3. **Koneksi Socket Undici (Anti-TOCTOU)**:
   - Pemeriksaan IP tidak hanya dilakukan di awal request (pre-fetch), melainkan juga di-hook langsung pada callback `lookup` dan `connect` di level TCP socket Undici. Jika DNS me-resolve domain target ke IP internal pada saat socket dibuat, koneksi langsung diputus seketika.

### B. Isolasi Kredensial & Origin Guard (T1)
- Kredensial rahasia (`X-App-Secret` Doujindesu) **HANYA** dikirim jika hostname tujuan secara ketat cocok dengan origin terpercaya (`doujin.desu.xxx`).
- Jika request diarahkan atau dialihkan ke host lain, header rahasia langsung dibuang.

### C. Proteksi Ukuran Response (DoS Mitigation - T3)
- Ukuran stream response dibatasi secara ketat saat pembacaan chunk:
  - `MAX_RESPONSE_BYTES_JSON = 2 * 1024 * 1024` (2 MB)
  - `MAX_RESPONSE_BYTES_HTML = 5 * 1024 * 1024` (5 MB)
- Jika response melebihi batas (baik melalui header `Content-Length` maupun stream tak berujung), stream segera di-cancel dan `ResponseTooLargeError` dilempar untuk mencegah kehabisan heap memory Node.js.

### D. Sanitasi Input & Batas Parameter (T4)
- Seluruh input dari client diwajibkan melewati validator:
  - `assertSlug(slug, name)`: Membatasi panjang maksimal 200 karakter, menolak path traversal (`../`, `..\`), query string, dan karakter berbahaya.
  - `assertInt(val, opts)`: Memaksa konversi integer yang valid dalam batas min-max.
  - `assertQuery(q, opts)`: Menghapus control characters dan membatasi panjang pencarian.

### E. Rate Limiting & Anti-Abuse (T8)
- **Inbound Protection**: `RateLimiter` sliding-window berbasis LRU memory untuk membatasi lonjakan request per IP konsumen.
- **Outbound Protection**: `UpstreamThrottler` untuk mengatur jeda minimal antar-request ke host target dan menerapkan cooldown otomatis saat mendeteksi status HTTP 429 dari upstream.
