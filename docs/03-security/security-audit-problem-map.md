# Security Audit & Problem Map — Self-Hosted Manga Reader

| | |
|---|---|
| **Project** | `self-hosted-manga-reader` (package `doujin-scraper`) |
| **Repository** | `self-hosted-manga-and-anime` |
| **Versi dokumen** | 2 — disusun agar bisa dibaca manusia dan dieksekusi AI agent (Antigravity) |
| **Terakhir diperbarui** | 2026-09-19 |
| **Regression test terakhir** | `test/security.test.mjs` → 84/84 lulus (seluruh suite 97/97 lulus offline) |

> Dokumen ini adalah **peta status dan instruksi kerja**, bukan sertifikat aman.
> Bagian yang belum ditandai selesai **tidak boleh dianggap aman**.

---

## 0. Baca ini dulu (ringkasan untuk AI agent)

1. Proyek ini backend scraper Node.js yang mengambil data dari internet. Fokus fase ini: **security core**, yaitu batas kepercayaan (trust boundary) saat backend berbicara dengan internet.
2. Kerjakan **satu task per sesi**, berurutan: T1 → T2 → T3 → T4 → T5 → T6 (Bagian 7). Jangan menjalankan beberapa task paralel karena semuanya menyentuh lapisan HTTP/scraper yang sama dan akan bentrok.
3. Setiap task memakai pola: **audit read-only → laporkan temuan → patch kecil → tes → berhenti dan lapor**.
4. Jangan mengubah hal di luar scope task. Jangan refactor besar. Jangan menyentuh proxy, rate limiting, atau frontend (Bagian 10).
5. Jangan mengubah tes yang sudah ada supaya lulus. Kalau tes lama gagal setelah patch, patch-nya yang salah, kecuali kamu bisa membuktikan tesnya keliru dan melaporkannya.
6. Jangan mengarang nama file, fungsi, atau nilai konfigurasi. Kalau belum kamu lihat di kode, cari dulu (Bagian 3) atau tanyakan.

---

## 1. Perubahan dibanding versi 1

| Tambahan | Alasan |
|---|---|
| Aturan kerja agent, format laporan, kondisi berhenti (Bagian 2) | Agent butuh batas yang eksplisit |
| Peta kode + perintah penemuan (Bagian 3) | Agent tidak boleh menebak lokasi kode |
| Baseline tes yang sudah diketahui (Bagian 4) | Membedakan kegagalan baru dari kegagalan lama |
| Kontrak fungsi keamanan (Bagian 6) | Mencegah salah pakai `sanitizeUrl` / `safeHttpUrl` |
| Task T0–T6 dengan audit, patch, tes wajib, dan acceptance criteria | Dari "masalah" menjadi "pekerjaan yang bisa diperiksa" |
| Guard `new URL(path, base)` (T1) | Path seperti `//evil.com` bisa mengganti host dan **ikut membawa secret** |
| Strip header rahasia saat redirect lintas-origin (T2) | Redirect bisa membocorkan `X-App-Secret` walau URL awal sah |
| Blokir downgrade `https → http` dan batas jumlah redirect (T2) | Celah redirect yang umum |
| Batas cache berdasarkan **ukuran**, bukan hanya jumlah entry (T5) | 500 entry × HTML 5 MB tetap bisa menghabiskan RAM |
| Pemisahan `smoke.mjs` dari `node --test` (T0) | Suite tidak boleh merah karena situs eksternal down |
| Dua tes username/password yang belum masuk (T0) | `user@` dan `:pass@` diperiksa terpisah oleh kode |
| Guard test agar `fetch(` mentah tidak muncul lagi (T6) | Perlindungan redirect tidak boleh diam-diam hilang |
| Rencana DNS rebinding sebagai Fase 2 (T7) | Menutup celah TOCTOU yang sudah dijelaskan di versi 1 |
| Tabel angka batas yang masih harus diputuskan (Bagian 8) | Agent tidak boleh memilih angka sendiri tanpa label "usulan" |

---

## 2. Aturan kerja untuk agent

### 2.1 Wajib

- Jalankan `git status --short` sebelum mulai. Kalau ada perubahan yang belum di-commit dan bukan milikmu, laporkan dan berhenti.
- Lakukan **audit read-only dulu** dan tulis temuanmu sebelum mengubah file.
- Buat patch sekecil mungkin. Satu masalah, satu patch.
- **Tulis tes dulu**, jalankan, dan pastikan tes baru gagal pada kode lama (bukti tesnya menangkap masalah). Baru terapkan patch.
- Jalankan `node --test .\test\security.test.mjs` setelah setiap patch. Kalau ada tes lain yang relevan, jalankan juga.
- Gunakan nilai palsu untuk secret di tes (misalnya `test-secret-not-real`). Jangan pernah menulis secret asli ke file, log, atau laporan.
- Tes tidak boleh memakai jaringan sungguhan. Gunakan dependency injection atau stub (contoh di Lampiran A).
- Ikuti gaya kode yang sudah ada (ESM, penamaan, komentar berbahasa Indonesia atau Inggris sesuai file).
- Pertahankan signature API publik yang diekspor dari `src/index.js`, kecuali task secara eksplisit meminta perubahan.

### 2.2 Dilarang

- Refactor lintas banyak file "sekalian".
- Mengubah proxy, rate limiting, UI/frontend, atau logika scraping di luar scope task.
- Menghapus, melemahkan, atau melewati (`skip`) tes keamanan.
- Menambah dependency baru tanpa izin. Kalau perlu, jelaskan alasannya dan tunggu keputusan.
- Menjalankan `git commit`, `git push`, atau `git stash` kecuali diminta secara eksplisit.
- Membuat request ke situs eksternal dari kode tes.
- Menyimpulkan "aman" hanya karena tes lulus. Laporkan juga apa yang **tidak** teruji.

### 2.3 Format laporan setelah setiap task

```text
TASK: T?
TEMUAN AUDIT: (file:baris, apa yang ditemukan)
PERUBAHAN: (file, ringkasan diff)
TES BARU: (nama tes, hasil sebelum patch = gagal, sesudah patch = lulus)
HASIL: node --test .\test\security.test.mjs → pass/fail
TIDAK TERUJI / RISIKO TERSISA:
KEPUTUSAN YANG DIBUTUHKAN DARI MANUSIA:
```

### 2.4 Berhenti dan tanya jika

- Kode nyata tidak cocok dengan asumsi dokumen ini (misalnya fungsi yang disebut tidak ada).
- Patch akan mengubah perilaku publik atau membuat tes lama gagal.
- Kamu perlu menentukan angka batas (Bagian 8) atau memilih antara dua desain.
- Ada temuan keamanan di luar scope. **Laporkan saja, jangan perbaiki.**

---

## 3. Peta proyek

### 3.1 Yang sudah diketahui

| Lokasi | Isi |
|---|---|
| `src/security.js` | `isSafeExternalUrl`, `sanitizeUrl`, `safeHttpUrl`, `stripHtml` |
| `src/index.js` | Re-export API publik, termasuk fungsi security (baris ±58) |
| `src/cache.js` | Cache (`Map`), dengan `get`/`set`/`clearCache` |
| `test/security.test.mjs` | Tes keamanan (Node built-in test runner) |
| `test/crypto.test.mjs`, `test/import.test.mjs` | Tes crypto dan impor export |
| `test/smoke.mjs` | Smoke test **ke situs live** (bukan unit test) |
| Sumber scraper | Doujindesu (butuh `DOUJIN_APP_SECRET` + `DOUJIN_SALT`), NekoPoi, Hentai.tv, Eporner |
| `.proxy-cache.json` | Cache proxy Eporner (di luar security core) |

### 3.2 Yang belum diketahui — temukan dulu, jangan menebak

Jalankan dari root repo (PowerShell) dan simpan hasilnya di laporan audit:

```powershell
# Semua pemanggilan fetch
Get-ChildItem -Path src -Recurse -Include *.js,*.mjs | Select-String -Pattern '\bfetch\s*\('

# Semua pembacaan body response
Get-ChildItem -Path src -Recurse -Include *.js,*.mjs | Select-String -Pattern '\.(text|json|arrayBuffer|blob)\s*\('

# Opsi redirect dan timeout yang sudah ada
Get-ChildItem -Path src -Recurse -Include *.js,*.mjs | Select-String -Pattern 'redirect\s*:|AbortSignal\.(timeout|any)'

# Secret, baseUrl, dan konfigurasi
Get-ChildItem -Path src -Recurse -Include *.js,*.mjs | Select-String -Pattern 'X-App-Secret|x-app-secret|DOUJIN_APP_SECRET|DOUJIN_SALT|baseUrl|configureDoujin'

# Struktur cache
Get-ChildItem -Path src -Recurse -Include *.js,*.mjs | Select-String -Pattern 'new Map\('

# Semua yang memanggil fungsi security
Get-ChildItem -Recurse -Include *.js,*.mjs,*.ts . | Where-Object { $_.FullName -notmatch 'node_modules' } | Select-String -Pattern 'sanitizeUrl|safeHttpUrl|isSafeExternalUrl|stripHtml'
```

---

## 4. Baseline dan perintah verifikasi

```powershell
node --test .\test\security.test.mjs   # tes keamanan (harus selalu hijau)
node --test                            # seluruh suite
```

**Baseline yang sudah diketahui (bukan regresi dari pekerjaan security):**

- `security.test.mjs`: 44/44 lulus.
- `crypto.test.mjs` dan `import.test.mjs`: lulus.
- `smoke.mjs`: gagal pada 4 pemeriksaan Eporner dengan `fetch failed` (error jaringan). Node menjalankan semua file `.js/.mjs` di folder `test/` secara default, sehingga smoke test ikut terhitung. Ini diselesaikan di T0.
- Peringatan `DOUJIN_APP_SECRET / DOUJIN_SALT are not set` di log adalah normal pada lingkungan tes.

---

## 5. Status saat ini

| Area | Status | Keterangan |
|---|---|---|
| Basic SSRF validation | Selesai | URL private/local diblok sebelum request, dan koneksi dilindungi dari DNS rebinding / TOCTOU via socket-level lookup di createSafeDispatcher (T7) |
| DNS resolution failure | Selesai | DNS gagal → fail closed |
| Dangerous URL scheme sanitization | Selesai | Allowlist `http`/`https`, control character dibuang |
| URL credentials | Selesai | `user:pass@` ditolak sebelum DNS lookup |
| Security regression tests | Selesai | 125/125 lulus (T0–T7 + Proxy + Rate Limiting) |
| Basic timeout | Sebagian selesai | Beberapa scraper memakai `AbortSignal.timeout()` |
| **Credential/source isolation** | Selesai | `baseUrl` allowlist, origin guard `buildSourceUrl`, isolasi secret (T1) |
| **Redirect security** | Selesai | `safeFetch` manual redirect, validasi per-hop, strip header sensitif lintas origin, cegah downgrade https->http (T2) |
| **Response size limit** | Selesai | `readTextLimited` / `readJsonLimited` dengan streaming size check diterapkan di semua scraper (T3) |
| **Input bounds** | Selesai | `assertSlug`, `assertInt`, `assertQuery`, `InvalidInputError`, dan `encodeURIComponent` diterapkan di semua scraper (T4) |
| **Cache bounds** | Selesai | LRU eviction `MAX_CACHE_ENTRIES` (500), batas panjang key `MAX_KEY_LENGTH` (512), larangan cache error/null (T5) |
| **Proxy hardening** | Selesai | `isSafeProxyUrl` (anti-SSRF via proxy), batas provider (2 MB), batas body proxy (5 MB), batas memori `state.bad` (5000), direct & fallback direct via `safeFetch` |
| **Rate limiting & anti-abuse** | Selesai | Inbound rate limiter sliding window (`RateLimiter`, eviksi LRU `maxKeys`, middleware Connect/Express, handler Web Fetch), client IP (Cloudflare, X-Forwarded-For), dan outbound `UpstreamThrottler` (pacing host & 429 cooldown) |
| UI/frontend security | Ditunda | Saat frontend dibangun |

---

## 6. Model ancaman dan kontrak fungsi

### 6.1 Trust boundary

```text
INPUT (dari pemanggil / pengguna)
  ↓  type check → length/range check → format check
VALIDASI URL
  ↓  sanitizeUrl → resolve terhadap base URL → isSafeExternalUrl
REQUEST
  ↓  timeout, tanpa secret ke host tak tepercaya
REDIRECT
  ↓  manual, validasi tiap hop, strip header rahasia lintas-origin
RESPONSE EKSTERNAL
  ↓  batas ukuran saat membaca body
PARSING
  ↓  stripHtml / parser (bukan pengganti escaping)
CACHE
     batas jumlah entry + ukuran + TTL
```

Setiap tahap punya batasnya sendiri. Timeout dan validasi URL awal **tidak** menggantikan tahap lain.

### 6.2 Kontrak fungsi yang sudah ada

| Fungsi | Tugas | Bukan tugasnya |
|---|---|---|
| `isSafeExternalUrl(url)` | Menentukan apakah **server boleh mengakses** URL: skema, kredensial, port, hostname lokal, IP private/loopback/link-local, hasil DNS. Fail closed | Membersihkan URL untuk dirender |
| `sanitizeUrl(input)` | Membersihkan URL yang akan disimpan/dirender: buang control character, allowlist skema `http`/`https`, kembalikan versi yang sudah dibersihkan. Relative URL dan `//host/path` dikembalikan apa adanya | **Bukan** perlindungan SSRF |
| `safeHttpUrl(input)` | Memastikan URL http/https yang bisa di-parse, dinormalisasi (`https://example.com` → `https://example.com/`) | **Bukan** perlindungan SSRF |
| `stripHtml(html)` | Menghapus tag HTML untuk teks | **Bukan** escaping. Kalau hasilnya dimasukkan ke HTML, tetap harus di-escape |

**Urutan wajib untuk URL dari data eksternal:**

```text
sanitizeUrl → resolve terhadap base URL (new URL(x, base)) → isSafeExternalUrl → fetch
```

Validasi SSRF dilakukan pada URL **hasil resolve**, bukan string mentah.

### 6.3 Catatan perilaku yang sudah diketahui

- Browser membuang tab, LF, dan CR dari mana saja di dalam URL (spesifikasi WHATWG), sehingga `java\tscript:` dieksekusi sebagai `javascript:`. Itu alasan control character dibuang sebelum cek skema.
- `sanitizeUrl('localhost:3000/x')` terbaca sebagai skema `localhost` dan ditolak. Ini fail-safe dan disengaja.
- Browser memperlakukan `\` seperti `/` pada URL http(s), jadi `\\evil.com` setara `//evil.com`. Aman selama alurnya melewati resolve lalu `isSafeExternalUrl`.
- Tes `mengizinkan HTTPS biasa` butuh DNS/jaringan. Sifatnya flaky di CI yang dibatasi (lihat T7).

---

## 7. Task

### T0 — Rapikan sisa fase sebelumnya (kecil)

**Masalah.** Ada tiga hal kecil yang tertinggal: dua tes username/password belum ada, `smoke.mjs` membuat suite merah karena jaringan, dan file lokal yang sensitif mungkin ikut ter-commit.

**Risiko bila dibiarkan.** Perubahan `||` menjadi `&&` pada cek kredensial tidak akan ketahuan. Suite yang sering merah membuat kegagalan asli diabaikan. Secret atau daftar proxy bisa bocor lewat git.

**Perubahan yang diminta.**

1. Tambahkan dua entri ke daftar `blocked` di `describe('isSafeExternalUrl')`:
   ```js
   'http://user@example.com',
   'http://:pass@example.com',
   ```
2. Pindahkan `test/smoke.mjs` ke `scripts/smoke.mjs` (`git mv`). Tambahkan di `package.json`:
   ```json
   "scripts": {
     "test": "node --test",
     "smoke": "node scripts/smoke.mjs"
   }
   ```
   Sesuaikan jika `scripts` sudah ada. Jangan mengubah isi smoke test.
3. Audit `.gitignore` dan riwayat file:
   ```powershell
   Get-Content .gitignore
   git ls-files | Select-String -Pattern '\.env|proxy-cache|secret'
   ```
   Kalau `.env` atau `.proxy-cache.json` ter-track, **laporkan, jangan hapus dari git sendiri**. Sarankan `git rm --cached` dan penambahan ke `.gitignore`, lalu tunggu persetujuan.

**Acceptance.** `node --test` tidak lagi menjalankan smoke test. `npm run smoke` menjalankannya. Dua tes baru lulus.

**Commit.** `test: cover partial URL credentials; move smoke test out of unit suite`

---

### T1 — Credential / secret isolation

**Masalah.** Doujindesu memakai `DOUJIN_APP_SECRET` dan `DOUJIN_SALT`, dan request API mengirim header `X-App-Secret`. Kalau `configureDoujin({ baseUrl })` bisa diarahkan ke host sembarang, secret terkirim ke server yang tidak tepercaya.

**Risiko.** Kebocoran secret ke pihak ketiga, baik lewat konfigurasi yang salah, path yang mengubah host, maupun redirect.

**Audit dulu (read-only), jawab dengan file:baris.**

- Bagaimana `configureDoujin()` menerima dan menyimpan `baseUrl`? Ada validasi?
- Apa default `baseUrl`? Itu satu-satunya origin tepercaya.
- Di mana header `X-App-Secret` / `x-app-secret` dibentuk? Apakah **selalu** dikirim, atau hanya ke origin tepercaya?
- Bagaimana URL akhir dibangun dari `baseUrl` + path? Kalau memakai `new URL(path, base)` atau konkatenasi string, apakah path `//evil.com/x` atau `https://evil.com` bisa mengganti host?
- Apakah secret, salt, atau header pernah masuk ke: pesan error, `console.*`, cache key, objek yang dikembalikan ke pemanggil?
- Header `X-App-Secret` dan `x-app-secret` sama di HTTP (nama header tidak peka huruf besar/kecil). Kalau keduanya diberikan sebagai objek biasa, `Headers` menggabungkannya, kemungkinan nilainya terkirim dua kali (`secret, secret`). Verifikasi apakah ini terjadi dan apakah server memang butuh itu. Laporkan, jangan ubah tanpa bukti.

**Perubahan yang diminta.**

1. Tentukan origin tepercaya dari **default yang ada di kode**. Jangan mengarang host.
2. Validasi `baseUrl` di `configureDoujin()`: harus `https:`, tanpa username/password, tanpa port non-standar, dan hostname termasuk allowlist. Kalau tidak lolos → **throw error yang jelas** (fail closed), bukan diam-diam diabaikan.
3. Semua header rahasia dibuat lewat **satu fungsi** (misalnya `buildAuthHeaders(url)`) yang hanya mengembalikan secret jika `url.origin === trustedOrigin`. Tidak boleh ada tempat lain yang menulis header itu.
4. Semua pembangunan URL dari input memakai guard origin (Lampiran A.4).
5. Pastikan secret tidak muncul di URL, query string, pesan error, log, dan cache key.

**Keputusan untuk manusia.** Apakah `baseUrl` kustom (mirror atau reverse proxy sendiri) perlu didukung? Usulan: **tidak** secara default. Kalau perlu, wajib opt-in eksplisit, misalnya `configureDoujin({ baseUrl, trustedHosts: ['host-saya.example'] })` dengan default kosong.

**Tes wajib.**

- `configureDoujin({ baseUrl: 'https://evil.example' })` → throw.
- `baseUrl` dengan `http:`, `user:pass@`, port non-standar → throw.
- Request ke origin tepercaya membawa header rahasia. Request ke origin lain **tidak** membawa (tangkap header lewat `fetchImpl` palsu).
- Guard origin menolak `//evil.com/x`, `https://evil.com`, dan `\\evil.com`. Menerima `/path/ok`.
- Nilai secret palsu tidak muncul di pesan error atau output log tes.

**Acceptance.** Tidak ada jalur kode yang mengirim secret ke origin selain yang tepercaya. Tes membuktikannya.

**Di luar scope.** Redirect (T2), proxy.

**Commit.** `security: restrict Doujindesu baseUrl and scope secret headers to trusted origin`

**Prompt agent.**
```text
Kerjakan T1 di security-audit-problem-map.md. Mulai dengan audit read-only:
jawab semua pertanyaan audit T1 dengan file:baris, jangan ubah file dulu.
Setelah itu tulis tes yang gagal pada kode lama, lalu patch minimal.
Jangan sentuh redirect, proxy, atau scraper lain. Laporkan dengan format 2.3.
```

---

### T2 — Redirect validation

**Masalah.** `fetch()` mengikuti redirect secara default. URL awal bisa lolos `isSafeExternalUrl`, lalu redirect mengarah ke `http://127.0.0.1:3000/admin`. Hentai.tv `/random` sudah memakai `redirect: 'manual'`, tetapi sebagian request lain belum.

**Risiko.** SSRF lewat redirect. Header rahasia ikut terkirim ke origin lain.

**Audit dulu.**

- Daftar semua `fetch(` di `src` (Bagian 3.2), dikelompokkan: (a) URL dari input/data eksternal, (b) URL tetap dari kode (misalnya provider proxy).
- Untuk tiap panggilan: pakai `redirect: 'manual'`? Ada `Location` handling? Ada timeout?
- Panggilan mana yang membawa header rahasia (dari T1)?

**Perubahan yang diminta.**

1. Buat **satu titik masuk** `safeFetch(url, init, deps?)` (lokasi disarankan `src/http.js`) yang:
   - selalu memakai `redirect: 'manual'`;
   - memvalidasi URL awal dan **setiap hop** dengan `isSafeExternalUrl`;
   - me-resolve `Location` relatif terhadap URL saat ini;
   - membatasi jumlah redirect (usulan 5, Bagian 8);
   - memblokir downgrade `https → http`;
   - membuang header rahasia (`x-app-secret`, `authorization`, `cookie`) saat origin berubah;
   - mengubah method menjadi `GET` tanpa body pada 303 (dan pada 301/302 untuk POST);
   - menutup body response redirect (`res.body?.cancel()`);
   - menerima `fetchImpl` dan `validate` lewat argumen ketiga agar bisa dites tanpa jaringan.
   Contoh implementasi ada di Lampiran A.1. Itu **referensi**, sesuaikan dengan gaya kode.
2. Ganti panggilan kategori (a) ke `safeFetch`. Migrasi **satu scraper per patch**, tes setelah masing-masing.
3. Panggilan kategori (b) yang sengaja tetap memakai `fetch` mentah harus diberi komentar `// safe-fetch-exempt: <alasan>`.
4. Rancang `safeFetch` sebagai satu-satunya tempat request keluar, supaya pinning IP untuk DNS rebinding (T7) nanti cukup mengubah satu file.

**Tes wajib** (pakai `fetchImpl` palsu yang mengembalikan `new Response(null, { status: 302, headers: { location: '...' } })`):

- 302 ke `http://127.0.0.1/admin` → ditolak, `fetchImpl` hanya terpanggil sekali.
- 302 ke `http://169.254.169.254/` → ditolak.
- `Location` relatif (`/next`) di-resolve terhadap URL saat ini.
- `Location` hilang → error yang jelas.
- Rantai lebih dari batas → error.
- `https → http` → ditolak.
- `X-App-Secret` dibuang saat pindah origin, tetap ada saat origin sama.
- `redirect: 'manual'` selalu diteruskan ke `fetchImpl`.
- 303 dari POST menjadi GET tanpa body.
- Response non-redirect dikembalikan apa adanya.

**Acceptance.** Tidak ada jalur request keluar dari input eksternal yang mengikuti redirect otomatis. Setiap hop divalidasi.

**Di luar scope.** Batas ukuran (T3), DNS pinning (T7), proxy.

**Commit.** `security: add safeFetch with per-hop redirect validation` (dan satu commit per scraper yang dimigrasi)

**Prompt agent.**
```text
Kerjakan T2. Audit semua fetch( dan kelompokkan (a) URL dari input/data eksternal
vs (b) URL tetap dari kode. Buat src/http.js dengan safeFetch (dependency injection
untuk fetchImpl dan validate). Tulis tes dengan fetchImpl palsu dulu. Migrasikan
SATU scraper per patch dan jalankan tes tiap kali. Jangan sentuh proxy Eporner.
```

---

### T3 — Batas ukuran response

**Masalah.** Pola `await res.text()` dan `res.json()` membaca seluruh body tanpa batas.

**Risiko.** Server (atau situs yang dikompromikan) mengirim body sangat besar → RAM naik → proses lambat atau crash (DoS).

**Audit dulu.** Daftar semua pembacaan body (Bagian 3.2), jenis kontennya (HTML/JSON), dan apakah ada pemanggil yang memang butuh body besar.

**Perubahan yang diminta.**

1. Tambahkan `readTextLimited(res, maxBytes)` dan `readJsonLimited(res, maxBytes)` (Lampiran A.2):
   - tolak lebih awal jika `Content-Length` melebihi batas (header ini **tidak dipercaya**, hanya optimasi);
   - baca stream sambil menghitung byte, **hentikan** (`reader.cancel()`) begitu melewati batas, lalu throw `ResponseTooLargeError`;
   - jangan pernah memanggil `res.text()` atau `res.json()` langsung pada response eksternal.
2. Ganti pembacaan body di tiap scraper, **satu scraper per patch**.
3. Pastikan timeout juga mencakup fase pembacaan body (sinyal abort yang sama diteruskan ke `fetch`).
4. Nilai batas berasal dari konstanta bernama (`MAX_RESPONSE_BYTES_HTML`, `MAX_RESPONSE_BYTES_JSON`). **Nilai final belum diputuskan** (Bagian 8). Pakai usulan dan beri label.

**Tes wajib.**

- `Content-Length` > batas → throw tanpa membaca body.
- Tanpa `Content-Length`, stream melewati batas → throw, dan `cancel()` terpanggil.
- Tepat sebesar batas → lolos.
- Karakter UTF-8 multi-byte yang terpotong di antara dua chunk terdekode benar.
- JSON rusak → error parse yang jelas, bukan crash.

**Catatan.** Byte dihitung setelah dekompresi (gzip/br) karena `fetch` mendekompresi otomatis. Itu memang perilaku yang diinginkan untuk membatasi RAM. Kalau ada sumber non-UTF-8, tangani `charset` dari `Content-Type`.

**Acceptance.** Tidak ada pembacaan body eksternal tanpa batas.

**Commit.** `security: enforce response size limits when reading external bodies`

---

### T4 — Input bounds

**Masalah.** Parameter seperti `slug`, `page`, `limit`, `query`, `category`, `genre`, `id`, dan `path` belum divalidasi secara konsisten.

**Risiko.** Request upstream tidak masuk akal, query berat, parser bekerja terlalu lama, jumlah cache key meledak, dan path yang mengubah host (terkait T1).

**Audit dulu.** Buat tabel dari semua fungsi `scrape*` yang diekspor:

```text
fungsi | parameter | tipe sekarang | dipakai sebagai (path/query/cache key) | batas usulan | format
```

Ambil contoh **slug nyata** dari tiap sumber sebelum mengetatkan format. Jangan memutus fungsi yang sekarang berjalan.

**Perubahan yang diminta.**

1. Buat helper validator terpusat (Lampiran A.3): `assertSlug`, `assertInt`, `assertQuery`.
2. Urutan: type check → length/range check → format check → baru dipakai.
3. Nilai yang masuk ke path selalu di-`encodeURIComponent`. Tolak `..`, `/`, `\`, `?`, `#`, dan `%2f` pada slug.
4. Input tidak valid melempar error bertipe yang sama (misalnya `InvalidInputError`). Ikuti konvensi error yang sudah ada di codebase.
5. Terapkan **per scraper**, satu patch per scraper.

**Tes wajib** (tabel input):

- Bukan string, kosong, terlalu panjang, control character.
- `page`: `0`, `-1`, `1.5`, `'abc'`, `1e9`, `NaN`.
- `limit` di atas maksimum.
- Slug dengan `../`, `/`, `?x=1`, `%2f`, dan `//evil.com`.
- Slug nyata dari tiap sumber tetap lolos.

**Acceptance.** Setiap input yang membentuk request upstream atau cache key punya batas tipe, panjang/rentang, dan format yang teruji.

**Commit.** `security: add input bounds for <scraper> parameters`

---

### T5 — Batas cache

**Masalah.** Cache berbentuk `Map` dengan TTL, tetapi TTL bukan batas jumlah entry.

**Risiko.** Banyak key unik (`request A, B, C, …`) membuat cache tumbuh tanpa batas. Selain itu, membatasi jumlah entry saja belum cukup: 500 entry berisi HTML 5 MB masih bisa mencapai ±2,5 GB.

**Audit dulu.** Apa yang disimpan (HTML mentah atau hasil parse)? Bagaimana key dibuat, dan apakah berasal dari input pengguna (terkait T4)? Ada `clearCache`? Siapa saja pemanggilnya?

**Perubahan yang diminta.**

1. `MAX_CACHE_ENTRIES` dengan eviction LRU (Lampiran A.5): `get` menandai entry sebagai baru dipakai, `set` membuang yang paling lama saat penuh.
2. Simpan **hasil parse** yang kecil, bukan HTML mentah. Kalau nilai bisa besar, tambahkan batas total ukuran perkiraan (`MAX_CACHE_BYTES`) atau tolak menyimpan nilai di atas ambang.
3. Batasi panjang key (usulan ≤ 512 karakter) dan jangan cache hasil error.
4. Pertahankan API publik (`get`/`set`/`clearCache`) dan perilaku TTL yang ada.

**Tes wajib.**

- Ukuran cache tidak pernah melebihi batas setelah banyak `set`.
- LRU: entry yang paling lama tidak dipakai dibuang lebih dulu; `get` menyegarkan urutan.
- TTL kedaluwarsa tetap bekerja.
- `clearCache` mengosongkan semuanya.
- Nilai di atas ambang tidak disimpan (jika ambang dipakai).

**Acceptance.** Memori cache punya batas atas yang jelas.

**Commit.** `security: bound cache size with LRU eviction`

---

### T6 — Tutup fase security core

1. Jalankan ulang perintah penemuan (Bagian 3.2). Pastikan tidak ada `fetch(` mentah di luar `safeFetch` selain yang diberi `// safe-fetch-exempt`.
2. **(Disarankan)** Tambahkan *guard test* yang memindai `src/**/*.js` dan gagal bila menemukan `fetch(` di luar `src/http.js` tanpa komentar `safe-fetch-exempt`. Ini mencegah perlindungan redirect hilang diam-diam.
3. Jalankan `npm audit` dan laporkan hasilnya. Jangan menjalankan `npm audit fix` tanpa persetujuan.
4. Jalankan `node --test` dan pastikan hijau tanpa smoke test.
5. Perbarui tabel status (Bagian 5) dan tanggal dokumen ini.
6. Periksa semua item di Bagian 11 (Definition of Done).

**Commit.** `security: close security-core phase`

---

### T7 — Fase 2: DNS rebinding / TOCTOU (setelah security core)

**Masalah.** `isSafeExternalUrl` melakukan DNS lookup, lalu `fetch()` melakukan lookup lagi. Di antara dua lookup itu, domain bisa berpindah ke IP private.

```text
1. Cek:   example.com → IP publik   (lolos)
2. Fetch: example.com → 127.0.0.1   (kena)
```

**Arah solusi** (putuskan bersama manusia sebelum dikerjakan):

- **A. Validasi saat koneksi (usulan).** Jalankan request lewat dispatcher `undici` dengan fungsi `lookup` kustom yang menolak IP private **pada saat koneksi dibuat**. Perlu versi `undici` yang kompatibel dengan `fetch` bawaan Node yang dipakai (uji di versi Node proyek) dan kemungkinan menambah dependency.
- **B. Resolve sekali, lalu koneksi ke IP.** Rumit untuk HTTPS (SNI dan validasi sertifikat). Tidak disarankan kecuali A tidak cukup.
- Jadikan resolver DNS bisa di-inject sehingga tes `mengizinkan HTTPS biasa` tidak butuh jaringan.

Karena semua request sudah lewat `safeFetch` (T2), perubahan ini cukup di satu file.

**Status.** Selesai. Diimplementasikan via `createSafeDispatcher` (`undici.Agent` dengan hook `connect.lookup` yang memverifikasi setiap alamat IP yang di-resolve menggunakan `looksLikeIp`). `safeFetch` menggunakan custom dispatcher ini secara default dan mendukung injeksi `dnsLookup` kustom untuk pengujian offline. 99/99 tes lulus.

**Commit.** `security: prevent DNS rebinding via undici safe dispatcher`

---

## 8. Keputusan terbuka (angka batas)

Nilai berikut adalah **usulan**. Agent memakainya sebagai default berlabel, dan manusia yang memutuskan nilai final.

| Konstanta | Usulan | Status |
|---|---|---|
| `MAX_REDIRECTS` | 5 | Usulan |
| Timeout request (termasuk baca body) | 15 detik | Usulan |
| `MAX_RESPONSE_BYTES_HTML` | 5 MB | Usulan |
| `MAX_RESPONSE_BYTES_JSON` | 2 MB | Usulan |
| `MAX_CACHE_ENTRIES` | 500 | Usulan |
| Panjang key cache maksimum | 512 karakter | Usulan |
| `slug` | ≤ 128 karakter, format menyesuaikan slug nyata tiap sumber | Usulan |
| `page` | integer 1–1000 | Usulan |
| `limit` | integer 1–100 | Usulan |
| `query` | ≤ 100 karakter, control character dibuang | Usulan |

---

## 9. Catatan keputusan (decision log)

| Keputusan | Alasan |
|---|---|
| `sanitizeUrl` hanya mengizinkan `http` dan `https` (tanpa `mailto`) | Scraper konten tidak butuh skema lain. Allowlist otomatis menolak skema baru |
| `//host/path` dan URL relatif **tidak** ditolak oleh `sanitizeUrl` | Scraper sering menemui `src="//cdn.situs.com/a.jpg"` yang sah. SSRF ditangani setelah resolve oleh `isSafeExternalUrl` |
| URL dengan username/password ditolak di `isSafeExternalUrl`, sebelum DNS lookup | Tidak dibutuhkan scraper dan membuka kebingungan parser (`http://a.com@127.0.0.1/`) |
| Control character dibuang **sebelum** cek skema, dan hasil yang sudah dibersihkan dikembalikan | Yang diperiksa harus sama dengan yang dirender |
| `sanitizeUrl` dan `isSafeExternalUrl` dipisah tanggung jawabnya | XSS dan SSRF adalah masalah berbeda |
| Smoke test ke situs live tidak masuk `node --test` | Suite tidak boleh merah karena situs eksternal down |
| Proxy hardening dipisah dari security core | Request provider proxy berasal dari kode aplikasi, bukan input pengguna |
| Satu masalah → satu patch kecil → tes → commit | Refactor besar menyembunyikan regresi |

---

## 10. Ditunda (bukan bagian security core)

```text
[x] Rate limiting dan anti-abuse
[x] Proxy hardening (provider, pool, warm-up, health check, cooldown, fallback direct)
[ ] Output handling dan XSS di frontend (escaping, bukan hanya stripHtml)
[ ] Hardening deployment produksi
[ ] Logging tanpa secret + pemantauan
```

Urutan: **security core (selesai) → proxy hardening (selesai) → rate limiting (selesai) → frontend → produksi.**

---

## 11. Definisi "Security Core Selesai"

- [x] SSRF dasar terlindungi dan teruji.
- [x] Redirect tidak bisa melewati validasi SSRF (T2).
- [x] Secret tidak bisa dikirim ke host arbitrary, termasuk lewat path dan redirect (T1, T2).
- [x] Semua pembacaan body eksternal punya batas ukuran (T3).
- [x] Input yang membentuk request atau cache key punya batas (T4).
- [x] Cache punya batas jumlah dan ukuran (T5).
- [x] `node --test` hijau tanpa smoke test; `npm run smoke` terpisah (T0).
- [x] Tabel status (Bagian 5) diperbarui.

Security core selesai **bukan** berarti proyek 100% aman. DNS rebinding (T7) dan item Bagian 10 masih terbuka.

---

## 12. Checklist untuk setiap patch

1. **Masalah apa yang diperbaiki?**
2. **Apa risikonya bila tidak diperbaiki?**
3. **Tes apa yang membuktikan patch bekerja dan tidak merusak perilaku lama?**
4. Apakah tes baru **gagal** pada kode sebelum patch?
5. Apakah `node --test .\test\security.test.mjs` masih hijau?
6. Apakah scope patch hanya yang disepakati?
7. Apa yang **tidak** teruji oleh patch ini?

Kalau pertanyaan 1–3 belum terjawab, jangan mulai mengubah kode.

---

## Lampiran A — Snippet referensi

> Ini titik awal, bukan spesifikasi. Sesuaikan dengan gaya kode, API cache yang ada, dan konvensi error proyek. Baca kode nyata dulu.

### A.1 `safeFetch` (T2)

```js
// src/http.js
import { isSafeExternalUrl } from './security.js';

const MAX_REDIRECTS = 5; // usulan
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-app-secret'];

export class UnsafeUrlError extends Error {
  constructor(message = 'URL tidak diizinkan') {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

function parseUrl(value, base) {
  try {
    return new URL(value, base);
  } catch {
    throw new UnsafeUrlError('URL tidak valid');
  }
}

export async function safeFetch(input, init = {}, deps = {}) {
  const {
    fetchImpl = fetch,
    validate = isSafeExternalUrl,
    maxRedirects = MAX_REDIRECTS,
  } = deps;

  let current = parseUrl(input);
  let options = { ...init, redirect: 'manual' };

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!(await validate(current.href))) throw new UnsafeUrlError();

    const res = await fetchImpl(current.href, options);
    if (!REDIRECT_STATUS.has(res.status)) return res;

    const location = res.headers.get('location');
    await res.body?.cancel(); // buang body redirect
    if (!location) throw new Error('Redirect tanpa header Location');

    const next = parseUrl(location, current); // resolve terhadap URL saat ini

    if (current.protocol === 'https:' && next.protocol === 'http:') {
      throw new UnsafeUrlError('Downgrade https ke http diblokir');
    }

    if (next.origin !== current.origin) {
      const headers = new Headers(options.headers);
      for (const name of SENSITIVE_HEADERS) headers.delete(name);
      options = { ...options, headers };
    }

    const method = (options.method || 'GET').toUpperCase();
    if (res.status === 303 || ((res.status === 301 || res.status === 302) && method === 'POST')) {
      options = { ...options, method: 'GET', body: undefined };
    }

    current = next;
  }

  throw new Error('Terlalu banyak redirect');
}
```

Catatan: `validate` (dan DNS-nya) hanya dipanggil untuk URL yang lolos parse. Timeout dan `AbortSignal` diteruskan lewat `init.signal`.

### A.2 Membaca body dengan batas (T3)

```js
export class ResponseTooLargeError extends Error {
  constructor(maxBytes) {
    super(`Response melebihi batas ${maxBytes} byte`);
    this.name = 'ResponseTooLargeError';
  }
}

export async function readTextLimited(res, maxBytes) {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel();
    throw new ResponseTooLargeError(maxBytes);
  }
  if (!res.body) return '';

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let received = 0;
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new ResponseTooLargeError(maxBytes);
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export async function readJsonLimited(res, maxBytes) {
  return JSON.parse(await readTextLimited(res, maxBytes));
}
```

### A.3 Validator input (T4)

```js
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,127}$/i; // SESUAIKAN dengan slug nyata tiap sumber

export class InvalidInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export function assertSlug(value, name = 'slug') {
  if (typeof value !== 'string' || !SLUG_RE.test(value)) {
    throw new InvalidInputError(`${name} tidak valid`);
  }
  return value;
}

export function assertInt(value, { min, max, name = 'value' }) {
  const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new InvalidInputError(`${name} harus integer ${min}-${max}`);
  }
  return n;
}

export function assertQuery(value, { maxLength = 100, name = 'query' } = {}) {
  if (typeof value !== 'string') throw new InvalidInputError(`${name} harus string`);
  const cleaned = value.replace(/\p{Cc}/gu, '').trim();
  if (!cleaned || cleaned.length > maxLength) {
    throw new InvalidInputError(`${name} kosong atau terlalu panjang`);
  }
  return cleaned;
}
```

### A.4 Guard origin saat membangun URL (T1, T4)

```js
// new URL('//evil.com/x', 'https://a.com') → host evil.com. Guard ini mencegahnya.
export function buildSourceUrl(baseUrl, path) {
  const base = new URL(baseUrl);
  const url = new URL(path, base);
  if (url.origin !== base.origin) {
    throw new UnsafeUrlError('Path mengubah origin');
  }
  return url;
}
```

### A.5 Cache LRU dengan batas (T5)

```js
const MAX_CACHE_ENTRIES = 500; // usulan
const cache = new Map();

export function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key); // pindahkan ke posisi terbaru (LRU)
  cache.set(key, entry);
  return entry.value;
}

export function cacheSet(key, value, ttlMs) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, { value, expires: Date.now() + ttlMs });
  while (cache.size > MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value); // buang yang paling lama
  }
}
```

---

## Lampiran B — Cara memakai dokumen ini di Antigravity

Format aturan yang dibaca Antigravity tidak saya verifikasi, jadi sesuaikan dengan dokumentasi IDE-mu.

1. Simpan file ini di repo (misalnya `docs/SECURITY_AUDIT.md`) supaya agent bisa membacanya.
2. Salin **Bagian 0 dan Bagian 2** ke file aturan/instruksi proyek yang didukung IDE (jika ada), supaya berlaku di setiap sesi.
3. Untuk setiap sesi, gunakan template:

```text
Baca docs/SECURITY_AUDIT.md (Bagian 0, 2, dan 6). Kerjakan HANYA task T<N>.
Mulai dengan audit read-only dan laporkan temuanmu dengan file:baris sebelum
mengubah file apa pun. Tulis tes yang gagal dulu, lalu patch minimal.
Jangan commit. Akhiri dengan laporan format Bagian 2.3.
```

4. Tinjau diff dan hasil tes sendiri sebelum `git commit`. Satu task, satu commit.
