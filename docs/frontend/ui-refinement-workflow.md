# Kura UI Refinement Workflow

Workflow ini digunakan untuk meningkatkan kualitas UI Kura tanpa membuat desain baru yang generik atau memecah halaman menjadi versi mobile/tablet/desktop yang terpisah.

## Prinsip Kerja

1. Gunakan spesifikasi Kura sebagai sumber utama.
2. Gunakan standar WCAG 2.2 untuk aksesibilitas yang tidak boleh dikompromikan.
3. Gunakan pola industri yang sudah teruji untuk navigasi, reader, katalog, dan video.
4. Pertahankan satu logic dan state Vue untuk semua ukuran layar.
5. Bedakan komposisi berdasarkan tugas halaman, bukan berdasarkan device.
6. Jangan menambah dekorasi jika tidak memperjelas hierarki atau interaksi.
7. Setiap perubahan harus punya bukti masalah, treatment, dan validasi ulang.

## Sumber Referensi Berurutan

1. `docs/02-design/tokens/design-system.md`
2. `docs/ui-ux/master-spec.md`
3. `docs/frontend/audit-findings.md`
4. `src/web/styles/tokens.css`
5. `kura-ui-ux-review` skill dan referensi internalnya
6. WCAG 2.2, Vercel Web Interface Guidelines, dan Nielsen heuristics

Jika sumber berbeda, gunakan urutan authority berikut:

1. WCAG dan standar aksesibilitas
2. Prinsip HCI
3. Platform web guidelines
4. Design tokens Kura
5. Master specification Kura
6. Preferensi visual terakhir

## Fase 1: Riset Dan Baseline

Sebelum mengubah kode:

- Baca spesifikasi Kura dan token aktif.
- Tentukan surface archetype: catalog, detail, reader, video, settings, atau library.
- Catat tujuan utama pengguna pada surface tersebut.
- Ambil screenshot baseline pada viewport yang diwajibkan.
- Catat masalah menggunakan format:

```text
Observation -> Cause -> Structural Treatment -> Recheck Viewport
```

Jangan melakukan polish visual sebelum masalah struktur dan overflow ditemukan.

## Fase 2: Tetapkan Layout Mode

Gunakan empat mode komposisi:

| Mode | Ukuran | Prioritas |
| --- | --- | --- |
| Compact | 320-639px | touch, scanning, satu kolom atau grid kecil |
| Tablet | 640-1023px | reflow, sidebar collapsed, ruang transisi |
| Desktop | 1024px ke atas | sidebar, multi-column, density tinggi |
| Immersive | reader dan video | fokus konten, chrome minimum |

Mode tidak membuat file view baru. Gunakan layout component reusable dan media query untuk perubahan komposisi.

## Fase 3: Tetapkan Karakter Per Surface

Setiap surface harus memiliki ritme yang berbeda sesuai tugasnya:

### Home

- Editorial dan sinematik.
- Hero sebagai fokus utama.
- Rail rekomendasi dengan spacing yang lebih longgar.
- Hindari semua section menjadi card bertingkat.

### Catalog

- Utilitarian dan cepat dipindai.
- Filter dapat discroll atau dikelompokkan.
- Grid konsisten dengan aspect ratio cover.
- Metadata sekunder tidak mengalahkan judul.

### Detail

- Fokus pada keputusan mulai membaca.
- Judul, cover, synopsis, dan CTA harus memiliki hirarki jelas.
- Chapter list padat tetapi mudah dipindai.

### Reader

- Konten adalah fokus utama.
- Kontrol memakai ghost UI dan tidak memenuhi canvas.
- Semua mode reader memiliki escape route dan kontrol keyboard.

### Cinema

- Player menjadi primary content.
- Related content bersifat sekunder.
- Gunakan framing widescreen tanpa menambah panel dekoratif yang tidak perlu.

### Settings Dan About

- Tenang dan terstruktur.
- Gunakan divider dan grouping, bukan nested card berlebihan.
- Label, nilai, dan aksi harus mudah dibedakan.

## Fase 4: Konsolidasi Token

Sebelum polish komponen, selesaikan konflik token.

- Pilih satu font family utama yang mendukung Latin, Jepang, Korea, dan China.
- Gunakan skala type Kura yang konsisten.
- Gunakan spacing 4/8pt.
- Batasi radius menjadi outer card, control, dan pill.
- Batasi accent hanya untuk active, CTA, progress, dan status penting.
- Hindari hardcoded color jika token yang sesuai tersedia.

Setiap perubahan token harus diperiksa pada semua tema: default, cinema, yoru, dan amoled.

## Fase 5: Implementasi Bertahap

Urutan implementasi:

1. `AppShell` dan container.
2. Home dan catalog.
3. Detail manga dan chapter list.
4. Cinema dan video watch.
5. Library, settings, dan about.
6. Reader dan immersive controls.
7. Empty, loading, error, offline, dan privacy states.

Aturan implementasi:

- Satu logic/state untuk semua viewport.
- Buat layout component hanya jika struktur komposisinya benar-benar berbeda.
- Gunakan CSS untuk spacing, grid, wrapping, dan ukuran.
- Gunakan conditional rendering hanya untuk navigasi atau interaksi yang memang berbeda.
- Jangan membuat `HomeMobile.vue`, `HomeTablet.vue`, atau `HomeDesktop.vue`.
- Jangan menggunakan `transition: all`.
- Pastikan flex child yang berisi teks memiliki `min-width: 0`.
- Pastikan image/video memiliki aspect ratio untuk mencegah CLS.

## Fase 6: Accessibility Gate

Sebelum visual approval:

- Touch target mobile minimal 44x44px.
- Icon-only button memiliki `aria-label`.
- Semua image memiliki `alt` yang tepat.
- Focus state terlihat dengan `:focus-visible`.
- Modal, drawer, dan dock tidak menutupi focus target.
- Input memiliki label atau accessible name.
- Async state menggunakan `aria-live` atau `role="status"` bila relevan.
- Heading hierarchy tidak melompat tanpa alasan.
- Reduced motion dihormati.
- Teks dan control memenuhi kontras WCAG yang relevan.

## Fase 7: Visual Verification

Validasi wajib pada:

| Viewport | Fokus pemeriksaan |
| --- | --- |
| 390x844 | dock, touch target, overflow, cover grid |
| 768x1024 | transisi tablet, sidebar, drawer, modal |
| 1440x900 | desktop sidebar, catalog density, reader framing |
| 1920x1080 | max content width, player proportion, whitespace |
| 2560x1080 | ultrawide framing, stranded panels, media scaling |

Untuk setiap surface, periksa:

- tidak ada horizontal overflow;
- tidak ada teks atau control yang bertabrakan;
- tidak ada layout shift saat gambar dimuat;
- primary action terlihat dalam lima detik;
- empty/loading/error state tetap memiliki struktur;
- hover, active, focus, disabled, dan loading state konsisten;
- keyboard navigation memiliki escape route.

## Fase 8: Evidence Dan Review

Setiap temuan dicatat berdasarkan severity:

- **Blocking**: tugas utama gagal, overflow serius, atau accessibility blocker.
- **Major**: friction nyata, hierarchy rusak, atau layout tidak stabil pada viewport penting.
- **Minor**: polish typography, spacing, microcopy, atau konsistensi visual.

Jangan menutup workflow hanya karena build berhasil. Build membuktikan kode dapat dikompilasi; screenshot dan interaction checks membuktikan UI bekerja untuk pengguna.

## Definition Of Done

Workflow dianggap selesai jika:

- semua surface utama telah diaudit;
- tidak ada Blocking finding;
- Major finding memiliki treatment atau alasan tertulis;
- token typography dan spacing konsisten;
- desktop tidak mengalami regresi;
- lima viewport standar sudah diperiksa;
- keyboard, focus, touch, modal, drawer, reader, dan player sudah diuji;
- build production berhasil;
- test yang gagal memiliki root cause dan status yang jelas.