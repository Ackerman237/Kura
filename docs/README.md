# Project Documentation Center

Selamat datang di pusat dokumentasi resmi **`self-hosted-manga-reader`** (`doujin-scraper`).

Direktori ini berfungsi sebagai *Single Source of Truth* (SSOT) untuk seluruh aspek teknis, arsitektur, kebijakan keamanan, standar API, rekam keputusan desain (ADR), dan rencana pengembangan (*roadmap*) project.

---

## 📂 Struktur Dokumentasi (Hierarki Universal → Spesifik)

Dokumentasi Kura disusun dengan prinsip *Inverted Pyramid Taxonomy*: nama direktori terluar bersifat universal dan agnostik, lalu semakin ke dalam/banyak sub-direktori menjadi semakin spesifik dan teknis:

| Domain (Level 1) | Sub-Domain (Level 2) | Berkas Dokumen (Level 3) | Deskripsi & Fokus Teknis |
| :--- | :--- | :--- | :--- |
| **`01-overview/`** | — | [`project-charter.md`](01-overview/project-charter.md) | Visi, sasaran, filosofi lumbung mandiri, dan batasan lingkup Kura. |
| **`02-design/`** | `brand/`<br>`tokens/` | [`identity-and-logo.md`](02-design/brand/identity-and-logo.md)<br>[`design-system.md`](02-design/tokens/design-system.md) | **Filosofi Brand & Simbol**: Kikkō Mon, spesifikasi logo resmi & simpel.<br>**Design System**: 22 kaidah desain visual, palet 60-30-10, grid 8pt, dan WCAG AAA. |
| **`03-architecture/`**| `system/`<br>`player/` | [`system-design.md`](03-architecture/system/system-design.md)<br>[`video-ad-isolation.md`](03-architecture/player/video-ad-isolation.md) | **Arsitektur Scraper**: Blueprint 3-layer (Facade $\rightarrow$ Client $\rightarrow$ Pure Parser).<br>**Arsitektur Player**: Pertahanan 3-tier terhadap popunder/iklan agresif. |
| **`04-security/`** | `policies/`<br>`audits/` | [`security-policy.md`](04-security/policies/security-policy.md)<br>[`security-audit-problem-map.md`](04-security/audits/security-audit-problem-map.md) | **Kebijakan Jaringan**: Mitigasi SSRF socket-level, DNS rebinding, proxy racing.<br>**Hasil Audit**: Matriks temuan audit keamanan T0–T7 lengkap. |
| **`05-api/`** | `contracts/`<br>`engine/` | [`api-contracts.md`](05-api/contracts/api-contracts.md)<br>[`sdk-doujin-scraper.md`](05-api/engine/sdk-doujin-scraper.md) | **Kontrak API**: Validasi bounds dan bentuk normalized DTO.<br>**Engine SDK**: Arsip lengkap dokumentasi SDK scraping engine asli. |
| **`06-decisions/`** | — | [`ADR-001-modular-parsers.md`](06-decisions/ADR-001-modular-parsers.md)<br>[`ADR-002-undici-dispatcher.md`](06-decisions/ADR-002-undici-dispatcher.md) | Rekam jejak keputusan arsitektur (*Architecture Decision Records*). |
| **`07-roadmap/`** | — | [`roadmap-and-backlog.md`](07-roadmap/roadmap-and-backlog.md) | Rencana milestone pengerjaan (Frontend Web App, UI Reader, PWA caching). |
| **Audit & Parity** | — | [`fix-report.md`](fix-report.md)<br>[`js-parity-map.md`](js-parity-map.md) | **Laporan Audit & Matriks Diagnosis**: Hasil audit komprehensif, akar masalah, dan matriks sebelum-sesudah.<br>**Peta Padanan JS**: Analisis komparatif client-side WibuDex vs Kura. |

---

## 🧭 Panduan Kontribusi Dokumentasi

Untuk menjaga integritas dan kebersihan dokumentasi saat project bertumbuh:

1. **Prinsip Keep It Alive**: Setiap perubahan arsitektur atau penambahan scraper baru harus memperbarui dokumen terkait di `03-architecture/` dan `05-api/`.
2. **Rekam Keputusan (ADRs)**: Jika ada pilihan desain penting (misalnya mengganti library cache, menambah database/ORM, atau mengubah skema proxy), buat entri baru di `06-decisions/` dengan format: *Konteks $\rightarrow$ Keputusan $\rightarrow$ Konsekuensi*.
3. **Keamanan**: Hasil temuan pentest, audit vulnerabilitas, atau CVE upstream baru dicatat ke dalam `04-security/`.
4. **Roadmap**: Item yang belum dikerjakan hanya dicatat di `07-roadmap/roadmap-and-backlog.md` agar backlog tetap rapi dan terukur.
