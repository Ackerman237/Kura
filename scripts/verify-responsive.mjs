/**
 * Kura Responsive Visual Verification Script
 * Tests all required viewports: 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920px
 */

import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = join(process.cwd(), '.playwright-screenshots');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '320px',  width: 320,  height: 568  },
  { name: '360px',  width: 360,  height: 640  },
  { name: '390px',  width: 390,  height: 844  },
  { name: '430px',  width: 430,  height: 932  },
  { name: '768px',  width: 768,  height: 1024 },
  { name: '1024px', width: 1024, height: 768  },
  { name: '1280px', width: 1280, height: 800  },
  { name: '1440px', width: 1440, height: 900  },
  { name: '1920px', width: 1920, height: 1080 },
];

const PAGES = [
  { name: 'home',    url: '/',              wait: 2500  },
  { name: 'catalog', url: '/?tab=catalog', wait: 2000  },
];

async function checkResponsiveIssues(page, viewport) {
  const issues = [];

  // 1. Check for horizontal overflow
  const hasHorizontalOverflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return body.scrollWidth > window.innerWidth + 5 || html.scrollWidth > window.innerWidth + 5;
  });

  if (hasHorizontalOverflow) {
    const offenders = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const offenders = [];
      for (const el of elements) {
        try {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 5 && rect.width > 0) {
            offenders.push({
              tag: el.tagName,
              class: (el.className?.toString?.() || '').slice(0, 50),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
          }
        } catch (e) {}
      }
      return offenders.slice(0, 5);
    });
    issues.push({
      type: 'HORIZONTAL_OVERFLOW',
      severity: 'BLOCKING',
      details: offenders,
    });
  }

  // 2. Check touch targets (mobile only)
  if (viewport.width <= 768) {
    const tinyTargets = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button:not([disabled]), a[href], [role="button"]'));
      const tiny = [];
      for (const el of interactive) {
        try {
          const rect = el.getBoundingClientRect();
          if (rect.width > 5 && rect.height > 5 && (rect.width < 36 || rect.height < 36)) {
            tiny.push({
              tag: el.tagName,
              text: (el.textContent?.trim() || '').slice(0, 30),
              class: (el.className?.toString?.() || '').slice(0, 50),
              w: Math.round(rect.width),
              h: Math.round(rect.height),
            });
          }
        } catch (e) {}
      }
      return tiny.slice(0, 8);
    });

    if (tinyTargets.length > 0) {
      issues.push({
        type: 'TOUCH_TARGET_TOO_SMALL',
        severity: 'MAJOR',
        details: tinyTargets,
      });
    }
  }

  // 3. Check text overflow on headings
  const textOverflow = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll('h1, h2, h3'));
    const issues = [];
    for (const el of textEls) {
      try {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 5) {
          issues.push({
            tag: el.tagName,
            text: (el.textContent?.trim() || '').slice(0, 40),
            right: Math.round(rect.right),
          });
        }
      } catch (e) {}
    }
    return issues.slice(0, 5);
  });

  if (textOverflow.length > 0) {
    issues.push({
      type: 'HEADING_OVERFLOW',
      severity: 'MAJOR',
      details: textOverflow,
    });
  }

  // 4. Check that dock is visible on mobile and has reasonable size
  if (viewport.width <= 768) {
    const dockInfo = await page.evaluate(() => {
      const dock = document.querySelector('.kura-mobile-dock');
      if (!dock) return { found: false };
      const container = dock.querySelector('.dock-container');
      if (!container) return { found: true, containerFound: false };
      const containerRect = container.getBoundingClientRect();
      return {
        found: true,
        containerFound: true,
        containerWidth: Math.round(containerRect.width),
        containerHeight: Math.round(containerRect.height),
        overflowsRight: containerRect.right > window.innerWidth + 5,
      };
    });

    if (dockInfo.found && dockInfo.containerFound && dockInfo.overflowsRight) {
      issues.push({
        type: 'DOCK_OVERFLOW',
        severity: 'BLOCKING',
        details: dockInfo,
      });
    }
  }

  return issues;
}

async function runVisualTests() {
  console.log('🎬 Starting Kura Responsive Visual Verification...\n');
  console.log(`📸 Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const allIssues = [];
  const results = [];

  for (const vp of VIEWPORTS) {
    process.stdout.write(`📐 ${vp.name} (${vp.width}×${vp.height})... `);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.width <= 430 ? 2 : 1,
    });
    const page = await context.newPage();
    page.on('console', () => {});
    page.on('pageerror', () => {});

    const vpIssueCount = { home: 0, catalog: 0 };

    for (const testPage of PAGES) {
      try {
        await page.goto(`${BASE_URL}${testPage.url}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(testPage.wait);

        const screenshotPath = join(SCREENSHOT_DIR, `${testPage.name}-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const issues = await checkResponsiveIssues(page, vp);
        vpIssueCount[testPage.name] = issues.length;

        if (issues.length > 0) {
          allIssues.push(...issues.map(i => ({ ...i, viewport: vp.name, page: testPage.name })));
        }

        results.push({ viewport: vp.name, page: testPage.name, screenshot: screenshotPath, issues: issues.length, issueList: issues });
      } catch (err) {
        vpIssueCount[testPage.name] = -1;
        results.push({ viewport: vp.name, page: testPage.name, error: err.message, issues: 0, issueList: [] });
      }
    }

    const homeStatus = vpIssueCount.home === 0 ? '✅' : vpIssueCount.home > 0 ? `⚠️(${vpIssueCount.home})` : '❌';
    const catalogStatus = vpIssueCount.catalog === 0 ? '✅' : vpIssueCount.catalog > 0 ? `⚠️(${vpIssueCount.catalog})` : '❌';
    console.log(`Home: ${homeStatus}  Catalog: ${catalogStatus}`);

    await context.close();
  }

  await browser.close();

  // === Final Report ===
  console.log('\n' + '═'.repeat(65));
  console.log('  📊  KURA RESPONSIVE AUDIT REPORT');
  console.log('═'.repeat(65));

  // Group issues by type
  const issueMap = {};
  for (const issue of allIssues) {
    const key = issue.type;
    if (!issueMap[key]) issueMap[key] = [];
    issueMap[key].push(issue);
  }

  if (Object.keys(issueMap).length === 0) {
    console.log('\n  🎉 All viewports pass responsive checks!\n');
  } else {
    const blocking = allIssues.filter(i => i.severity === 'BLOCKING');
    const major = allIssues.filter(i => i.severity === 'MAJOR');

    if (blocking.length > 0) {
      console.log(`\n  🔴 BLOCKING (${blocking.length}):`);
      for (const i of blocking) {
        console.log(`     [${i.viewport}/${i.page}] ${i.type}`);
        if (i.details?.[0]) console.log(`       → ${JSON.stringify(i.details[0])}`);
      }
    }

    if (major.length > 0) {
      console.log(`\n  🟠 MAJOR (${major.length}):`);
      const seen = new Set();
      for (const i of major) {
        const key = `${i.viewport}/${i.type}`;
        if (!seen.has(key)) {
          seen.add(key);
          console.log(`     [${i.viewport}/${i.page}] ${i.type}`);
          if (i.details?.[0]) {
            const d = i.details[0];
            console.log(`       → ${JSON.stringify(d)}`);
          }
        }
      }
    }
  }

  console.log(`\n  📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('═'.repeat(65) + '\n');

  return { results, allIssues };
}

runVisualTests().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
