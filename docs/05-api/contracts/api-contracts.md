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
