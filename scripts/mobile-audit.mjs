/**
 * Kura Mobile UI/UX Audit Script — 390x844 (iPhone 14)
 * Captures screenshots + DOM measurements for all major views.
 * Output: scripts/audit-screenshots/
 */

import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'audit-screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:4000';

// iPhone 14 viewport
const MOBILE_VIEWPORT = { width: 390, height: 844 };

const results = [];

function log(msg) { console.log(`[audit] ${msg}`); }

async function measure(page, label, fn) {
  try {
    const val = await fn();
    results.push({ label, value: val, ok: true });
    return val;
  } catch (e) {
    results.push({ label, value: e.message, ok: false });
    return null;
  }
}

async function screenshot(page, name) {
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  log(`screenshot saved: ${name}.png`);
}

async function screenshotScroll(page, name) {
  // Capture 3 vertical sections (top, mid, bottom) rather than one giant fullPage image
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const sections = [
    { scrollY: 0,                          suffix: 'top' },
    { scrollY: Math.floor(totalHeight / 2), suffix: 'mid' },
    { scrollY: Math.max(0, totalHeight - MOBILE_VIEWPORT.height), suffix: 'btm' },
  ];
  for (const s of sections) {
    await page.evaluate(y => window.scrollTo(0, y), s.scrollY);
    await page.waitForTimeout(200);
    const file = join(OUT_DIR, `${name}-${s.suffix}.png`);
    await page.screenshot({ path: file });
    log(`screenshot saved: ${name}-${s.suffix}.png`);
  }
  // Reset scroll
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  // ─── 1. HOME VIEW ───────────────────────────────────────────────
  log('── HOME VIEW ──');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '01-home-above-fold');
  await screenshotScroll(page, '01-home');

  // Check horizontal overflow
  await measure(page, 'home: horizontal overflow (body.scrollWidth > 390)', async () => {
    const sw = await page.evaluate(() => document.body.scrollWidth);
    return sw > 390 ? `OVERFLOW: ${sw}px > 390px` : `OK: ${sw}px`;
  });

  // Check MobileDock visibility
  await measure(page, 'home: MobileDock visible', async () => {
    const dock = await page.$('.kura-mobile-dock');
    if (!dock) return 'NOT FOUND';
    const box = await dock.boundingBox();
    return box ? `visible at y=${Math.round(box.y)} h=${Math.round(box.height)}` : 'HIDDEN';
  });

  // Check dock container height
  await measure(page, 'home: dock-container height', async () => {
    const el = await page.$('.dock-container');
    if (!el) return 'NOT FOUND';
    const box = await el.boundingBox();
    return box ? `${Math.round(box.height)}px (target: 48px)` : 'HIDDEN';
  });

  // Check dock touch targets — each dock-item min 44px
  await measure(page, 'home: dock-item touch target heights', async () => {
    const items = await page.$$('.dock-item');
    const sizes = [];
    for (const item of items) {
      const box = await item.boundingBox();
      if (box) sizes.push(`${Math.round(box.width)}x${Math.round(box.height)}`);
    }
    const tooSmall = sizes.filter(s => {
      const [w, h] = s.split('x').map(Number);
      return w < 44 || h < 44;
    });
    return tooSmall.length > 0
      ? `TOUCH TARGET TOO SMALL: ${tooSmall.join(', ')}`
      : `OK: ${sizes.join(', ')}`;
  });

  // Check AppHeader height on mobile
  await measure(page, 'home: AppHeader height', async () => {
    const el = await page.$('.kura-topbar');
    if (!el) return 'NOT FOUND';
    const box = await el.boundingBox();
    return box ? `${Math.round(box.height)}px` : 'HIDDEN';
  });

  // Check if content is obscured by header (first content card)
  await measure(page, 'home: first content card position', async () => {
    const card = await page.$('.comic-card, .kura-card, [class*="card"]');
    if (!card) return 'NO CARD FOUND';
    const box = await card.boundingBox();
    return box ? `top=${Math.round(box.y)}px` : 'HIDDEN';
  });

  // Check search bar in mobile 2nd row
  await measure(page, 'home: mobile search bar visible', async () => {
    const sb = await page.$('.topbar-row-search');
    if (!sb) return 'NOT FOUND';
    const box = await sb.boundingBox();
    return box ? `visible, width=${Math.round(box.width)}px` : 'HIDDEN';
  });

  // ─── 2. CATALOG VIEW ────────────────────────────────────────────
  log('── CATALOG VIEW ──');
  await page.evaluate(() => {
    // Simulate navigation to catalog tab
    const dock = document.querySelectorAll('.dock-item');
    if (dock[1]) dock[1].click();
  });
  await page.waitForTimeout(1500);
  await screenshot(page, '02-catalog-above-fold');
  await screenshotScroll(page, '02-catalog');

  // Check grid column count
  await measure(page, 'catalog: grid column count at 390px', async () => {
    const grid = await page.$('.manga-grid, .comic-grid, [class*="grid"]');
    if (!grid) return 'GRID NOT FOUND';
    const cols = await page.evaluate(el => {
      const style = window.getComputedStyle(el);
      const gtc = style.getPropertyValue('grid-template-columns');
      if (gtc && gtc !== 'none') return `grid-template-columns: ${gtc}`;
      return `display: ${style.display}`;
    }, grid);
    return cols;
  });

  // Check ComicCard width at mobile
  await measure(page, 'catalog: ComicCard width', async () => {
    const cards = await page.$$('.comic-card, .kura-card, [class*="ComicCard"]');
    if (!cards.length) return 'NO CARDS';
    const box = await cards[0].boundingBox();
    return box ? `first card: ${Math.round(box.width)}x${Math.round(box.height)}px` : 'HIDDEN';
  });

  // Check horizontal overflow on catalog
  await measure(page, 'catalog: horizontal overflow', async () => {
    const sw = await page.evaluate(() => document.body.scrollWidth);
    return sw > 390 ? `OVERFLOW: ${sw}px > 390px` : `OK: ${sw}px`;
  });

  // Check bottom dock not covering content
  await measure(page, 'catalog: bottom padding for dock clearance', async () => {
    const main = await page.$('main, .main-content, [class*="main"]');
    if (!main) return 'MAIN NOT FOUND';
    const style = await page.evaluate(el => {
      return window.getComputedStyle(el).paddingBottom;
    }, main);
    return `padding-bottom: ${style}`;
  });

  // ─── 3. VIDEO / CINEMA VIEW ─────────────────────────────────────
  log('── CINEMA VIEW ──');
  await page.evaluate(() => {
    const dock = document.querySelectorAll('.dock-item');
    if (dock[2]) dock[2].click();
  });
  await page.waitForTimeout(1500);
  await screenshot(page, '03-cinema-above-fold');
  await screenshotScroll(page, '03-cinema');

  await measure(page, 'cinema: horizontal overflow', async () => {
    const sw = await page.evaluate(() => document.body.scrollWidth);
    return sw > 390 ? `OVERFLOW: ${sw}px > 390px` : `OK: ${sw}px`;
  });

  // Check video card aspect ratio
  await measure(page, 'cinema: video card aspect ratio', async () => {
    const card = await page.$('[class*="video-card"], [class*="VideoCard"], .video-thumb');
    if (!card) return 'NO VIDEO CARD FOUND';
    const box = await card.boundingBox();
    if (!box) return 'HIDDEN';
    const ratio = (box.height / box.width).toFixed(2);
    return `${Math.round(box.width)}x${Math.round(box.height)} ratio=${ratio} (target 16:9=0.56)`;
  });

  // ─── 4. LIBRARY VIEW ────────────────────────────────────────────
  log('── LIBRARY VIEW ──');
  await page.evaluate(() => {
    const dock = document.querySelectorAll('.dock-item');
    if (dock[3]) dock[3].click();
  });
  await page.waitForTimeout(1000);
  await screenshot(page, '04-library-above-fold');
  await screenshotScroll(page, '04-library');

  await measure(page, 'library: horizontal overflow', async () => {
    const sw = await page.evaluate(() => document.body.scrollWidth);
    return sw > 390 ? `OVERFLOW: ${sw}px > 390px` : `OK: ${sw}px`;
  });

  // ─── 5. SETTINGS VIEW ───────────────────────────────────────────
  log('── SETTINGS VIEW ──');
  await page.evaluate(() => {
    const dock = document.querySelectorAll('.dock-item');
    if (dock[4]) dock[4].click();
  });
  await page.waitForTimeout(1000);
  await screenshot(page, '05-settings-above-fold');
  await screenshotScroll(page, '05-settings');

  await measure(page, 'settings: horizontal overflow', async () => {
    const sw = await page.evaluate(() => document.body.scrollWidth);
    return sw > 390 ? `OVERFLOW: ${sw}px > 390px` : `OK: ${sw}px`;
  });

  // ─── 6. GLOBAL CHECKS ───────────────────────────────────────────
  log('── GLOBAL CHECKS ──');

  // Back to home for global checks
  await page.evaluate(() => {
    const dock = document.querySelectorAll('.dock-item');
    if (dock[0]) dock[0].click();
  });
  await page.waitForTimeout(800);

  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Check all action buttons in header — min 44x44
  await measure(page, 'header: action buttons touch target (all >= 44px?)', async () => {
    const btns = await page.$$('.action-pill, .icon-action-btn, .user-avatar-btn');
    const sizes = [];
    for (const btn of btns) {
      const box = await btn.boundingBox();
      if (box) sizes.push(`${Math.round(box.width)}x${Math.round(box.height)}`);
    }
    const tooSmall = sizes.filter(s => {
      const [w, h] = s.split('x').map(Number);
      return w < 44 || h < 44;
    });
    return tooSmall.length > 0
      ? `TOUCH TARGET TOO SMALL: ${tooSmall.join(', ')} (all: ${sizes.join(', ')})`
      : `OK: ${sizes.join(', ')}`;
  });

  // Check safe-area-inset usage on dock
  await measure(page, 'dock: safe-area-inset-bottom in CSS', async () => {
    const el = await page.$('.kura-mobile-dock');
    if (!el) return 'NOT FOUND';
    const bottom = await page.evaluate(el => window.getComputedStyle(el).bottom, el);
    return `bottom: ${bottom}`;
  });

  // Check focus-visible on dock items
  await measure(page, 'dock-item: outline/focus-visible defined', async () => {
    const el = await page.$('.dock-item');
    if (!el) return 'NOT FOUND';
    const outline = await page.evaluate(el => {
      el.focus();
      return window.getComputedStyle(el).outline;
    }, el);
    return `outline: ${outline}`;
  });

  // Check meta viewport tag
  await measure(page, 'meta viewport: user-scalable check', async () => {
    const content = await page.$eval('meta[name="viewport"]', el => el.content).catch(() => 'NOT FOUND');
    const hasNoScale = content.includes('user-scalable=no') || content.includes('user-scalable=0');
    return hasNoScale ? `BLOCKING: user-scalable disabled — ${content}` : `OK: ${content}`;
  });

  // Check color-scheme meta
  await measure(page, 'meta theme-color', async () => {
    const tc = await page.$eval('meta[name="theme-color"]', el => el.content).catch(() => 'NOT FOUND');
    return tc;
  });

  // Check dock overlap with last content item
  await measure(page, 'dock: bottom position (should clear content)', async () => {
    const dock = await page.$('.dock-container');
    if (!dock) return 'NOT FOUND';
    const dockBox = await dock.boundingBox();
    return dockBox ? `dock top edge at y=${Math.round(dockBox.y)}, bottom at y=${Math.round(dockBox.y + dockBox.height)}` : 'HIDDEN';
  });

  // ─── 7. ACCESSIBILITY CHECKS ─────────────────────────────────────
  log('── ACCESSIBILITY CHECKS ──');

  // Check aria-label on all icon-only buttons
  await measure(page, 'a11y: icon-only buttons have aria-label', async () => {
    const issues = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const bad = [];
      for (const btn of btns) {
        const text = btn.textContent?.trim();
        const label = btn.getAttribute('aria-label');
        const hasOnlyIcon = btn.querySelector('svg') && !text;
        if (hasOnlyIcon && !label) {
          bad.push(btn.className || btn.id || 'unknown');
        }
      }
      return bad;
    });
    return issues.length > 0 ? `MISSING aria-label: [${issues.join(', ')}]` : 'OK';
  });

  // Check images have alt text
  await measure(page, 'a11y: images have alt attribute', async () => {
    const missing = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).filter(img => !img.hasAttribute('alt')).length;
    });
    return missing > 0 ? `${missing} images missing alt attribute` : 'OK';
  });

  // Check heading hierarchy
  await measure(page, 'a11y: heading hierarchy (no skip)', async () => {
    const headings = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
        .map(h => h.tagName)
        .join(', ');
    });
    return headings || 'NO HEADINGS FOUND';
  });

  await browser.close();

  // ─── PRINT SUMMARY ───────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════');
  console.log('  KURA MOBILE AUDIT RESULTS — 390×844 (iPhone 14)');
  console.log('════════════════════════════════════════════════');
  for (const r of results) {
    const icon = r.ok ? (String(r.value).startsWith('OVERFLOW') || String(r.value).startsWith('TOUCH TARGET') || String(r.value).startsWith('BLOCKING') || String(r.value).startsWith('MISSING') ? '⚠️ ' : '✅ ') : '❌ ';
    console.log(`${icon} ${r.label}`);
    console.log(`     → ${r.value}`);
  }

  // Save JSON report
  const reportPath = join(OUT_DIR, 'audit-report.json');
  writeFileSync(reportPath, JSON.stringify({ viewport: '390x844', timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\n📄 Full report saved: ${reportPath}`);
  console.log(`📸 Screenshots saved: ${OUT_DIR}`);
}

run().catch(e => {
  console.error('Audit script error:', e);
  process.exit(1);
});
