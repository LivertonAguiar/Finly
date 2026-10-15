import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://127.0.0.1:5173';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function dismissAllPopups(page) {
  await page.evaluate(() => {
    // 1. Toast de notificação
    const toastClose = document.querySelector('button[title="Fechar"]');
    if (toastClose) toastClose.click();

    // 2. Modais de novidades ou release
    const buttons = Array.from(document.querySelectorAll('button'));
    const dismissBtn = buttons.find(
      (b) =>
        b.innerText?.includes('Continuar para o Finly') ||
        b.innerText?.includes('Entendi') ||
        b.getAttribute('aria-label') === 'Fechar'
    );
    if (dismissBtn) dismissBtn.click();
  });
  await sleep(400);
}

async function main() {
  console.log('🚀 Iniciando Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
    ],
  });

  try {
    const page = await browser.newPage();

    // 1. Acesso inicial e login como demo
    console.log('🔑 Acessando tela de autenticação...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await sleep(1000);

    await page.evaluate(() => {
      localStorage.setItem('finly_seen_web_version', '1.1.79');
      localStorage.setItem('finly_seen_android_version', '1.1.79');
      localStorage.setItem('finly_pin_enabled', 'false');
    });

    console.log('✨ Clicando no botão "Entrar na Conta Demonstração"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find((b) => b.innerText && b.innerText.includes('Demonstração'));
      if (demoBtn) demoBtn.click();
    });

    await sleep(2500);
    await dismissAllPopups(page);
    await sleep(600);

    // -------------------------------------------------------------
    // DESKTOP SCREENSHOTS (1440 x 900)
    // -------------------------------------------------------------
    console.log('\n🖥️  Capturando telas Web Desktop...');

    // 1. Web Dashboard
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('finly_navigate_tab', { detail: { tab: 'dashboard' } }));
    });
    await sleep(1500);
    await dismissAllPopups(page);
    const webDashPath = path.join(outputDir, 'web-dashboard.png');
    await page.screenshot({ path: webDashPath });
    console.log(`✅ Salvo: ${webDashPath}`);

    // 2. Web Transações
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('finly_navigate_tab', { detail: { tab: 'transacoes' } }));
    });
    await sleep(1500);
    await dismissAllPopups(page);
    const webTransPath = path.join(outputDir, 'web-transacoes.png');
    await page.screenshot({ path: webTransPath });
    console.log(`✅ Salvo: ${webTransPath}`);

    // 3. Web Cartões de Crédito
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('finly_navigate_tab', { detail: { tab: 'cartoes' } }));
    });
    await sleep(1500);
    await dismissAllPopups(page);
    const webCardsPath = path.join(outputDir, 'web-cartoes.png');
    await page.screenshot({ path: webCardsPath });
    console.log(`✅ Salvo: ${webCardsPath}`);

    // 4. Web Planejamento Orçamentário
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('finly_navigate_tab', { detail: { tab: 'planejamento' } }));
    });
    await sleep(1500);
    await dismissAllPopups(page);
    const webBudgetPath = path.join(outputDir, 'web-planejamento.png');
    await page.screenshot({ path: webBudgetPath });
    console.log(`✅ Salvo: ${webBudgetPath}`);

    // 5. Web Cadastros & Tags
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('finly_navigate_tab', { detail: { tab: 'cadastro' } }));
    });
    await sleep(1200);
    await dismissAllPopups(page);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tagsBtn = buttons.find((b) => b.innerText && b.innerText.includes('Tags'));
      if (tagsBtn) tagsBtn.click();
    });
    await sleep(1200);
    const webTagsPath = path.join(outputDir, 'web-cadastros-tags.png');
    await page.screenshot({ path: webTagsPath });
    console.log(`✅ Salvo: ${webTagsPath}`);

    // -------------------------------------------------------------
    // MOBILE SCREENSHOTS (390 x 844, scale 2)
    // -------------------------------------------------------------
    console.log('\n📱 Capturando telas Mobile...');
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    // 1. Mobile Dashboard
    console.log('📱 Navegando para Mobile Dashboard...');
    await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.evaluate(() => {
      const bottomButtons = Array.from(document.querySelectorAll('button'));
      const dashBtn = bottomButtons.find((b) => b.innerText?.trim().includes('Dashboard'));
      if (dashBtn) dashBtn.click();
      window.scrollTo(0, 0);
    });
    await sleep(1500);
    await dismissAllPopups(page);
    const mobDashPath = path.join(outputDir, 'mobile-dashboard.png');
    await page.screenshot({ path: mobDashPath });
    console.log(`✅ Salvo: ${mobDashPath}`);

    // 2. Mobile Transações
    console.log('📱 Navegando para Mobile Transações...');
    await page.evaluate(() => {
      const bottomButtons = Array.from(document.querySelectorAll('button'));
      const transBtn = bottomButtons.find((b) => b.innerText?.trim().includes('Transações'));
      if (transBtn) transBtn.click();
      window.scrollTo(0, 0);
    });
    await sleep(1500);
    await dismissAllPopups(page);
    const mobTransPath = path.join(outputDir, 'mobile-transacoes.png');
    await page.screenshot({ path: mobTransPath });
    console.log(`✅ Salvo: ${mobTransPath}`);

    // 3. Mobile Cartões
    console.log('📱 Navegando para Mobile Cartões...');
    await page.evaluate(() => {
      const bottomButtons = Array.from(document.querySelectorAll('button'));
      const cardBtn = bottomButtons.find((b) => b.innerText?.trim().includes('Cartões'));
      if (cardBtn) cardBtn.click();
      window.scrollTo(0, 0);
    });
    await sleep(1500);
    await dismissAllPopups(page);
    const mobCardsPath = path.join(outputDir, 'mobile-cartoes.png');
    await page.screenshot({ path: mobCardsPath });
    console.log(`✅ Salvo: ${mobCardsPath}`);

    // 4. Mobile Ações Rápidas (Floating Menu)
    console.log('⚡ Abrindo menu de ações rápidas no mobile...');
    await page.evaluate(() => {
      const fab =
        document.querySelector('button[aria-label*="Nova transação"]') ||
        document.querySelector('button[aria-label*="nova transação"]') ||
        document.querySelector('button[aria-label*="Nova"]') ||
        Array.from(document.querySelectorAll('button')).find(
          (b) => b.innerText?.trim() === '+' || b.innerText?.includes('Nova Transação')
        );
      if (fab) fab.click();
    });
    await sleep(1000);
    const mobActionsPath = path.join(outputDir, 'mobile-acoes-rapidas.png');
    await page.screenshot({ path: mobActionsPath });
    console.log(`✅ Salvo: ${mobActionsPath}`);

    // 5. Mobile Modal de Nova Transação com Tags Inteligentes
    console.log('📝 Abrindo modal de Nova Despesa e simulando sugestão de tags...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newExpenseBtn = buttons.find((b) => b.innerText && b.innerText.includes('Nova Despesa'));
      if (newExpenseBtn) newExpenseBtn.click();
    });
    await sleep(1500);

    // Preencher valor, descrição e abrir mais detalhes
    await page.evaluate(() => {
      // 1. Preencher descrição
      const inputs = Array.from(document.querySelectorAll('input'));
      const descInput = inputs.find((i) => i.placeholder?.includes('Ex:') || i.required);
      if (descInput) {
        descInput.focus();
        descInput.value = 'Supermercado Mensal Pão de Açúcar';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
        descInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Clicar em "Mais detalhes" para expandir a seção de Tags
      const buttons = Array.from(document.querySelectorAll('button'));
      const moreBtn = buttons.find((b) => b.innerText && b.innerText.includes('Mais detalhes'));
      if (moreBtn) moreBtn.click();
    });
    await sleep(1000);

    // Scrollar suavemente até a seção de tags
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const tagsLabel = labels.find((l) => l.innerText && l.innerText.includes('TAGS'));
      if (tagsLabel) {
        tagsLabel.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        const dialog = document.querySelector('[role="dialog"], form');
        if (dialog) dialog.scrollTop = 350;
      }
    });
    await sleep(800);

    const mobModalPath = path.join(outputDir, 'mobile-modal-transacao.png');
    await page.screenshot({ path: mobModalPath });
    console.log(`✅ Salvo: ${mobModalPath}`);

    console.log('\n✨ Todas as 10 screenshots reais foram geradas e salvas com perfeição!');
  } catch (err) {
    console.error('❌ Erro durante captura:', err);
  } finally {
    await browser.close();
  }
}

main();
