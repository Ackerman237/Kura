# 05. API Contracts & Reference

Dokumen ini mendefinisikan seluruh fungsi publik yang diekspor oleh library `doujin-scraper`, parameter masukan, dan bentuk DTO hasil normalisasi.

---

## 1. Doujindesu (`doujin-scraper/doujindesu`)

### `scrapeMangaList(options)`
- **Parameter**:
  - `page` *(number, default: 1)*: Nomor halaman (1-1000). Menggunakan konversi `offset = (page - 1) * limit`.
  - `query` *(string, optional)*: Kata kunci pencarian manga.
  - `type` *(string, optional)*: `'manga'` | `'doujinshi'` | `'manhwa'`.
  - `genre` *(string, optional)*: Slug genre (contoh: `'netorare'`).
  - `sort` *(string, optional)*: `'latest_chapter'` | `'views'` | `'rating'`.
  - `limit` *(number, default: 24)*: Jumlah manga per halaman (1-100).
- **Return Type**: `Promise<Array<MangaListItem>>`
- **Contoh DTO Item**:
  ```json
  {
    "title": "Contoh Judul Manga",
    "slug": "contoh-judul-manga",
    "thumb": "https://doujin.desu.xxx/uploads/covers/123.jpg",
    "rating": 8.5,
    "type": "manga",
    "status": "Ongoing",
    "latestChapter": 15
  }
  ```

### `scrapeMangaDetail(slug)`
- **Parameter**: `slug` *(string, required)*: Slug manga yang valid.
- **Return Type**: `Promise<MangaDetail>`
- **Contoh DTO Detail**:
  ```json
  {
    "title": "Judul Manga",
    "altTitle": "Alternative Title",
    "thumb": "https://doujin.desu.xxx/uploads/covers/123.jpg",
    "rating": 9.2,
    "status": "Completed",
    "type": "manga",
    "synopsis": "Teks sinopsis bersih tanpa tag HTML.",
    "author": "Nama Author",
    "artist": "Nama Artist",
    "genres": [{ "name": "Romance", "slug": "romance" }],
    "chapters": [{ "id": 101, "number": 1, "title": "Chapter 1", "date": "1/1/2026" }],
    "views": 25000
  }
  ```

### `scrapeChapterImages(id)`
- **Parameter**: `id` *(string|number, required)*: Chapter ID.
- **Return Type**: `Promise<{ images: string[], mangaSlug: string, mangaTitle: string, title: string, number: number|null }>`

---

## 2. NekoPoi (`doujin-scraper/nekopoi`)

### `scrapeNekoList(page)`
- **Parameter**: `page` *(number, default: 1)*
- **Return Type**: `Promise<{ videos: Array<NekoVideoItem>, hasNext: boolean }>`

### `scrapeNekoDetail(slug)`
- **Parameter**: `slug` *(string, required)*
- **Return Type**:
  ```json
  {
    "title": "Judul Video",
    "slug": "judul-video",
    "thumb": "https://img.nekopoi.care/cover.jpg",
    "players": [
      "https://streampoi.com/embed/xyz",
      "https://playmogo.com/embed/abc"
    ],
    "synopsis": "Sinopsis video..."
  }
  ```

---

## 3. Hentai.tv (`doujin-scraper/hentaitv`)

### `scrapeHentaiList({ page, query })`
- **Return Type**: `Promise<{ videos: Array<HentaiVideoItem>, hasNext: boolean, total: number }>`

### `scrapeHentaiDetail(slug)`
- **Return Type**:
  ```json
  {
    "id": "slug-video",
    "slug": "slug-video",
    "title": "Nama Video",
    "displayTitle": "Nama Video EP 1",
    "ep": 1,
    "views": 42000,
    "duration": "24:12",
    "thumb": "https://img.hentai.tv/cover.jpg",
    "embedUrl": "https://player.example.com/embed/123",
    "tags": ["Vanilla", "School"]
  }
  ```

---

## 4. Eporner (`doujin-scraper/eporner`)

### `scrapeEpornerList({ page, query, order })`
- **Return Type**: `Promise<{ videos: Array<EpornerVideoItem>, hasNext: boolean, total: number }>`

### `scrapeEpornerDetail(id)`
- **Return Type**: Menyediakan `embedUrl` sekaligus array berkas mp4 direct CDN:
  ```json
  {
    "id": "abc123",
    "title": "Video Title",
    "embedUrl": "https://www.eporner.com/embed/abc123/",
    "src": [
      { "label": "1080p", "url": "https://www.eporner.com/dload/abc123/1080/file.mp4" },
      { "label": "720p", "url": "https://www.eporner.com/dload/abc123/720/file.mp4" }
    ]
  }
  ```

---

## 5. Web Video Endpoints (`src/server/routes/video.js`)

### `GET /api/video/trending?provider=:provider`
- **Parameter**: `provider` *(string, optional, default: 'htv')*: `'htv'` | `'neko'` | `'tube'`.
- **Return Type**: `Promise<Array<VideoItem>|{ videos: Array<VideoItem> }>`
- **Deskripsi**: Mengembalikan daftar video trending populer harian sesuai provider yang diminta.

### `GET /api/video/player-frame?url=:url`
- **Parameter**: `url` *(string, required)*: URL embed pemutar target.
- **Header Keamanan**: `Content-Security-Policy: sandbox allow-scripts allow-forms allow-presentation allow-same-origin`.
- **Deskripsi**: Reverse-proxy pemutar video pihak ketiga dengan injeksi penghapus skrip iklan dan penjinak popunder.

---

## 6. Active HTTP Route Reference

The SDK return types above are not identical to every HTTP response shape. The Express API is mounted from `server.js` and currently exposes:

| Route | Purpose |
| --- | --- |
| `GET /api/manga/list` | Manga catalog with pagination metadata. |
| `GET /api/manga/genres` | Manga genre list. |
| `GET /api/manga/detail/:slug` | Manga detail and chapters. |
| `GET /api/manga/chapter/:id` | Chapter images and metadata. |
| `GET /api/video/trending?provider=:provider` | Provider-specific trending videos. |
| `GET /api/video/neko/list` | NekoPoi catalog. |
| `GET /api/video/neko/detail/:slug` | NekoPoi detail. |
| `GET /api/video/htv/genres` | HentaiTV genres. |
| `GET /api/video/htv/list` | HentaiTV catalog. |
| `GET /api/video/htv/detail/:slug` | HentaiTV detail. |
| `GET /api/video/tube/categories` | Eporner categories. |
| `GET /api/video/tube/list` | Eporner catalog. |
| `GET /api/video/tube/detail/:id` | Eporner detail. |
| `GET /api/video/player-frame?url=:url` | Filtered player frame for non-direct hosts. |
| `GET /api/video/download/sources` | Resolve supported video download sources. |
| `GET /api/video/download/stream` | Stream an authorized video source. |
| `POST /api/video/download/save-to-disk` | Start a server-disk video download. |
| `GET /api/video/download/progress/:jobId` | Server-Sent Events progress for a download job. |
| `GET /api/health` | Runtime health and configuration payload. |
| `GET /api/image-proxy` | Validated external image proxy. |

For manga list responses, the SDK returns an array by default. The HTTP route requests metadata and returns an object containing `items`, `page`, `limit`, `total`, `totalPages`, and `hasNext`.

## 7. Client Services & Utilities

### `mergeUnifiedFeed(providerFetchers, timeoutMs)` (`src/web/services/unifiedFeed.js`)
- **Parameter**:
  - `providerFetchers` *(Array<{ provider: string, fetcher: () => Promise<any> }>)*
  - `timeoutMs` *(number, default: 8000)*
- **Return Type**: `Promise<Array<UnifiedVideoItem>>`
- **Fitur**: Menjalankan fetch lintas-provider secara paralel via `Promise.allSettled`, toleran terhadap kegagalan provider individual, serta menduplikasi item berdasarkan `title + type`.
- **Contoh DTO**:
  ```json
  {
    "title": "Judul Video",
    "type": "anime",
    "thumb": "https://cdn.example.com/cover.jpg",
    "slug": "judul-video-htv",
    "provider": "htv",
    "sources": [
      { "provider": "htv", "slug": "judul-video-htv", "thumb": "..." },
      { "provider": "neko", "slug": "judul-video-neko", "thumb": "..." }
    ]
  }
  ```

### `saveReadingProgress(mangaSlug, data)` (`src/web/services/storage.js`)
- **Parameter**:
  - `mangaSlug` *(string)*: Slug manga
  - `data` *(object)*: `{ chapterId, chapterNumber, pageIndex, title, thumb, cover }`
- **Deskripsi**: Menyimpan posisi baca dan gambar cover komik ke LocalStorage (`kura_reading_progress`) agar siap ditampilkan pada rail "Lanjutkan Membaca" dan "Pustaka".

