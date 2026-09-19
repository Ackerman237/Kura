# Project Documentation Center

Selamat datang di pusat dokumentasi resmi **`self-hosted-manga-reader`** (`doujin-scraper`).

Direktori ini berfungsi sebagai *Single Source of Truth* (SSOT) untuk seluruh aspek teknis, arsitektur, kebijakan keamanan, standar API, rekam keputusan desain (ADR), dan rencana pengembangan (*roadmap*) project.

---

## 📂 Struktur Dokumentasi

Folder disusun dengan prefix numerik (`01` hingga `06`) untuk menjaga urutan pembacaan yang logis dan konsisten pada file explorer dan GitHub UI:

| Folder | Dokumen Utama | Deskripsi & Tujuan |
| :--- | :--- | :--- |
| [`01-overview/`](01-overview/) | [`project-charter.md`](01-overview/project-charter.md) | Visi project, sasaran fungsional, lingkup (*scope*), dan profil stack teknologi Kura (蔵). |
| [`02-architecture/`](02-architecture/) | [`system-design.md`](02-architecture/system-design.md)<br>[`video-player-ad-isolation.md`](02-architecture/video-player-ad-isolation.md)<br>[`design-system.md`](02-architecture/design-system.md) | Blueprint arsitektur 3-layer scraper, isolasi iklan video 3-tier, serta sistem desain visual Kura (22 aturan desain, palet 60-30-10, WCAG). |
| [`03-security/`](03-security/) | [`security-policy.md`](03-security/security-policy.md)<br>[`security-audit-problem-map.md`](03-security/security-audit-problem-map.md) | Standar mitigasi SSRF, DNS Rebinding, proteksi stream limits, rate limiting, serta matriks audit keamanan T0–T7. |
| [`04-api-reference/`](04-api-reference/) | [`api-contracts.md`](04-api-reference/api-contracts.md)<br>[`sdk-doujin-scraper.md`](04-api-reference/sdk-doujin-scraper.md) | Spesifikasi fungsi publik ekspor, parameter input, validasi bounds, bentuk normalized DTO, dan arsip referensi SDK asli. |
| [`05-decisions/`](05-decisions/) | [`ADR-001-modular-parsers.md`](05-decisions/ADR-001-modular-parsers.md)<br>[`ADR-002-undici-dispatcher.md`](05-decisions/ADR-002-undici-dispatcher.md) | *Architecture Decision Records* (ADR): catatan historis mengapa suatu keputusan arsitektural dipilih. |
| [`06-roadmap/`](06-roadmap/) | [`roadmap-and-backlog.md`](06-roadmap/roadmap-and-backlog.md) | Rencana pengembangan selanjutnya (Frontend Web App, UI reader, PWA caching, media aggregator). |

---

## 🧭 Panduan Kontribusi Dokumentasi

Untuk menjaga integritas dan kebersihan dokumentasi saat project bertumbuh:

1. **Prinsip Keep It Alive**: Setiap perubahan arsitektur atau penambahan scraper baru harus memperbarui dokumen terkait di `02-architecture/` dan `04-api-reference/`.
2. **Rekam Keputusan (ADRs)**: Jika ada pilihan desain penting (misalnya mengganti library cache, menambah database/ORM, atau mengubah skema proxy), buat entri baru di `05-decisions/` dengan format: *Konteks $\rightarrow$ Keputusan $\rightarrow$ Konsekuensi*.
3. **Keamanan**: Hasil temuan pentest, audit vulnerabilitas, atau CVE upstream baru dicatat ke dalam `03-security/`.
4. **Roadmap**: Item yang belum dikerjakan hanya dicatat di `06-roadmap/roadmap-and-backlog.md` agar backlog tetap rapi dan terukur.
