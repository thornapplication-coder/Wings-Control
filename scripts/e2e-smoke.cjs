const { chromium } = require('playwright');
const path = require('path');
const F = 'file://' + path.resolve(__dirname, '../dist-single/index.html');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; }
  await p.goto(F + '#/'); await p.waitForTimeout(300); ok(p.url().includes('/access'), 'unauthenticated → access screen');
  await p.click('button[type=submit]'); await p.waitForTimeout(150); ok(p.url().includes('/access'), 'no name → stays on access (required field)');
  await p.selectOption('select', { label: 'Joost Jansen' }); await p.fill('input[type=password]', 'x'); await p.click('button[type=submit]');
  await p.waitForURL(/#\/$/); ok(true, 'sign-in → dashboard');
  await p.goto(F + '#/admin'); await p.waitForTimeout(200); ok(p.url().includes('admin-login'), 'admin route without admin session → admin login');
  ok(await p.locator('nav >> text=Administration').count() === 0, 'no admin nav for team session');
  await p.goto(F + '#/'); await p.waitForTimeout(200);
  const before = await p.locator('a:has-text("Overdue tasks") span.text-2xl').innerText();
  await p.click('button[role=radio]:has-text("A320")'); await p.waitForTimeout(150);
  const after = await p.locator('a:has-text("Overdue tasks") span.text-2xl').innerText();
  ok(before !== after, `fleet filter changes KPI (${before} → ${after})`);
  // action item → task, duplicate prevention
  await p.goto(F + '#/meetings/mt-1'); await p.waitForTimeout(200);
  const btns = await p.locator('button:has-text("Create task")').count();
  await p.locator('button:has-text("Create task")').first().click(); await p.waitForTimeout(200);
  ok(await p.locator('button:has-text("Create task")').count() === btns - 1, 'action item converted, button replaced by task link');
  // new task
  await p.goto(F + '#/tasks?new=1'); await p.waitForTimeout(200);
  await p.fill('[role=dialog] input >> nth=0', 'Playwright test task'); await p.click('[role=dialog] button:has-text("Save")'); await p.waitForTimeout(200);
  await p.goto(F + '#/tasks?view=all'); ok(await p.locator('text=Playwright test task').count() > 0, 'task created & listed');
  // minutes autosave
  await p.goto(F + '#/meetings/mt-2'); await p.fill('textarea', 'Autosave check'); await p.waitForTimeout(1900);
  ok((await p.locator('[role=status]').first().innerText()).startsWith('Saved'), 'minutes autosave');
  // admin flow
  await p.goto(F + '#/admin-login'); await p.fill('input[type=password]', 'admin'); await p.click('button[type=submit]'); await p.waitForTimeout(200);
  await p.goto(F + '#/admin/access'); await p.waitForTimeout(200);
  const pw = p.locator('input[autocomplete=new-password]'); await pw.nth(0).fill('short'); await pw.nth(1).fill('short');
  await p.click('button:has-text("Change password")'); await p.waitForTimeout(100);
  ok(await p.locator('text=Confirm with administrator password').count() === 0 && await p.locator('text=Minimum length is 12').count() === 1, 'password policy enforced');
  await pw.nth(0).fill('a-long-test-passphrase'); await pw.nth(1).fill('a-long-test-passphrase');
  await p.click('button:has-text("Change password")'); await p.click('button:has-text("Confirm change")'); await p.waitForTimeout(200);
  ok(await p.locator('text=revoked').count() >= 3, 'password change revokes sessions');
  console.log('errors:', errs);
  await b.close();
  if (errs.length) process.exit(1);
})();
