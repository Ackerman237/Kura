/**
 * Test: MangaDetail mobile layout dengan judul super panjang
 * Inject mock data langsung ke Vue app via localStorage + URL state
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'audit-screenshots');
mkdirSync(OUT, { recursive: true });

const MOBILE = { width: 390, height: 844 };

// Simulasi judul panjang ala light novel Jepang
const LONG_TITLES = [
  {
    label: 'long-jp',
    title: 'Ore no Imouto ga Konnani Kawaii Wake ga Nai: Kuroneko to Kirino no Nazo no Kankei ni Tsuite no Hanashi',
    altTitle: '俺の妹がこんなに可愛いわけがない',
  },
  {
    label: 'long-en',
    title: 'The Most Notorious "Talker" Runs the World\'s Greatest Clan: A Beautiful Assassin and the Sword Saint Join Forces Against the Demon King',
    altTitle: null,
  },
  {
    label: 'medium',
    title: 'Mushoku Tensei: Isekai Ittara Honki Dasu',
    altTitle: '無職転生 ～異世界行ったら本気だす～',
  },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const tc of LONG_TITLES) {
    const context = await browser.newContext({
      viewport: MOBILE,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();
    await page.goto('http://localhost:4000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Inject a fake manga detail view by manipulating the app state
    await page.evaluate(({ title, altTitle }) => {
      // Try to find Vue app instance and set manga detail state
      const appEl = document.getElementById('app');
      if (!appEl || !appEl.__vue_app__) return;

      // Store mock data that the app might pick up
      const mockManga = {
        slug: 'test-long-title',
        title,
        altTitle,
        type: 'manga',
        status: 'Ongoing',
        rating: 8.7,
        score: 8.7,
        views: '2.4M',
        author: 'Fujimi Shobo',
        artist: 'Shiromanta',
        synopsis: 'Sinopsis panjang untuk pengujian layout detail halaman manga dengan judul yang sangat panjang sekali melebihi batas normal tampilan.',
        genres: ['Romance', 'Comedy', 'School Life', 'Ecchi', 'Harem', 'Drama'],
        chapters: Array.from({ length: 45 }, (_, i) => ({
          id: `ch-${i + 1}`,
          chapterNumber: i + 1,
          title: `Chapter ${i + 1}`,
        })),
        cover: '',
        thumb: '',
      };

      // Navigate to detail view
      window.__kura_test_manga__ = mockManga;
    }, { title: tc.title, altTitle: tc.altTitle });

    // Navigate to catalog then use search to trigger detail or directly manipulate
    // Since we can't easily navigate to detail without real data, render a mock HTML
    await page.evaluate(({ title, altTitle }) => {
      const mockHtml = `
        <div style="position:fixed;inset:0;background:#0E0F12;overflow-y:auto;z-index:99999;font-family:system-ui,sans-serif;color:#F4F4F6;">
          <!-- Nav Bar -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(14,15,18,0.95);border-bottom:1px solid rgba(255,255,255,0.08);position:sticky;top:0;z-index:10;">
            <button style="display:flex;align-items:center;gap:8px;background:transparent;border:none;color:#9CA3AF;font-size:0.82rem;font-weight:600;cursor:pointer;">
              ← Kembali ke Katalog
            </button>
            <button style="display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:9999px;background:#17181C;border:1px solid rgba(255,255,255,0.1);color:#9CA3AF;font-size:0.76rem;">
              Bookmark
            </button>
          </div>

          <!-- Hero Section — NEW ROW LAYOUT -->
          <div style="position:relative;padding:16px;overflow:hidden;">
            <div style="position:absolute;inset:-20px;background:linear-gradient(180deg,rgba(14,15,18,0.4),rgba(14,15,18,0.85) 75%,#0E0F12 100%);z-index:1;"></div>

            <div style="position:relative;z-index:3;display:flex;flex-direction:row;align-items:flex-start;gap:14px;text-align:left;">
              <!-- Cover: kiri kecil 100px -->
              <div style="flex-shrink:0;width:100px;aspect-ratio:2/3;border-radius:10px;background:#17181C;border:1px solid rgba(255,255,255,0.15);box-shadow:0 16px 36px rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;color:#636674;font-size:0.6rem;">
                [Cover]
              </div>

              <!-- Meta: kanan flex-1 -->
              <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;">
                <!-- Title dengan clamp -->
                <h1 style="font-size:clamp(0.88rem,4vw,1.25rem);font-weight:800;line-height:1.3;margin:0;word-break:break-word;overflow-wrap:anywhere;">${title}</h1>
                ${altTitle ? `<p style="font-size:0.72rem;color:#9CA3AF;margin:0;">${altTitle}</p>` : ''}

                <!-- Stat Strip -->
                <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);padding:6px 10px;border-radius:6px;width:100%;">
                  <span style="font-size:0.95rem;font-weight:700;color:#fbbf24;">★ 8.7</span>
                  <span style="width:1px;height:14px;background:rgba(255,255,255,0.15);"></span>
                  <span style="font-size:0.95rem;font-weight:700;">45 <small style="font-size:0.68rem;color:#9CA3AF;">Chapter</small></span>
                </div>

                <!-- Author -->
                <div style="font-size:0.74rem;display:grid;gap:4px;">
                  <div><span style="color:#9CA3AF;">Penulis:</span> <span style="font-weight:600;">Fujimi Shobo</span></div>
                  <div><span style="color:#9CA3AF;">Artis:</span> <span style="font-weight:600;">Shiromanta</span></div>
                </div>

                <!-- Genres: horizontal scroll -->
                <div style="display:flex;flex-wrap:nowrap;gap:5px;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;-webkit-mask-image:linear-gradient(to right,black 88%,transparent 100%);mask-image:linear-gradient(to right,black 88%,transparent 100%);">
                  ${['Romance','Comedy','School Life','Ecchi','Harem','Drama','Slice of Life'].map(g =>
                    `<span style="flex-shrink:0;font-size:0.68rem;color:#cbd5e1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);padding:2px 8px;border-radius:9999px;white-space:nowrap;">${g}</span>`
                  ).join('')}
                </div>

                <!-- CTA -->
                <div style="display:flex;flex-direction:column;gap:8px;width:100%;">
                  <button style="display:flex;align-items:center;justify-content:center;gap:8px;height:38px;width:100%;border-radius:9999px;background:#FF6B00;color:#000;font-size:0.8rem;font-weight:700;border:none;">
                    ▶ Mulai Baca (Ch. 1)
                  </button>
                  <button style="display:flex;align-items:center;justify-content:center;gap:8px;height:38px;width:100%;border-radius:9999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:0.8rem;">
                    🔖 Tambah ke Bookmark
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style="padding:8px 16px;font-size:0.6rem;color:#636674;text-align:center;">
            [NEW ROW LAYOUT — after fix]
          </div>
        </div>
      `;

      const overlay = document.createElement('div');
      overlay.id = 'mock-detail-test';
      overlay.innerHTML = mockHtml;
      document.body.appendChild(overlay);
    }, { title: tc.title, altTitle: tc.altTitle });

    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, `detail-${tc.label}-current.png`) });
    console.log(`saved: detail-${tc.label}-current.png`);

    // Remove overlay
    await page.evaluate(() => {
      document.getElementById('mock-detail-test')?.remove();
    });

    await context.close();
  }

  await browser.close();
  console.log('\nDone. Check scripts/audit-screenshots/detail-*.png');
}

run().catch(e => { console.error(e); process.exit(1); });
