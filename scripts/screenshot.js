/**
 * screenshot.js — Playwright full-page website screenshotter
 *
 * Usage (single site):
 *   node scripts/screenshot.js --url https://example.com --out screenshots/example.png
 *
 * Dependencies:
 *   npm install playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import { parseArgs } from 'node:util';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const { values } = parseArgs({
  options: {
    url: { type: 'string' },
    out: { type: 'string' },
    width: { type: 'string', default: '1280' },
    timeout: { type: 'string', default: '15000' },
  },
});

if (!values.url || !values.out) {
  console.error('Usage: node scripts/screenshot.js --url <url> --out <path.png>');
  process.exit(1);
}

async function screenshot(url, outPath, width, timeout) {
  // Ensure output directory exists
  mkdirSync(dirname(outPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: parseInt(width), height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Block heavy third-party widgets that can crash the browser
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const blocked = [
      'tiktok.com', 'klaviyo.com', 'hotjar.com',
      'livechat', 'crisp.chat', 'intercom.io',
      'zdassets.com', 'tidio.co',
    ];
    if (blocked.some(domain => url.includes(domain))) {
      return route.abort();
    }
    return route.continue();
  });

  try {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: parseInt(timeout),
      });
    } catch (e) {
      // If networkidle times out, try domcontentloaded as fallback
      console.warn(`  networkidle timeout, falling back to domcontentloaded...`);
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: parseInt(timeout),
        });
      } catch (e2) {
        console.warn(`  domcontentloaded also failed, capturing whatever rendered...`);
      }
      await page.waitForTimeout(2000);
    }

    // Scroll in stages to trigger lazy-loaded and dynamically rendered content
    // Many modern sites only load sections as you scroll to them
    try {
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const steps = 5;
      for (let i = 1; i <= steps; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), (pageHeight / steps) * i);
        await page.waitForTimeout(1500);
      }
      // Scroll back to top and let everything settle
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(2000);
    } catch (scrollErr) {
      console.warn(`  scroll failed (page may have crashed), capturing current state...`);
    }

    await page.screenshot({
      path: outPath,
      fullPage: true,
    });
  } catch (captureErr) {
    // Last resort — try a viewport-only screenshot (not full page)
    console.warn(`  full-page screenshot failed, trying viewport capture...`);
    try {
      await page.screenshot({ path: outPath, fullPage: false });
    } catch (finalErr) {
      console.error(`  could not capture any screenshot: ${finalErr.message}`);
      await browser.close();
      throw finalErr;
    }
  }

  await browser.close();
  return outPath;
}

// Run
screenshot(values.url, values.out, values.width, values.timeout)
  .then(path => console.log(`Screenshot saved: ${path}`))
  .catch(err => {
    console.error('Screenshot failed:', err.message);
    process.exit(1);
  });
