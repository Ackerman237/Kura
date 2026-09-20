/**
 * Kura Offline Service
 * IndexedDB storage engine for downloading and reading manga chapters offline.
 */

import { fetchChapterImages } from './api.js';

const DB_NAME = 'kura_offline_db';
const DB_VERSION = 1;
const STORE_CHAPTERS = 'offline_chapters';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_CHAPTERS)) {
        const store = db.createObjectStore(STORE_CHAPTERS, { keyPath: 'chapterId' });
        store.createIndex('mangaSlug', 'mangaSlug', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Convert image URL to DataURL (base64) so it can be stored persistently in IndexedDB
async function fetchImageAsDataUrl(url) {
  const fetchUrl =
    url.startsWith('http://') || url.startsWith('https://')
      ? `/api/image-proxy?url=${encodeURIComponent(url)}`
      : url;
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching image`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads all images of a chapter and saves them into IndexedDB.
 * @param {Object} options
 * @param {Object} options.manga
 * @param {Object} options.chapter
 * @param {Function} [options.onProgress] - (percent, current, total) => void
 */
/**
 * Downloads all images in a chapter and stores them into IndexedDB.
 * Supports both ({ manga, chapter, onProgress }) and legacy (chapterId, meta) signatures.
 *
 * @param {Object|string} arg1 - Options object or chapterId string
 * @param {Object} [arg2] - Options when arg1 is chapterId
 */
export async function downloadChapterForOffline(arg1, arg2 = {}) {
  let manga, chapter, onProgress;
  if (typeof arg1 === 'string') {
    chapter = { id: arg1, ...(arg2 || {}) };
    manga = {
      title: arg2.title || arg2.mangaTitle || '',
      slug: arg2.mangaSlug || arg1,
      thumb: arg2.thumb || '',
      type: arg2.type || 'manga',
    };
    onProgress = arg2.onProgress || (() => {});
  } else {
    manga = arg1?.manga || {};
    chapter = arg1?.chapter || {};
    onProgress = arg1?.onProgress || (() => {});
  }

  const chapterId = chapter.id || chapter.slug || chapter.chapterId;
  if (!chapterId) throw new Error('Invalid chapter ID');

  onProgress(5, 0, 100);

  // 1. Fetch images list
  const chapterData = await fetchChapterImages(chapterId);
  const rawImages = chapterData.images || chapterData.pages || (Array.isArray(chapterData) ? chapterData : []);
  if (!rawImages.length) throw new Error('No images found in chapter');

  onProgress(10, 0, rawImages.length);

  // 2. Fetch each image and convert to DataURL
  const downloadedImages = [];
  const total = rawImages.length;

  for (let i = 0; i < total; i++) {
    const imgUrl = rawImages[i];
    try {
      const dataUrl = await fetchImageAsDataUrl(imgUrl);
      downloadedImages.push(dataUrl);
    } catch (err) {
      // Fallback: store original URL if CORS fails
      console.warn(`[Offline] CORS fallback for image ${i + 1}:`, err);
      downloadedImages.push(imgUrl);
    }

    const percent = Math.round(10 + ((i + 1) / total) * 85);
    onProgress(percent, i + 1, total);
  }

  // 3. Save into IndexedDB
  const db = await openDb();
  const record = {
    chapterId,
    chapterNumber: chapter.chapterNumber || chapter.number || chapter.title || '1',
    chapterTitle: chapter.title || `Chapter ${chapter.chapterNumber || '1'}`,
    mangaSlug: manga.slug || manga.id,
    mangaTitle: manga.title,
    mangaCover: manga.thumb || manga.cover || '',
    mangaType: manga.type || 'manga',
    pageCount: downloadedImages.length,
    images: downloadedImages,
    savedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHAPTERS, 'readwrite');
    const store = tx.objectStore(STORE_CHAPTERS);
    const req = store.put(record);

    req.onsuccess = () => {
      onProgress(100, total, total);
      resolve(record);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Checks if a chapter is downloaded offline.
 */
export async function isChapterOffline(chapterId) {
  if (!chapterId) return false;
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CHAPTERS, 'readonly');
      const store = tx.objectStore(STORE_CHAPTERS);
      const req = store.get(chapterId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Retrieves a downloaded offline chapter record.
 */
export async function getOfflineChapter(chapterId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHAPTERS, 'readonly');
    const store = tx.objectStore(STORE_CHAPTERS);
    const req = store.get(chapterId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Retrieves all offline downloaded chapters.
 */
export async function getAllOfflineChapters() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHAPTERS, 'readonly');
    const store = tx.objectStore(STORE_CHAPTERS);
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      // Sort newest download first
      list.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      resolve(list);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Deletes an offline chapter from IndexedDB.
 */
export async function deleteOfflineChapter(chapterId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHAPTERS, 'readwrite');
    const store = tx.objectStore(STORE_CHAPTERS);
    const req = store.delete(chapterId);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Clears all offline chapters from IndexedDB.
 */
export async function clearOfflineStorage() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHAPTERS, 'readwrite');
    const store = tx.objectStore(STORE_CHAPTERS);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}
/**
 * Exports an offline chapter's images as a CBZ (ZIP) file and triggers browser download.
 * CBZ is a ZIP archive of page images — compatible with all comic readers.
 *
 * Uses JSZip if available (injected via CDN), otherwise falls back to
 * a simple binary ZIP constructed with the Deflate-free Store method.
 *
 * @param {string} chapterId
 * @param {Object} [nameMeta] - { manga, chapter, chapter_padded, title }
 * @param {Function} [onProgress] - (percent) => void
 */
export async function exportChapterAsCbz(chapterId, nameMeta = {}, onProgress = () => {}) {
  let record = await getOfflineChapter(chapterId);
  if (!record) {
    onProgress(3);
    if (nameMeta.manga && nameMeta.chapter) {
      record = await downloadChapterForOffline({
        manga: typeof nameMeta.manga === 'object' ? nameMeta.manga : { title: nameMeta.manga },
        chapter: typeof nameMeta.chapter === 'object' ? nameMeta.chapter : { id: chapterId, chapterNumber: nameMeta.chapter, title: nameMeta.title },
        onProgress: (pct) => onProgress(Math.round(pct * 0.45)),
      });
    } else {
      const chapterData = await fetchChapterImages(chapterId);
      const rawImages = chapterData.images || chapterData.pages || (Array.isArray(chapterData) ? chapterData : []);
      if (!rawImages.length) throw new Error('Tidak ada halaman dalam chapter ini.');
      record = {
        chapterId,
        chapterNumber: nameMeta.chapter || '1',
        chapterTitle: nameMeta.title || `Chapter ${nameMeta.chapter || '1'}`,
        mangaTitle: typeof nameMeta.manga === 'string' ? nameMeta.manga : nameMeta.manga?.title || 'Manga',
        images: rawImages,
      };
    }
  }

  const images = record.images || [];
  if (images.length === 0) throw new Error('Tidak ada halaman dalam chapter ini.');

  onProgress(5);

  // Build page blobs
  const pages = [];
  for (let i = 0; i < images.length; i++) {
    const src = images[i];
    let blob;
    if (src.startsWith('data:')) {
      const [header, b64] = src.split(',');
      const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
      const binary = atob(b64);
      const arr = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j);
      blob = new Blob([arr], { type: mime });
    } else {
      const res = await fetch(src);
      blob = await res.blob();
    }
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
    const name = `${String(i + 1).padStart(4, '0')}.${ext}`;
    pages.push({ name, blob });
    onProgress(Math.round(5 + ((i + 1) / images.length) * 80));
  }

  // Assemble ZIP using Store (no compression) — no deps needed
  // ZIP local file header format (PKZIP spec)
  function toUint16LE(n) { return new Uint8Array([n & 0xFF, (n >> 8) & 0xFF]); }
  function toUint32LE(n) { return new Uint8Array([n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF]); }

  function crc32(data) {
    const table = crc32.table || (crc32.table = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c;
      }
      return t;
    })());
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  const localHeaders = [];
  const dataChunks = [];
  const centralDirs = [];
  let offset = 0;

  for (const { name, blob } of pages) {
    const fileData = new Uint8Array(await blob.arrayBuffer());
    const nameBytes = new TextEncoder().encode(name);
    const crc = crc32(fileData);
    const modTime = 0x0000, modDate = 0x0000;

    // Local file header
    const lfh = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, // signature
      0x14, 0x00,             // version needed
      0x00, 0x00,             // general flags
      0x00, 0x00,             // compression: store
      ...toUint16LE(modTime), ...toUint16LE(modDate),
      ...toUint32LE(crc),
      ...toUint32LE(fileData.length),
      ...toUint32LE(fileData.length),
      ...toUint16LE(nameBytes.length),
      0x00, 0x00,             // extra field length
      ...nameBytes,
    ]);

    // Central directory entry
    const cde = new Uint8Array([
      0x50, 0x4B, 0x01, 0x02, // signature
      0x14, 0x00, 0x14, 0x00, // version made by, needed
      0x00, 0x00,             // general flags
      0x00, 0x00,             // compression: store
      ...toUint16LE(modTime), ...toUint16LE(modDate),
      ...toUint32LE(crc),
      ...toUint32LE(fileData.length),
      ...toUint32LE(fileData.length),
      ...toUint16LE(nameBytes.length),
      0x00, 0x00, 0x00, 0x00, // extra field, comment lengths
      0x00, 0x00,             // disk start
      0x00, 0x00,             // int file attr
      0x00, 0x00, 0x00, 0x00, // ext file attr
      ...toUint32LE(offset),
      ...nameBytes,
    ]);

    localHeaders.push(lfh);
    dataChunks.push(fileData);
    centralDirs.push(cde);
    offset += lfh.length + fileData.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralDirs.reduce((a, b) => a + b.length, 0);
  const totalFiles = pages.length;

  // End of central directory record
  const eocd = new Uint8Array([
    0x50, 0x4B, 0x05, 0x06, // signature
    0x00, 0x00, 0x00, 0x00, // disk numbers
    ...toUint16LE(totalFiles), ...toUint16LE(totalFiles),
    ...toUint32LE(centralDirSize),
    ...toUint32LE(centralDirOffset),
    0x00, 0x00,             // comment length
  ]);

  // Concatenate all parts
  const parts = [];
  for (let i = 0; i < localHeaders.length; i++) {
    parts.push(localHeaders[i], dataChunks[i]);
  }
  for (const cd of centralDirs) parts.push(cd);
  parts.push(eocd);

  const totalSize = parts.reduce((a, b) => a + b.length, 0);
  const zipBuffer = new Uint8Array(totalSize);
  let pos = 0;
  for (const p of parts) { zipBuffer.set(p, pos); pos += p.length; }

  onProgress(98);

  // Trigger download
  const pad = (n, l = 3) => String(n || 0).padStart(l, '0');
  const mangaTitle = typeof nameMeta.manga === 'string'
    ? nameMeta.manga
    : nameMeta.manga?.title || record.mangaTitle || '';

  const baseName = nameMeta.filename
    ? nameMeta.filename.replace(/\.cbz$/i, '')
    : mangaTitle
      ? `${mangaTitle} - Ch.${pad(nameMeta.chapter || record.chapterNumber)}`
      : record.mangaTitle
        ? `${record.mangaTitle} - Ch.${pad(record.chapterNumber)}`
        : `chapter-${chapterId}`;

  const blob = new Blob([zipBuffer], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.cbz`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);

  onProgress(100);
}
