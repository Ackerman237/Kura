/**
 * Quick screenshot: Cinema view, switch to Eporner tab
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'audit-screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const MOBILE = { width: 390, height: 844 };

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  const page = await context.newPage();
  await page.goto('http://localhost:4000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // Navigate to Cinema tab
  await page.evaluate(() => {
    const dock = document.querySelectorAll('.dock-item');
    if (dock[2]) dock[2].click();
  });
  await page.waitForTimeout(1500);

  // Click "Eporner Tube" provider option
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], .provider-item, .studio-item'));
    const eporner = btns.find(b => b.textContent.toLowerCase().includes('eporner'));
    if (eporner) eporner.click();
    else {
      // try clicking 4th option in provider list
      const items = document.querySelectorAll('.provider-card, .studio-card, [class*="studio"], [class*="provider"]');
      if (items[3]) items[3].click();
    }
  });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: join(OUT_DIR, 'eporner-top.png') });
  console.log('saved eporner-top.png');

  // scroll mid
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT_DIR, 'eporner-mid.png') });
  console.log('saved eporner-mid.png');

  // Check what font is computed on a title element
  const fontInfo = await page.evaluate(() => {
    const titles = document.querySelectorAll('[class*="title"], [class*="card-title"], h3, h4');
    const info = [];
    for (const el of Array.from(titles).slice(0, 3)) {
      const cs = window.getComputedStyle(el);
      info.push({
        text: el.textContent.trim().slice(0, 60),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
      });
    }
    return info;
  });

  console.log('\nFont info on title elements:');
  fontInfo.forEach(f => console.log(`  "${f.text}" → ${f.fontFamily} @ ${f.fontSize}`));

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
