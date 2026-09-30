import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const browserCandidates = [
  process.env.FINLY_BROWSER_EXECUTABLE,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = browserCandidates.find(candidate => existsSync(candidate));
assert.ok(executablePath, 'Defina FINLY_BROWSER_EXECUTABLE com o caminho do Chrome/Chromium.');

const port = 4174;
const baseUrl = `http://127.0.0.1:${port}`;
const viteEntry = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [
  viteEntry, '--host', '127.0.0.1', '--port', String(port), '--strictPort',
], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });

let viteOutput = '';
vite.stdout.on('data', chunk => { viteOutput += chunk.toString(); });
vite.stderr.on('data', chunk => { viteOutput += chunk.toString(); });

const waitForServer = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // O Vite ainda esta iniciando.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Vite nao iniciou a tempo. Saida: ${viteOutput}`);
};

let browser;
try {
  await waitForServer();
  browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.innerText.includes('Conta Demonstra'));
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')]
      .find(element => element.textContent?.includes('Conta Demonstra'));
    if (!(button instanceof HTMLButtonElement)) throw new Error('Botao de demonstracao ausente.');
    button.click();
  });
  await page.waitForFunction(() => location.pathname === '/dashboard');
  await page.goto(`${baseUrl}/transacoes`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.innerText.includes('Saldo atual'));

  const viewports = [
    { width: 320, height: 568, expectedColumns: 1 },
    { width: 390, height: 844, expectedColumns: 2 },
    { width: 768, height: 1024, expectedColumns: 2 },
    { width: 1366, height: 768, expectedColumns: 4 },
  ];

  for (const viewport of viewports) {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    await new Promise(resolve => setTimeout(resolve, 150));
    const result = await page.evaluate(() => {
      const byText = text => [...document.querySelectorAll('button')]
        .find(element => element.textContent?.includes(text));
      const kpis = ['Saldo atual', 'Despesas', 'Receitas', 'Total / Balan'].map(byText);
      const regime = [...document.querySelectorAll('[aria-label]')]
        .find(element => element.getAttribute('aria-label')?.startsWith('Crit'));
      const regimeButtons = regime ? [...regime.querySelectorAll('button')] : [];
      return {
        bodyFits: document.body.scrollWidth <= window.innerWidth + 1
          && document.documentElement.scrollWidth <= window.innerWidth + 1,
        kpiRects: kpis.map(element => element?.getBoundingClientRect().toJSON()),
        regimeScrollable: Boolean(regime && regime.scrollWidth >= regime.clientWidth),
        regimeButtonHeights: regimeButtons.map(element => element.getBoundingClientRect().height),
      };
    });

    assert.equal(result.bodyFits, true, `overflow horizontal global em ${viewport.width}px`);
    assert.equal(result.kpiRects.filter(Boolean).length, 4, `KPIs ausentes em ${viewport.width}px`);
    const distinctColumns = new Set(result.kpiRects.map(rect => Math.round(rect.x))).size;
    assert.equal(distinctColumns, viewport.expectedColumns, `grade de KPIs incorreta em ${viewport.width}px`);
    assert.equal(result.regimeScrollable, true, `seletor de criterio inacessivel em ${viewport.width}px`);
    assert.ok(result.regimeButtonHeights.every(height => height >= 43), `alvo de toque menor que 44px em ${viewport.width}px`);
  }

  console.log('OK: responsividade validada em 320, 390, 768 e 1366 px sem overflow global.');
} finally {
  await browser?.close();
  vite.kill();
}
