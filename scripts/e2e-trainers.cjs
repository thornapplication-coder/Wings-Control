// Browser test: trainer roster – add trainer, hide/show columns, add/delete own column.
const path = require('path');
const { chromium } = require('playwright');
const F = 'file://' + path.resolve(__dirname, '../dist-single/index.html');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  await p.goto(F + '#/access'); await p.selectOption('select', { label: 'Patrick Thorn' }); await p.fill('input[type=password]', 'x'); await p.click('button[type=submit]');
  await p.waitForTimeout(300); await p.goto(F + '#/instructors'); await p.waitForTimeout(300);
  const heads = async () => (await p.locator('thead th').allInnerTexts()).map(s => s.trim()).filter(Boolean);
  ok((await heads()).length === 8, `default shows 8 columns: ${(await heads()).join(', ')}`);
  // add trainer – validation first
  await p.click('button:has-text("Add trainer")'); await p.click('[role=dialog] button:has-text("Add trainer")');
  ok(await p.locator('[role=alert]').count() === 1, 'validation errors shown for empty form');
  const dlg = p.locator('[role=dialog]');
  await dlg.locator('input').nth(0).fill('Testa Trainerin'); await dlg.locator('input').nth(1).fill('ttx');
  await dlg.locator('button:has-text("TRI")').first().click(); await dlg.locator('button:has-text("B737")').click(); await dlg.locator('button[aria-pressed]:has-text("SZG")').click();
  await dlg.locator('button:has-text("Add trainer")').click(); await p.waitForTimeout(200);
  await p.fill('input[aria-label="Search trainers"]', 'Testa'); await p.waitForTimeout(150);
  ok(await p.locator('tbody tr').count() === 1 && (await p.locator('tbody tr').innerText()).includes('TTX'), 'new trainer listed with TLC uppercased');
  // duplicate TLC rejected
  await p.fill('input[aria-label="Search trainers"]', '');
  await p.click('button:has-text("Add trainer")');
  await dlg.locator('input').nth(0).fill('Dup'); await dlg.locator('input').nth(1).fill('TTX');
  await dlg.locator('button:has-text("A320")').click(); await dlg.locator('button[aria-pressed]:has-text("VIE")').first().click();
  await dlg.locator('button:has-text("Add trainer")').click();
  ok(await p.locator('text=TLC TTX is already used').count() === 1, 'duplicate TLC rejected');
  await p.keyboard.press('Escape');
  // columns: hide ORE, show SIM, add own column, delete it
  await p.click('button:has-text("Columns")');
  await p.locator('label:has-text("ORE")').click(); await p.locator('label:has-text("SIM Sessions")').click();
  await p.fill('input[aria-label="New column name"]', 'Phone extension'); await p.click('[role=dialog] button:has-text("Add")');
  await p.click('button:has-text("Done")'); await p.waitForTimeout(150);
  let h = await heads();
  ok(!h.includes('ORE') && h.includes('SIM SESSIONS') && h.includes('PHONE EXTENSION'), `columns updated: ${h.join(', ')}`);
  await p.click('button:has-text("Columns")'); await p.click('button[aria-label="Delete column Phone extension"]'); await p.click('button:has-text("Delete column")');
  await p.click('button:has-text("Done")'); await p.waitForTimeout(150);
  ok(!(await heads()).includes('PHONE EXTENSION'), 'own column deleted');
  // analytics tab + chart filter switches back to roster
  await p.click('[role=tab]:has-text("Analytics")'); await p.waitForTimeout(150);
  await p.locator('button[aria-label^="Austria"]').click(); await p.waitForTimeout(150);
  ok(await p.locator('text=Authority: Austria').count() === 1 && await p.locator('thead').count() === 1, 'chart click filters roster');
  console.log('errors:', errs); if (errs.length) process.exitCode = 1;
  await b.close();
})();
