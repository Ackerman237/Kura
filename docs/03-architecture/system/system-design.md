# 03. System Architecture & Design

## 1. Pola Arsitektur 3-Layer

Setiap provider scraper di dalam folder `src/sources/<provider>/` menerapkan pemisahan tanggung jawab yang tegas (Single Responsibility Principle) mengikuti pola yang diadopsi dari WibuDex:

```text
[ Consumer / Client Application ]
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ 1. Facade Orchestrator (src/<provider>.js)             │
│    - Validasi batas input (assertSlug, assertInt)      │
│    - Caching (getCache / setCache LRU)                 │
│    - Runtime configuration (state / configureX)        │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼ (cache miss)             ▼ (decode/map)
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ 2. Network Client            │   │ 3. Pure Parser & Normalizer  │
│    (src/sources/<p>/client)  │   │    (src/sources/<p>/parser)  │
│    - Request headers/auth    │   │    - 100% Pure Functions     │
│    - safeFetch & Proxy pool  │   │    - Regex / JSON / DOM DTO  │
│    - Origin validation       │   │    - Zero network / cache    │
└──────────────────────────────┘   └──────────────────────────────┘
```

---

## 2. Alur Data (Data Flow Pipeline)

1. **Input Assertion**: Consumer memanggil method pada Facade (contoh: `scrapeMangaList({ page: 2, limit: 24 })`). Parameter divalidasi dengan `assertInt` dan `assertSlug` untuk mencegah injeksi karakter terlarang dan path traversal.
2. **Cache Check**: Facade memeriksa apakah key cache (misal `doujin:/manga?limit=24&offset=24`) sudah ada di LRU memory. Jika ada, data langsung dikembalikan.
3. **Network Transport**: Jika cache miss, Facade mendelegasikan ke `client.js`. Client membentuk URL aman (`buildSourceUrl`), menambahkan headers (User-Agent, deviceId, auth secret jika origin sah), lalu memanggil `safeFetch`.
4. **Socket-Level Dispatcher**: `safeFetch` menggunakan `Undici` dispatcher yang memeriksa IP aktual saat socket TCP dibuka. Jika mengarah ke IP privat (loopback, RFC 1918, AWS metadata 169.254.169.254), koneksi langsung diputus seketika sebelum request byte pertama dikirim.
5. **Streaming Limit**: Data yang masuk dibatasi dengan `readTextLimited` atau `readJsonLimited` (maksimal 2MB untuk JSON, 5MB untuk HTML) untuk melindungi heap memory dari serangan payload berukuran raksasa.
6. **Decryption / Unwrapping**:
   - Jika payload Doujindesu terenkripsi (`_enc_resp_`), didekripsi oleh `crypto.js` menggunakan time bucket candidate keys.
   - Jika payload Hentai.tv berupa Next.js App Router, diekstrak via `joinRscPayload` dan `extractBalancedObject`.
7. **Pure Parsing & Normalization**: String atau JSON mentah diteruskan ke `parser.js` untuk dibentuk menjadi objek DTO bersih dan seragam.
8. **Cache Storage**: Hasil DTO disimpan ke dalam cache LRU dengan TTL yang sesuai, kemudian dikembalikan ke Consumer.

---

## 3. Karakteristik Scraper Provider

| Provider | Tipe Situs | Metode Ekstraksi | Mekanisme Khusus |
| :--- | :--- | :--- | :--- |
| **Doujindesu** | React SPA | REST `/api/*` + Dekripsi XOR | Time-bucket XOR rotation (1 jam) + Origin isolation |
| **NekoPoi** | WordPress CMS | Regex HTML Scraping | Whitelist embed iframe player (menolak tracker/iklan) |
| **Hentai.tv** | Next.js App Router | JSON API `/api/browse` + RSC Payloads | Deserialisasi stream RSC Next.js + JSON-LD Schema.org |
| **Eporner** | Video Tube Platform | REST API v2 + HTML Scraping | Outbound proxy racing pool + direct CDN mp4 regex |
