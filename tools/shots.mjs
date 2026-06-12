// Visual-diff helper: screenshot the prototype (target) and our running app so
// the agent can compare and iterate toward pixel-perfect. Not committed output.
//
// Usage: node tools/shots.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'apps/docs/design/_shots');
mkdirSync(out, { recursive: true });

const PROTO_BACKOFFICE = `file://${resolve(root, 'apps/docs/design/back-office/MaintFlow - Standalone.html')}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// 1) Prototype back-office (target): login screen, then sign in and capture screens
try {
  await page.goto(PROTO_BACKOFFICE, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000); // Babel transform + React render
  await page.screenshot({ path: `${out}/proto-login.png` });
  console.log('✓ proto-login.png');

  // Sign in (form is prefilled) then snapshot the dashboard + a few sections.
  await page.getByText('Se connecter', { exact: false }).first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/proto-dashboard.png` });
  console.log('✓ proto-dashboard.png');

  const protoNav = [
    'Machines', 'Pannes', 'Interventions', 'Planification',
    'Techniciens', 'Historique', 'Utilisateurs', 'Paramètres',
  ];
  for (const label of protoNav) {
    try {
      await page.getByText(label, { exact: true }).first().click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/proto-${label.toLowerCase()}.png` });
      console.log(`✓ proto-${label.toLowerCase()}.png`);
    } catch (e) {
      console.log(`✗ proto ${label}:`, e.message);
    }
  }
} catch (e) {
  console.log('✗ prototype:', e.message);
}

// 2) Our app: login -> dashboard
try {
  page.on('console', (m) => m.type() === 'error' && console.log('  [browser]', m.text()));
  page.on('requestfailed', (r) => console.log('  [reqfail]', r.url(), r.failure()?.errorText));
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/app-login.png` });
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${out}/app-dashboard.png`, fullPage: true });
  console.log('  url after login:', page.url());

  for (const route of ['machines', 'faults', 'interventions']) {
    try {
      await page.goto(`http://localhost:3000/${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/app-${route}.png`, fullPage: true });
      console.log(`✓ app-${route}.png`);
    } catch (e) {
      console.log(`✗ app ${route}:`, e.message);
    }
  }
} catch (e) {
  console.log('✗ app:', e.message);
}

await browser.close();
console.log('shots in', out);
