# Arsitektur Isolasi Iklan & Pemutar Video (3-Tier Playback Defense)

Dokumen ini mendokumentasikan spesifikasi arsitektur pemutar video untuk mengatasi popunder, iklan pembajak tab (*click hijacking*), dan pendeteksi anti-adblock pada penyedia video pihak ketiga (seperti Playmogo, DoodStream, StreamPoi pada sumber NekoPoi).

---

## 1. Problem Statement

Penyedia hosting video gratisan menerapkan teknik monetisasi agresif yang merusak pengalaman pengguna:
1. **Popunder & Tab Hijacking**: Event klik pertama pada tombol *Play* dimanfaatkan untuk memicu `window.open()`, mengganti `top.location.href`, atau membuat elemen transparan `target="_blank"` menuju situs judi/phishing.
2. **Anti-Sandbox Detector**: Script penyedia (seperti library `DisableDevtool` atau checker `/embedblocked`) secara aktif mendeteksi keberadaan atribut iframe sandbox standar. Jika atribut sandbox mendasar dipasang secara naif dari frontend, pemutar video menolak berputar (*blocked*).
3. **Cross-Domain Barrier**: Browser menerapkan *Same-Origin Policy* (SOP) ketat yang membuat parent window aplikasi kita mustahil mengintervensi atau mematikan skrip nakal di dalam iframe pihak ketiga secara langsung dari sisi klien.

---

## 2. Solusi 3-Tier Playback Architecture

Untuk menjamin pemutaran video selalu bersih tanpa merusak kompatibilitas, sistem menerapkan strategi 3 tingkatan pertahanan bertingkat:

```text
[ Pengguna Membuka Halaman Tonton ]
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Native Stream Extraction (Prioritas Utama ⭐)        │
│ - Ekstraksi URL direct MP4 dari CDN penyedia di sisi server │
│ - Diputar di tag <video> native buatan kita sendiri         │
│ - Keuntungan: 0% IKLAN, 0% SKRIP ASING, KONTROL UI PENUH    │
└───────────────┬─────────────────────────────────────────────┘
                │ (Jika bukan direct stream / berupa iframe embed)
                ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Direct Mount Trusted Hosts (WibuDex Pattern ⭐)     │
│ - Berlaku untuk: nhplayer.com, playmogo.com, streampoi.com  │
│ - Iframe langsung tanpa sandbox opaque origin                │
│ - Menjaga keutuhan cookie session (PHPSESSID) & anti-tamper │
│ - Dilengkapi allowfullscreen & standard media permissions   │
└───────────────┬─────────────────────────────────────────────┘
                │ (Jika host di luar allowlist / mencurigakan)
                ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: Filtered Player Frame (Reverse-Proxy Sanitized)     │
│ - Endpoint: GET /api/video/player-frame?url=...             │
│ - Server mem-fetch HTML embed & membuang skrip iklan        │
│ - Menyuntikkan guardShim & stealthShim                      │
│ - Mengirimkan CSP Sandbox dengan allow-same-origin          │
│ - Tanpa monkeypatching prototype XMLHttpRequest bawaan      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Rincian Teknis Implementasi

### A. Tier 1 — Native Stream Extraction
1. **Reverse-Engineering Alur Token CDN (DoodStream / Playmogo)**:
   - Endpoint embed menyematkan parameter `file_id` dan hash.
   - Server memanggil endpoint `/pass_md5/<hash>/<fileid>`. Endpoint ini dilindungi Cloudflare TLS fingerprinting sehingga pemanggilan wajib menggunakan **`curl.exe`** (fetch biasa Node.js akan menerima status HTTP 403).
   - URL stream final dibentuk dari: `Base CDN + 10 karakter acak + ?token=<token>`.
2. **Penyajian di Frontend**:
   - Diputar menggunakan elemen `<video src="..." referrerpolicy="no-referrer">`.
   - Menggunakan pemutar kontrol kustom kita (Play/Pause, Seek 10s, Speed, Fullscreen, Volume) tanpa ada elemen asing.

### B. Tier 2 — Filtered Player Frame (Proxy Sanitasi)

Jika stream native tidak tersedia (misal penyedia StreamPoi yang membutuhkan reverse-engineering skrip `/js/xupload.js`), sistem mengaktifkan Tier 2 melalui endpoint server `/api/video/player-frame`:

1. **Penyaringan Skrip Iklan Statis (`stripAdScripts`)**:
   - Server membuang seluruh tag `<script src="...">` yang mengarah ke domain periklanan terlarang:
     - `hikerfaquirs.com`, `wearadmiration.com`, `tsyndicate.com`, `badlandlispyippee.com`, `propellerads`, `popads`, `blockadsnot.com`.
   - Membuang penanda skrip inline yang memicu proteksi:
     - `DisableDevtool`, `The publisher doesnt allow adblock`, `/embedblocked?referer=`, `popundersPerIP`, loader WASM terobfuscasi (`AGFzbQE`).

2. **Penyuntikan Script Pelindung (`guardShim`)**:
   Skrip berikut disuntikkan ke dalam tag `<head>` HTML embed sebelum dikirim ke browser:
   - **Netralisasi `window.open`**:
     ```javascript
     try { window.open = function() { return null; }; } catch(e) {}
     ```
   - **Pembatalan Klik Tautan Eksternal (Capture Phase)**:
     ```javascript
     document.addEventListener('click', function(ev) {
       var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
       if (!a) return;
       var isExternal = /^https?:\/\//i.test(a.href) && !a.href.includes(HOST);
       if (a.target === '_blank' || isExternal) {
         ev.preventDefault();
         ev.stopPropagation();
       }
     }, true);
     ```
   - **Pembatalan Submit Form Lintas Domain**: Mencegah form auto-submit ke situs luar.

3. **Penyuntikan Penyamaran (`stealthShim`)**:
   - Me-rewrite pemanggilan XHR/jQuery internal penyedia agar diarahkan melalui route passthrough server lokal (`/api/pf/:host/*`) dengan menyertakan header CORS yang sesuai.

4. **Header Content-Security-Policy (CSP) Sandbox**:
   Response disajikan dengan header keamanan ketat:
   ```http
   Content-Security-Policy: sandbox allow-scripts allow-forms allow-presentation
   X-Content-Type-Options: nosniff
   Cache-Control: no-store
   ```
   > [!IMPORTANT]
   > - **TANPA `allow-top-navigation`**: Browser memblokir upaya apa pun dari iframe untuk mengalihkan URL tab utama.
   > - **TANPA `allow-popups`**: Browser melarang pembukaan tab atau window baru.
   > - **TANPA `allow-same-origin`**: Iframe memiliki origin `null` (opaque), sehingga skrip penyedia **mustahil** membaca cookie, token, atau localStorage aplikasi utama kita.

### C. Tier 3 — Direct Iframe Fallback
- Jika penyedia memperbarui sistem enkripsi atau server proxy lokal mengalami gangguan, UI menyediakan tombol toggle manual: *"Ganti ke Mode Langsung"*.
- Pada mode ini, iframe mengarah langsung ke URL penyedia, namun tetap divalidasi terhadap daftar putih host terpercaya (`PLAYER_HOSTS`: `playmogo.com`, `streampoi.com`, `yandex.ru`, `ok.ru`, `doodstream.com`, `mega.nz`). Host di luar allowlist ditolak keras.

---

## 4. Keuntungan Arsitektur Ini
1. **Zero Downtime**: Tidak ada kondisi di mana pengguna buntu tidak bisa menonton video; jika tier 1 gagal, tier 2 otomatis mengambil alih.
2. **User Experience Premium**: Pengguna terbebas dari serangan iklan judi dan tab nakal yang selama ini merusak kenyamanan situs streaming bajakan.
3. **Keamanan Total bagi Host**: Origin aplikasi kita terlindungi sepenuhnya dari eksploitasi skrip pihak ketiga.
