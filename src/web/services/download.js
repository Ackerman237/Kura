/**
 * Kura Download Service
 * Composable + utilities untuk sistem antrian unduhan video & manga.
 *
 * Pola async yang digunakan:
 *   - async/await      : semua operasi fetch & I/O
 *   - AbortController  : pause & cancel per item
 *   - ReadableStream   : progress tracking chunked
 *   - Promise.race()   : concurrency pool (N paralel)
 *   - EventSource (SSE): progress mode server-disk
 */

import { ref, computed, readonly } from 'vue';

// ---------------------------------------------------------------------------
// Tipe data item queue
// ---------------------------------------------------------------------------
// DownloadItem {
//   id: string (uuid)
//   type: 'video' | 'manga-chapter'
//   status: 'queued' | 'downloading' | 'paused' | 'done' | 'error'
//   progress: number (0-100)
//   speed: number (bytes/sec rolling)
//   eta: number (seconds remaining)
//   received: number (bytes)
//   total: number (bytes, 0 = unknown)
//   filename: string
//   url: string (resolved stream URL)
//   streamUrl: string (proxied /api/video/download/stream?url=...)
//   meta: { title, provider, quality, slug, ... }
//   error: string | null
//   controller: AbortController | null (paused items = null)
// }

// ---------------------------------------------------------------------------
// Singleton queue state
// ---------------------------------------------------------------------------
const _queue = ref([]);
const _settings = ref({
  maxParallel: 2,
  mode: 'browser', // 'browser' | 'server-disk'
  // Video filename template
  videoTemplate: '{provider} - {title} [{quality}]',
  // Manga chapter filename template
  mangaTemplate: '{manga} - Ch.{chapter_padded}',
  // Video subdirectory rules
  videoSubdir: { byProvider: true, byGenre: false, byYear: false, byAlpha: false },
  // Manga subdirectory rules
  mangaSubdir: { byManga: true, byBatch: false, byGenre: false },
  // Base output directories
  videoDir: 'downloads/video',
  mangaDir: 'downloads/manga',
  // Default quality preference
  defaultQuality: 'best', // 'best' | '1080p' | '720p' | '480p'
});

// Load saved settings from localStorage on init
try {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('kura_download_settings');
    if (raw) {
      _settings.value = { ..._settings.value, ...JSON.parse(raw) };
    }
  }
} catch (_) {}

let _activeCount = 0;

// ---------------------------------------------------------------------------
// Utility: UUID (browser-native, no deps)
// ---------------------------------------------------------------------------
function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Filename & subdir builders
// ---------------------------------------------------------------------------

/**
 * Resolve template variables into a safe filename.
 * @param {string} template
 * @param {Object} meta - { title, quality, provider, date, year, slug, genre, manga, chapter, pages }
 * @returns {string} safe filename without extension
 */
export function buildFilename(template, meta = {}) {
  const pad = (n, len = 3) => String(n || 0).padStart(len, '0');
  const safe = (s) => String(s || '').replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();

  const vars = {
    title: safe(meta.title),
    quality: safe(meta.quality || meta.label || ''),
    provider: safe(meta.provider || ''),
    date: meta.date || new Date().toISOString().slice(0, 10),
    year: meta.year || new Date().getFullYear(),
    slug: safe(meta.slug || ''),
    genre: safe(Array.isArray(meta.genre) ? meta.genre[0] : meta.genre || ''),
    duration: safe(meta.duration || ''),
    manga: safe(meta.manga || meta.title || ''),
    chapter: safe(meta.chapter || '1'),
    chapter_padded: pad(meta.chapter),
    pages: String(meta.pages || ''),
  };

  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/**
 * Build relative subdirectory path from rules & meta.
 * @param {Object} rules - { byProvider, byGenre, byYear, byAlpha } or { byManga, byBatch, byGenre }
 * @param {Object} meta
 * @returns {string} relative subdir path (e.g. "HentaiTV/Ecchi/2024")
 */
export function buildSubdirPath(rules, meta = {}) {
  const parts = [];
  const safe = (s) => String(s || '').replace(/[/\\:*?"<>|]/g, '-').trim();

  if (rules.byProvider && meta.provider) parts.push(safe(meta.provider));
  if (rules.byGenre && meta.genre) {
    const g = Array.isArray(meta.genre) ? meta.genre[0] : meta.genre;
    if (g) parts.push(safe(g));
  }
  if (rules.byYear) parts.push(String(meta.year || new Date().getFullYear()));
  if (rules.byAlpha && meta.title) parts.push(safe(meta.title[0].toUpperCase()));

  // Manga-specific
  if (rules.byManga && meta.manga) parts.push(safe(meta.manga));
  if (rules.byBatch && meta.chapter) {
    const ch = Number(meta.chapter) || 1;
    const batchStart = Math.floor((ch - 1) / 50) * 50 + 1;
    const batchEnd = batchStart + 49;
    parts.push(`Ch.${String(batchStart).padStart(3, '0')}-${String(batchEnd).padStart(3, '0')}`);
  }

  return parts.join('/');
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

/**
 * Fetch available download sources for a video from the Kura backend.
 * @param {'tube'|'htv'|'neko'} provider
 * @param {string} slug
 * @returns {Promise<{sources: Array<{label:string,url:string}>, title:string}>}
 */
export async function fetchVideoSources(provider, slug) {
  const url = `/api/video/download/sources?provider=${encodeURIComponent(provider)}&slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Core download engine (browser mode)
// ---------------------------------------------------------------------------

/**
 * Download a file via browser using the stream proxy endpoint.
 * Tracks progress via ReadableStream chunked reading.
 *
 * @param {Object} item - DownloadItem (from queue)
 * @param {Function} onProgress - (percent, received, total, speed, eta) => void
 * @param {AbortSignal} signal - from AbortController (for cancel)
 */
async function downloadViaBrowser(item, onProgress, signal) {
  const proxyUrl = `/api/video/download/stream?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(item.filename)}`;

  const res = await fetch(proxyUrl, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const total = Number(res.headers.get('content-length') || 0);
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  let lastTime = performance.now();
  let lastReceived = 0;
  const speedWindow = []; // rolling average buffer

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    received += value.length;

    // Speed calculation (rolling 3s window)
    const now = performance.now();
    const elapsed = (now - lastTime) / 1000;
    if (elapsed >= 0.5) {
      const bytesPerSec = (received - lastReceived) / elapsed;
      speedWindow.push(bytesPerSec);
      if (speedWindow.length > 6) speedWindow.shift(); // keep last 3s
      const speed = speedWindow.reduce((a, b) => a + b, 0) / speedWindow.length;
      const eta = total > 0 && speed > 0 ? Math.round((total - received) / speed) : -1;
      const progress = total > 0 ? Math.round((received / total) * 100) : -1;
      onProgress(progress, received, total, Math.round(speed), eta);
      lastTime = now;
      lastReceived = received;
    }
  }

  // Assemble blob and trigger browser save dialog
  const blob = new Blob(chunks);
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = item.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  onProgress(100, received, total, 0, 0);
}

/**
 * Download to server disk via POST + SSE progress.
 * @param {Object} item
 * @param {Object} settings
 * @param {Function} onProgress
 */
async function downloadViaServerDisk(item, settings, onProgress) {
  const subdir = buildSubdirPath(
    item.type === 'video' ? settings.videoSubdir : settings.mangaSubdir,
    item.meta
  );

  const res = await fetch('/api/video/download/save-to-disk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: item.url,
      filename: item.filename,
      directory: item.type === 'video' ? settings.videoDir : settings.mangaDir,
      subdir,
    }),
  });

  if (!res.ok) throw new Error(`Save-to-disk failed: HTTP ${res.status}`);

  const { jobId } = await res.json();

  // Listen to SSE progress
  await new Promise((resolve, reject) => {
    const es = new EventSource(`/api/video/download/progress/${jobId}`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onProgress(data.progress ?? 0, 0, 0, 0, -1);
        if (data.status === 'done') { es.close(); resolve(); }
        if (data.status === 'error') { es.close(); reject(new Error(data.error || 'Unknown error')); }
        if (data.status === 'not_found') { es.close(); reject(new Error('Job tidak ditemukan')); }
      } catch {
        // malformed SSE
      }
    };
    es.onerror = () => { es.close(); reject(new Error('SSE connection lost')); };
  });
}

// ---------------------------------------------------------------------------
// Queue Worker
// ---------------------------------------------------------------------------

/**
 * Process a single queue item.
 */
async function processItem(item) {
  const qItem = _queue.value.find((q) => q.id === item.id);
  if (!qItem || qItem.status === 'paused' || qItem.status === 'done') return;

  const controller = new AbortController();
  qItem.controller = controller;
  qItem.status = 'downloading';

  const onProgress = (progress, received, total, speed, eta) => {
    const q = _queue.value.find((i) => i.id === item.id);
    if (q) {
      if (progress >= 0) q.progress = progress;
      q.received = received;
      q.total = total;
      q.speed = speed;
      q.eta = eta;
    }
  };

  try {
    if (qItem.type === 'manga-chapter' && typeof qItem.exportFn === 'function') {
      await qItem.exportFn((progress) => {
        onProgress(progress, 0, 0, 0, -1);
      }, controller.signal);
    } else if (_settings.value.mode === 'server-disk') {
      await downloadViaServerDisk(qItem, _settings.value, onProgress);
    } else {
      await downloadViaBrowser(qItem, onProgress, controller.signal);
    }
    qItem.status = 'done';
    qItem.progress = 100;
  } catch (err) {
    if (err.name === 'AbortError') {
      qItem.status = 'paused';
    } else {
      qItem.status = 'error';
      qItem.error = err.message;
    }
  } finally {
    qItem.controller = null;
  }
}

/**
 * Promise pool: run up to N tasks concurrently.
 * Uses Promise.race() to wait for a slot before launching next task.
 */
async function runQueue() {
  const pending = _queue.value.filter((i) => i.status === 'queued');
  if (pending.length === 0) return;

  const maxParallel = _settings.value.maxParallel;
  const active = new Set();

  for (const item of pending) {
    // Wait for a free slot
    while (active.size >= maxParallel) {
      await Promise.race(active);
    }

    const task = processItem(item).finally(() => {
      active.delete(task);
      _activeCount = active.size;
    });
    active.add(task);
    _activeCount = active.size;
  }

  // Wait for all remaining
  await Promise.allSettled([...active]);
  _activeCount = 0;
}

// ---------------------------------------------------------------------------
// Public Composable
// ---------------------------------------------------------------------------
let _queueRunning = false;

async function _kickQueue() {
  if (_queueRunning) return;
  _queueRunning = true;
  try {
    await runQueue();
  } finally {
    _queueRunning = false;
  }
}

export function useDownloadQueue() {
  const queue = readonly(_queue);
  const settings = _settings;

  const activeCount = computed(() => _queue.value.filter((i) => i.status === 'downloading').length);
  const queuedCount = computed(() => _queue.value.filter((i) => i.status === 'queued').length);
  const doneCount = computed(() => _queue.value.filter((i) => i.status === 'done').length);
  const hasActive = computed(() => activeCount.value > 0 || queuedCount.value > 0);

  /**
   * Add a video download to the queue.
   * @param {{ url, filename, meta }} opts
   */
  function addVideoDownload({ url, filename, meta = {} }) {
    const item = {
      id: uuid(),
      type: 'video',
      status: 'queued',
      progress: 0,
      speed: 0,
      eta: -1,
      received: 0,
      total: 0,
      filename,
      url,
      meta,
      error: null,
      controller: null,
    };
    _queue.value.push(item);
    _kickQueue();
    return item.id;
  }

  /**
   * Add a manga chapter export to the queue.
   * @param {{ url?: string, filename: string, meta?: Object, exportFn?: Function }} opts
   */
  function addMangaDownload({ url = '', filename, meta = {}, exportFn = null }) {
    const rawName = String(filename || 'chapter').trim();
    const safeFilename = rawName.toLowerCase().endsWith('.cbz') ? rawName : `${rawName}.cbz`;

    const item = {
      id: uuid(),
      type: 'manga-chapter',
      status: 'queued',
      progress: 0,
      speed: 0,
      eta: -1,
      received: 0,
      total: 0,
      filename: safeFilename,
      url,
      meta,
      exportFn,
      error: null,
      controller: null,
    };
    _queue.value.push(item);
    _kickQueue();
    return item.id;
  }

  /** Pause a downloading item */
  function pause(id) {
    const item = _queue.value.find((i) => i.id === id);
    if (item?.controller) {
      item.controller.abort();
      // status set to 'paused' inside processItem catch block
    }
  }

  /** Resume a paused item */
  function resume(id) {
    const item = _queue.value.find((i) => i.id === id);
    if (item && item.status === 'paused') {
      item.status = 'queued';
      item.progress = 0; // restart (no byte-range resume in browser mode)
      _kickQueue();
    }
  }

  /** Remove an item from queue */
  function remove(id) {
    const idx = _queue.value.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const item = _queue.value[idx];
    if (item.controller) item.controller.abort();
    _queue.value.splice(idx, 1);
  }

  /** Clear completed & errored items */
  function clearDone() {
    _queue.value = _queue.value.filter((i) => i.status !== 'done' && i.status !== 'error');
  }

  /** Save download settings to localStorage */
  function saveSettings() {
    try {
      localStorage.setItem('kura_download_settings', JSON.stringify(_settings.value));
    } catch (_) {}
  }

  /** Load download settings from localStorage */
  function loadSettings() {
    try {
      const raw = localStorage.getItem('kura_download_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        _settings.value = { ..._settings.value, ...parsed };
      }
    } catch (_) {}
  }

  return {
    queue,
    settings,
    activeCount,
    queuedCount,
    doneCount,
    hasActive,
    addVideoDownload,
    addMangaDownload,
    pause,
    resume,
    remove,
    clearDone,
    saveSettings,
    loadSettings,
  };
}
