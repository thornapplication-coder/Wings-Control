const { chromium, devices } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist-single/index.html');
const OUT = process.argv[2];
const routes = ['/', '/projects', '/projects/p-eis', '/tasks', '/tasks?open=t-1', '/instructors', '/meetings/mt-1', '/risks', '/reports', '/reports/weekly/p-eis', '/training', '/compliance', '/more'];
const vps = [
  { name: 'desktop', opts: { viewport: { width: 1440, height: 900 } } },
  { name: 'ipad', opts: { ...devices['iPad Pro 11'], deviceScaleFactor: 1 } },
  { name: 'iphone', opts: { ...devices['iPhone 14'], deviceScaleFactor: 1 } },
];
(async () => {
  const browser = await chromium.launch();
  for (const vp of vps) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(FILE + '#/access');
    await page.selectOption('select', { label: 'Patrick Thorn' });
    await page.fill('input[type=password]', 'x');
    await page.click('button[type=submit]');
    await page.waitForTimeout(300);
    for (const r of routes) {
      await page.goto(FILE + '#' + r);
      await page.waitForTimeout(250);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const name = `${vp.name}_${r.replace(/[\/?=&]/g, '_') || 'home'}.png`;
      await page.screenshot({ path: `${OUT}/${name}`, fullPage: r === '/' });
      if (ov > 0) console.log(`OVERFLOW ${vp.name} ${r}: ${ov}px`);
    }
    // admin
    await page.goto(FILE + '#/admin-login');
    await page.fill('input[type=password]', 'x');
    await page.click('button[type=submit]');
    await page.waitForTimeout(200);
    for (const r of ['/admin', '/admin/access', '/admin/records']) {
      await page.goto(FILE + '#' + r); await page.waitForTimeout(200);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 0) console.log(`OVERFLOW ${vp.name} ${r}: ${ov}px`);
      await page.screenshot({ path: `${OUT}/${vp.name}_${r.replace(/\//g, '_')}.png` });
    }
    if (errors.length) console.log(vp.name, 'ERRORS', [...new Set(errors)].slice(0, 5));
    await ctx.close();
  }
  await browser.close();
  console.log('done');
})();
