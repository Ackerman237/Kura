import fs from 'node:fs';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

/* ───────────── Konfigurasi ───────────── */

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const USER_AGENT =
  process.env.EPORNER_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const API_BASE = (process.env.EPORNER_API_BASE || 'https://api.eporner.com/api/v2').replace(/\/+$/, '');

const CONFIG = {
  cacheTtl: num(process.env.PROXY_CACHE_TTL, 10 * 60_000),
  timeout: num(process.env.PROXY_TIMEOUT, 10_000),            // request nyata via proxy
  concurrency: num(process.env.PROXY_CONCURRENCY, 3),         // proxy bagus yang diadu per ronde
  maxRounds: num(process.env.PROXY_MAX_ROUNDS, 4),
  badCooldown: num(process.env.PROXY_BAD_COOLDOWN, 10 * 60_000),
  goodTtl: num(process.env.PROXY_GOOD_TTL, 15 * 60_000),
  probeTimeout: num(process.env.PROXY_PROBE_TIMEOUT, 6_000),  // uji satu proxy
  probeConcurrency: num(process.env.PROXY_PROBE_CONCURRENCY, 60),
  warmupBudget: num(process.env.PROXY_WARMUP_BUDGET, 60_000), // batas waktu total warm-up
  minGood: num(process.env.PROXY_MIN_GOOD, 3),               // berhenti kalau sudah dapat sekian proxy bagus
  providerTimeout: num(process.env.PROXY_PROVIDER_TIMEOUT, 5_000),
  testUrl:
    process.env.PROXY_TEST_URL ||
    `${API_BASE}/video/search/?per_page=1&page=1&format=json&thumbsize=small`,
  testReferer: 'https://www.eporner.com/',
};

// Kosongkan PROXY_CACHE_FILE di .env untuk mematikan fitur simpan ke file
const CACHE_FILE =
  process.env.PROXY_CACHE_FILE === undefined
    ? '.proxy-cache.json'
    : process.env.PROXY_CACHE_FILE;

const PROXY_RE = /^https?:\/\/[^\s/:]+:\d{2,5}$/;
const PASSTHROUGH_STATUS = new Set([404, 410]); // bukan salah proxy

const debug = (...args) => {
  if (process.env.PROXY_DEBUG === '1') console.log('[proxy]', ...args);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "fetch failed" saja tidak informatif; penyebab aslinya ada di error.cause
const describe = (e) => {
  const c = e?.cause;
  return c ? `${e.message} [${c.code || c.name}: ${c.message}]` : e?.message || String(e);
};

/* ───────────── State ───────────── */

const state = {
  pool: [],
  loadedAt: 0,
  refreshing: null,
  warm: null,        // promise warm-up yang sedang berjalan
  seed: [],          // proxy dari file, diuji ulang saat warm-up pertama
  good: new Map(),   // proxy -> timestamp sukses terakhir
  bad: new Map(),    // proxy -> diblokir sampai timestamp
  agents: new Map(), // proxy -> ProxyAgent (di-cache)
};

/* ───────────── Simpan proxy bagus ke file ───────────── */

let dirty = false;
let saveTimer = null;

function loadSaved() {
  if (!CACHE_FILE) return [];
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return (data.good || [])
      .map((g) => g.proxy)
      .filter((p) => typeof p === 'string' && PROXY_RE.test(p))
      .slice(0, 30);
  } catch {
    return []; // file belum ada atau rusak: abaikan
  }
}

function writeGood() {
  if (!CACHE_FILE || !dirty) return;
  dirty = false;
  try {
    const good = [...state.good.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([proxy, at]) => ({ proxy, at }));

    // tulis ke file sementara lalu rename, supaya tidak ada file setengah jadi
    const tmp = `${CACHE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ savedAt: Date.now(), good }, null, 2));
    fs.renameSync(tmp, CACHE_FILE);
  } catch (error) {
    debug(`gagal menyimpan cache proxy: ${describe(error)}`);
  }
}

// Ditunda 2 detik supaya banyak perubahan beruntun cukup jadi satu kali tulis
function scheduleSave() {
  dirty = true;
  if (!CACHE_FILE || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeGood();
  }, 2_000);
  saveTimer.unref();
}

// Script pendek (seperti examples/basic.js) bisa selesai sebelum timer jalan
process.once('exit', writeGood);

state.seed = loadSaved();
if (state.seed.length > 0) {
  console.log(`[proxy] ${state.seed.length} proxy tersimpan dimuat dari ${CACHE_FILE}`);
}

/* ───────────── Provider ───────────── */

function parseList(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((p) => (p.includes('://') ? p : `http://${p}`))
    .filter((p) => PROXY_RE.test(p));
}

async function fetchList(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(CONFIG.providerTimeout),
    headers: { Accept: 'text/plain', 'User-Agent': 'doujin-scraper/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseList(await res.text());
}

const providers = {
  proxmint: () =>
    fetchList('https://proxmint.com/api/free-proxies?protocol=http&format=txt'),

  proxyscrape: () =>
    fetchList(
      'https://api.proxyscrape.com/v4/free-proxy-list/get' +
        '?request=display_proxies&proxy_format=protocolipport&format=text&protocol=http'
    ),

  speedx: () =>
    fetchList('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt'),

  // Dua list di bawah ini di-update rutin dan biasanya lebih segar.
  // Kalau ada yang 404, log akan menampilkannya dan provider lain tetap jalan.
  monosans: () =>
    fetchList('https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'),

  proxifly: () =>
    fetchList(
      'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt'
    ),
};

/* ───────────── Util ───────────── */

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getAgent(proxy) {
  let agent = state.agents.get(proxy);
  if (!agent) {
    agent = new ProxyAgent(proxy);
    state.agents.set(proxy, agent);
  }
  return agent;
}

function closeAgent(proxy) {
  const agent = state.agents.get(proxy);
  if (agent) {
    state.agents.delete(proxy);
    agent.close().catch(() => {});
  }
}

function markBad(proxy) {
  if (state.good.delete(proxy)) scheduleSave(); // hanya jika memang ada di daftar bagus
  state.bad.set(proxy, Date.now() + CONFIG.badCooldown);
  closeAgent(proxy);
}

const buildSignal = (...signals) => AbortSignal.any(signals.filter(Boolean));

/* ───────────── Pool ───────────── */

async function doRefresh() {
  const names = (
    process.env.EPORNER_PROXY_PROVIDERS ||
    'proxmint,proxyscrape,speedx,monosans,proxifly'
  )
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const results = await Promise.allSettled(
    names.map((name) => {
      const provider = providers[name];
      return provider
        ? provider()
        : Promise.reject(new Error('provider tidak dikenal'));
    })
  );

  const all = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      debug(`${names[i]}: ${r.value.length} proxy`);
      all.push(...r.value);
    } else {
      console.warn(`[proxy] ${names[i]} gagal: ${describe(r.reason)}`);
    }
  });

  if (all.length === 0) {
    if (state.pool.length > 0) {
      console.warn('[proxy] semua provider gagal, pakai pool lama');
      state.loadedAt = Date.now() - CONFIG.cacheTtl + 30_000;
      return state.pool;
    }
    throw new Error('Semua provider proxy gagal dan pool kosong');
  }

  state.pool = shuffle([...new Set(all)]);
  state.loadedAt = Date.now();

  const now = Date.now();
  for (const [proxy, until] of state.bad) {
    if (until <= now) state.bad.delete(proxy);
  }
  for (const proxy of [...state.agents.keys()]) {
    if (!state.good.has(proxy)) closeAgent(proxy);
  }

  console.log(
    `[proxy] pool dimuat: ${state.pool.length} kandidat, ${state.good.size} proxy bagus dipertahankan`
  );
  return state.pool;
}

function refreshPool() {
  if (!state.refreshing) {
    state.refreshing = doRefresh().finally(() => {
      state.refreshing = null;
    });
  }
  return state.refreshing;
}

async function getPool() {
  const expired = Date.now() - state.loadedAt > CONFIG.cacheTtl;
  if (state.pool.length === 0 || expired) return refreshPool();
  return state.pool;
}

/* ───────────── Warm-up: cari proxy yang benar-benar hidup ───────────── */

// Uji satu proxy dengan request kecil ke API Eporner yang sebenarnya.
async function probe(proxy) {
  try {
    const res = await undiciFetch(CONFIG.testUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        Referer: CONFIG.testReferer,
      },
      dispatcher: getAgent(proxy),
      signal: AbortSignal.timeout(CONFIG.probeTimeout),
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!Array.isArray(json?.videos)) throw new Error('bukan JSON API Eporner');
    return true;
  } catch (error) {
    debug(`uji gagal ${proxy}: ${describe(error)}`);
    markBad(proxy);
    return false;
  }
}

// Uji antrean proxy secara paralel; berhenti jika target tercapai atau waktu habis
async function probeMany(queue, deadline) {
  let tested = 0;

  const worker = async () => {
    while (
      queue.length > 0 &&
      state.good.size < CONFIG.minGood &&
      Date.now() < deadline
    ) {
      const proxy = queue.shift();
      tested++;
      if (await probe(proxy)) {
        state.good.set(proxy, Date.now());
        scheduleSave();
        console.log(
          `[proxy] lolos uji: ${proxy} (bagus: ${state.good.size}, diuji: ${tested})`
        );
      } else if (tested % 100 === 0) {
        console.log(`[proxy] warm-up: ${tested} diuji, ${state.good.size} bagus`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONFIG.probeConcurrency }, worker));
  return tested;
}

async function runWarmUp() {
  const deadline = Date.now() + CONFIG.warmupBudget;

  // Tahap 1: uji ulang proxy dari file (cepat, tanpa mengambil daftar provider)
  if (state.seed.length > 0) {
    const seeds = state.seed.splice(0);
    console.log(`[proxy] menguji ulang ${seeds.length} proxy tersimpan`);
    const n = await probeMany(seeds, deadline);
    console.log(`[proxy] proxy tersimpan: ${state.good.size} masih hidup dari ${n} diuji`);
    if (state.good.size >= CONFIG.minGood) return;
  }

  // Tahap 2: cari proxy baru dari pool provider
  await getPool();

  const now = Date.now();
  const queue = state.pool.filter(
    (p) => !state.good.has(p) && !((state.bad.get(p) ?? 0) > now)
  );

  console.log(
    `[proxy] warm-up: menguji hingga ${queue.length} kandidat (target ${CONFIG.minGood} proxy bagus, maks ${CONFIG.warmupBudget / 1000}s)`
  );

  const tested = await probeMany(queue, deadline);
  console.log(`[proxy] warm-up selesai: ${state.good.size} bagus dari ${tested} diuji`);
}

function startWarmUp() {
  if (!state.warm) {
    state.warm = runWarmUp()
      .catch((e) => console.warn(`[proxy] warm-up error: ${describe(e)}`))
      .finally(() => {
        state.warm = null;
      });
  }
  return state.warm;
}

function pickGood(count, tried) {
  const now = Date.now();
  for (const [proxy, at] of state.good) {
    if (now - at > CONFIG.goodTtl) {
      state.good.delete(proxy);
      closeAgent(proxy);
      scheduleSave();
    }
  }
  return [...state.good.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([proxy]) => proxy)
    .filter((p) => !tried.has(p))
    .slice(0, count);
}

// Tunggu sampai ada proxy bagus yang belum dicoba, atau warm-up selesai.
async function waitForGood(tried, signal) {
  startWarmUp();
  const until = Date.now() + CONFIG.warmupBudget + CONFIG.probeTimeout;

  while (Date.now() < until) {
    signal?.throwIfAborted();
    if (pickGood(1, tried).length > 0) return true;
    if (!state.warm) return pickGood(1, tried).length > 0; // warm-up sudah selesai
    await sleep(250);
  }
  return false;
}

/* ───────────── Eksekusi request ───────────── */

async function attempt(proxy, url, init, validate, raceSignal) {
  const signal = buildSignal(
    raceSignal,
    init.signal,
    AbortSignal.timeout(CONFIG.timeout)
  );

  const res = await undiciFetch(url, {
    ...init,
    dispatcher: getAgent(proxy),
    signal,
  });

  const passthrough = PASSTHROUGH_STATUS.has(res.status);

  if (!res.ok && !passthrough) {
    await res.body?.cancel().catch(() => {});
    throw new Error(`HTTP ${res.status}`);
  }

  // Baca body penuh di sini: proxy yang macet di tengah body ikut gagal.
  const buffer = Buffer.from(await res.arrayBuffer());

  const headers = new Headers(res.headers);
  headers.delete('content-encoding'); // undici sudah men-decode
  headers.delete('content-length');

  const out = new Response(buffer, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });

  if (!passthrough && validate && !(await validate(out.clone()))) {
    throw new Error('validasi isi response gagal');
  }

  return out;
}

async function raceBatch(proxies, url, init, validate) {
  const controllers = proxies.map(() => new AbortController());

  const tasks = proxies.map((proxy, i) =>
    attempt(proxy, url, init, validate, controllers[i].signal).then(
      (res) => ({ proxy, res }),
      (error) => {
        if (!controllers[i].signal.aborted) {
          debug(`gagal ${proxy}: ${describe(error)}`);
          markBad(proxy);
        }
        throw error;
      }
    )
  );

  try {
    const winner = await Promise.any(tasks);
    proxies.forEach((proxy, i) => {
      if (proxy !== winner.proxy) controllers[i].abort(); // yang kalah tidak dianggap rusak
    });
    return winner;
  } catch {
    return null;
  }
}

async function fetchViaPool(url, init, validate) {
  const tried = new Set();
  const startedAt = Date.now();

  for (let round = 0; round < CONFIG.maxRounds; round++) {
    init.signal?.throwIfAborted();

    if (pickGood(1, tried).length === 0) {
      const found = await waitForGood(tried, init.signal);
      if (!found) break;
    }

    const batch = pickGood(CONFIG.concurrency, tried);
    if (batch.length === 0) break;
    batch.forEach((p) => tried.add(p));

    const winner = await raceBatch(batch, url, init, validate);
    if (winner) {
      state.good.set(winner.proxy, Date.now());
      console.log(
        `[proxy] sukses via ${winner.proxy} (${Date.now() - startedAt}ms, ronde ${round + 1})`
      );
      return winner.res;
    }
  }

  if (process.env.EPORNER_PROXY_FALLBACK === 'direct') {
    console.warn('[proxy] tidak ada proxy yang bekerja, fallback ke koneksi langsung');
    try {
      return await fetch(url, init);
    } catch (error) {
      throw new Error(`fallback direct gagal: ${describe(error)}`);
    }
  }

  throw new Error(`Tidak ada proxy yang bekerja untuk ${url}`);
}

/* ───────────── API publik ───────────── */

export const validators = {
  json: async (res) => {
    try {
      await res.json();
      return true;
    } catch {
      return false;
    }
  },
  html: (marker) => async (res) =>
    (await res.text()).toLowerCase().includes(marker.toLowerCase()),
};

/** Panggil saat server start supaya request pertama tidak menunggu. Tidak perlu di-await. */
export function warmUpProxies() {
  const mode = (process.env.EPORNER_PROXY_MODE || 'direct').toLowerCase();
  return mode === 'auto' ? startWarmUp() : Promise.resolve();
}

export function getProxyStats() {
  return {
    pool: state.pool.length,
    good: [...state.good.keys()],
    bad: state.bad.size,
    warming: Boolean(state.warm),
    loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null,
  };
}

/**
 * mode direct : fetch biasa
 * mode manual : pakai EPORNER_PROXY
 * mode auto   : pool proxy publik (warm-up, sticky, cooldown, cache file)
 *
 * options.validate(res): async, true jika isi response valid (menerima clone Response).
 */
export async function fetchThroughProxy(url, init = {}, options = {}) {
  const mode = (process.env.EPORNER_PROXY_MODE || 'direct').toLowerCase();

  if (mode === 'direct') return fetch(url, init);

  if (mode === 'manual') {
    const proxy = process.env.EPORNER_PROXY;
    if (!proxy) {
      throw new Error('EPORNER_PROXY_MODE=manual tapi EPORNER_PROXY kosong');
    }
    return undiciFetch(url, {
      ...init,
      dispatcher: getAgent(proxy),
      signal: buildSignal(init.signal, AbortSignal.timeout(CONFIG.timeout * 2)),
    });
  }

  if (mode !== 'auto') {
    throw new Error(`EPORNER_PROXY_MODE tidak dikenal: ${mode}`);
  }

  return fetchViaPool(url, init, options.validate);
}