import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('./screenshots/android');

// Ensure folder exists and is clean
if (fs.existsSync(SCREENSHOT_DIR)) {
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => {
    try {
      fs.unlinkSync(path.join(SCREENSHOT_DIR, f));
    } catch (e) {}
  });
} else {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('🚀 Iniciando emulador Android (Google Pixel 7 / Android 14)...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();

  // Emulate Google Pixel 7 (412 x 915, DPR 2.625, Touch)
  await page.setViewport({
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  });

  await page.setUserAgent(
    'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.240205.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36'
  );

  // Pre-seed localStorage to prevent release notes modal from ever appearing
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('finly_seen_web_version', '1.1.27');
    localStorage.setItem('finly_seen_android_version', '1.1.27');
  });

  console.log('🌐 Conectando em http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });

  // Log in as Demo if needed
  const demoBtn = await page.$('button::-p-text(Entrar na Conta Demonstração)');
  if (demoBtn) {
    console.log('🔑 Autenticando com Conta Demonstração...');
    await demoBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1200));
  }

  // Dismiss any update modal if rendered
  async function dismissAnyModal() {
    const dismissBtn = await page.$('button::-p-text(Continuar para o Finly)');
    if (dismissBtn) {
      console.log('🧹 Fechando modal de notas de versão...');
      await dismissBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }
  }
  await dismissAnyModal();

  // Check if values are hidden with dots and toggle eye if needed
  const hasDots = await page.evaluate(() => document.body.innerText.includes('••••••'));
  if (hasDots) {
    console.log('👁️ Revelando valores reais para capturas limpas...');
    const eyeBtn = await page.$('button:has(svg.lucide-eye-off)');
    if (eyeBtn) {
      await eyeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  async function snap(filename, desc) {
    await dismissAnyModal();
    console.log(`📸 Capturando [${desc}] -> ${filename}...`);
    await new Promise(r => setTimeout(r, 900));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: false,
    });
  }

  // 1. Dashboard Principal
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  await snap('01_dashboard.png', 'Dashboard Principal');

  // 2. Menu de Ações Rápidas (Speed Dial Central)
  const fabBtn = await page.$('button[title="Ações Rápidas"]');
  if (fabBtn) {
    await fabBtn.click();
    await snap('02_menu_acoes_rapidas.png', 'Menu Rápido (Speed Dial)');

    // 3. Modal de Nova Despesa
    const novaDespesaBtn = await page.$('button[title="Nova Despesa"]');
    if (novaDespesaBtn) {
      await novaDespesaBtn.click();
      await snap('03_modal_nova_despesa.png', 'Modal de Nova Despesa');
      const closeBtn = await page.$('button[title="Fechar"], button[aria-label="Close"], button:has(svg.lucide-x)');
      if (closeBtn) {
        await closeBtn.click();
        await new Promise(r => setTimeout(r, 500));
      }
    } else {
      await fabBtn.click();
    }
  }

  // 4. Extrato de Transações
  await page.goto('http://localhost:3000/transacoes', { waitUntil: 'networkidle0' });
  await snap('04_extrato_transacoes.png', 'Extrato de Transações');

  // 5. Contas Bancárias
  await page.goto('http://localhost:3000/contas', { waitUntil: 'networkidle0' });
  await snap('05_contas_bancarias.png', 'Contas Bancárias');

  // 6. Cartões de Crédito
  await page.goto('http://localhost:3000/cartoes', { waitUntil: 'networkidle0' });
  await snap('06_cartoes_credito.png', 'Cartões de Crédito');

  // 7. Planejamento / Orçamentos
  await page.goto('http://localhost:3000/planejamento', { waitUntil: 'networkidle0' });
  await snap('07_planejamento_orcamento.png', 'Planejamento e Orçamentos');

  // 8. Relatórios e Gráficos BI
  await page.goto('http://localhost:3000/relatorios', { waitUntil: 'networkidle0' });
  await snap('08_relatorios_bi.png', 'Relatórios e BI');

  // 9. Calendário Financeiro
  await page.goto('http://localhost:3000/calendario', { waitUntil: 'networkidle0' });
  await snap('09_calendario_financeiro.png', 'Calendário Financeiro');

  // 10. Central de Ajuda Interativa
  await page.goto('http://localhost:3000/ajuda', { waitUntil: 'networkidle0' });
  await snap('10_central_ajuda.png', 'Central de Ajuda Interativa');

  // 11. Hub Mais Opções
  await page.goto('http://localhost:3000/mais', { waitUntil: 'networkidle0' });
  await snap('11_hub_mais_opcoes.png', 'Hub Mais Opções');

  // 12. Configurações
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle0' });
  await snap('12_configuracoes.png', 'Configurações');

  await browser.close();
  console.log(`\n🎉 Todas as capturas foram concluídas com sucesso em:\n${SCREENSHOT_DIR}`);
}

run().catch(err => {
  console.error('❌ Erro durante as capturas:', err);
  process.exit(1);
});
