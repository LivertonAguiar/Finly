import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'C:/Users/Suporte/.gemini/antigravity-ide/brain/5e37bf97-26c3-4b74-b265-3bc534602e7f';

// Model 1: Sleek Dark Obsidian & Electric Amber (Mobile App)
const htmlModel1 = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #07080A;
      color: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      width: 412px;
      height: 892px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 24px 20px 20px 20px;
      position: relative;
    }
    
    /* Ambient glow */
    .ambient-glow {
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 320px;
      height: 250px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.22) 0%, rgba(124, 77, 255, 0.12) 50%, transparent 80%);
      filter: blur(50px);
      pointer-events: none;
    }

    /* Top Bar */
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      position: relative;
      z-index: 10;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 20px;
      background: linear-gradient(135deg, #FF6B00, #7C4DFF);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
    }
    .greeting {
      font-size: 13px;
      color: #94A3B8;
      font-weight: 500;
    }
    .username {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .badge-status {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
    }

    /* Hero Balance Card */
    .hero-card {
      background: linear-gradient(160deg, #16181F 0%, #101116 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 36px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
    }
    .hero-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 140px;
      height: 140px;
      background: radial-gradient(circle, rgba(255, 107, 0, 0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    .balance-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .balance-label {
      font-size: 13px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .trend-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }
    .balance-val {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 18px;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .balance-currency {
      font-size: 20px;
      font-weight: 700;
      color: #FF8A00;
    }
    
    /* Sparkline SVG */
    .sparkline-box {
      width: 100%;
      height: 52px;
      margin-bottom: 14px;
    }

    .kpi-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 14px;
    }
    .kpi-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .kpi-title {
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
    }
    .kpi-amount {
      font-size: 14px;
      font-weight: 700;
      color: #F1F5F9;
    }

    /* Quick Action Pills */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: #14151B;
      border: 1px solid rgba(255, 255, 255, 0.07);
      padding: 12px 6px;
      border-radius: 24px;
      transition: all 0.2s;
    }
    .action-icon {
      width: 42px;
      height: 42px;
      border-radius: 18px;
      background: rgba(255, 107, 0, 0.12);
      color: #FF8A00;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .action-btn:nth-child(2) .action-icon {
      background: rgba(124, 77, 255, 0.14);
      color: #A78BFA;
    }
    .action-btn:nth-child(3) .action-icon {
      background: rgba(16, 185, 129, 0.14);
      color: #34D399;
    }
    .action-btn:nth-child(4) .action-icon {
      background: rgba(56, 189, 248, 0.14);
      color: #38BDF8;
    }
    .action-name {
      font-size: 12px;
      font-weight: 600;
      color: #CBD5E1;
    }

    /* Transactions Section */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .section-link {
      font-size: 13px;
      color: #FF8A00;
      font-weight: 700;
      text-decoration: none;
    }

    .tx-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      overflow: hidden;
    }
    .tx-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #121319;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 14px 16px;
    }
    .tx-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .tx-icon-squircle {
      width: 44px;
      height: 44px;
      border-radius: 18px;
      background: #1A1C24;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .tx-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .tx-title {
      font-size: 14px;
      font-weight: 700;
      color: #F8FAFC;
    }
    .tx-sub {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
    }
    .tx-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }
    .tx-amount {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }
    .tx-amount.neg { color: #F8FAFC; }
    .tx-amount.pos { color: #34D399; }
    .tx-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      color: #94A3B8;
    }

    /* Floating Micro-Capsule Nav Dock */
    .dock-wrapper {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      z-index: 100;
      pointer-events: none;
    }
    .dock-pill {
      pointer-events: auto;
      background: rgba(20, 22, 29, 0.88);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 107, 0, 0.15);
    }
    .dock-tab {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 44px;
      border-radius: 999px;
      color: #64748B;
      font-size: 20px;
      transition: all 0.2s;
    }
    .dock-tab.active {
      background: linear-gradient(135deg, #FF6B00, #FF8A00);
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(255, 107, 0, 0.4);
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>

  <!-- Top Bar -->
  <div class="topbar">
    <div class="user-info">
      <div class="avatar">LA</div>
      <div>
        <div class="greeting">Boa tarde,</div>
        <div class="username">Liverton Aguiar</div>
      </div>
    </div>
    <div class="badge-status">
      <div class="badge-dot"></div>
      Sincronizado
    </div>
  </div>

  <!-- Hero Card -->
  <div class="hero-card">
    <div class="balance-label-row">
      <span class="balance-label">Patrimônio Líquido</span>
      <span class="trend-pill">↑ +14.8% m/m</span>
    </div>
    <div class="balance-val">
      <span class="balance-currency">R$</span>
      <span>68.450,25</span>
    </div>

    <!-- Liquid Area Sparkline -->
    <svg class="sparkline-box" viewBox="0 0 350 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="52" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF6B00" stop-opacity="0.45"/>
          <stop offset="1" stop-color="#FF6B00" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="M0,45 C40,42 70,30 110,32 C150,34 180,18 220,15 C260,12 300,28 350,4 L350,52 L0,52 Z" fill="url(#gradOrange)"/>
      <path d="M0,45 C40,42 70,30 110,32 C150,34 180,18 220,15 C260,12 300,28 350,4" stroke="#FF8A00" stroke-width="3" stroke-linecap="round"/>
      <circle cx="350" cy="4" r="4" fill="#FFFFFF" stroke="#FF6B00" stroke-width="2"/>
    </svg>

    <div class="kpi-row">
      <div class="kpi-item">
        <span class="kpi-title">Receitas (Set)</span>
        <span class="kpi-amount" style="color: #34D399;">+ R$ 14.280,00</span>
      </div>
      <div class="kpi-item">
        <span class="kpi-title">Despesas (Set)</span>
        <span class="kpi-amount" style="color: #F87171;">- R$ 5.840,30</span>
      </div>
      <div class="kpi-item">
        <span class="kpi-title">Taxa Poupança</span>
        <span class="kpi-amount" style="color: #FF8A00;">59.1%</span>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="actions-grid">
    <div class="action-btn">
      <div class="action-icon">＋</div>
      <span class="action-name">Receita</span>
    </div>
    <div class="action-btn">
      <div class="action-icon">－</div>
      <span class="action-name">Despesa</span>
    </div>
    <div class="action-btn">
      <div class="action-icon">⚡</div>
      <span class="action-name">Pix</span>
    </div>
    <div class="action-btn">
      <div class="action-icon">📊</div>
      <span class="action-name">Metas</span>
    </div>
  </div>

  <!-- Recent Transactions -->
  <div class="section-header">
    <span class="section-title">Últimas Atividades</span>
    <a href="#" class="section-link">Ver todas</a>
  </div>

  <div class="tx-list">
    <div class="tx-item">
      <div class="tx-left">
        <div class="tx-icon-squircle">💼</div>
        <div class="tx-info">
          <span class="tx-title">Consultoria FinTech Pro</span>
          <span class="tx-sub">Hoje, 11:30 • Nubank PJ</span>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount pos">+ R$ 6.500,00</span>
        <span class="tx-tag">Receita</span>
      </div>
    </div>

    <div class="tx-item">
      <div class="tx-left">
        <div class="tx-icon-squircle">🛒</div>
        <div class="tx-info">
          <span class="tx-title">Pão de Açúcar Gourmet</span>
          <span class="tx-sub">Ontem, 19:45 • Inter Black</span>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount neg">- R$ 428,90</span>
        <span class="tx-tag">Mercado</span>
      </div>
    </div>

    <div class="tx-item">
      <div class="tx-left">
        <div class="tx-icon-squircle">⚡</div>
        <div class="tx-info">
          <span class="tx-title">Enel Distribuição Energia</span>
          <span class="tx-sub">05 Set • Débito Automático</span>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount neg">- R$ 265,40</span>
        <span class="tx-tag">Moradia</span>
      </div>
    </div>
  </div>

  <!-- Floating Micro-Capsule Nav Dock -->
  <div class="dock-wrapper">
    <div class="dock-pill">
      <div class="dock-tab active">⊞</div>
      <div class="dock-tab">💳</div>
      <div class="dock-tab">📈</div>
      <div class="dock-tab">🎯</div>
      <div class="dock-tab">⚙</div>
    </div>
  </div>
</body>
</html>
`;

// Model 2: Sleek Neo-Glass Prism & Deep Slate (Mobile App)
const htmlModel2 = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #080B14;
      color: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      width: 412px;
      height: 892px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 24px 20px 20px 20px;
      position: relative;
    }
    
    /* Dynamic Mesh Gradient */
    .bg-mesh {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }
    .blob-1 {
      position: absolute;
      top: -80px;
      right: -60px;
      width: 280px;
      height: 280px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%);
      filter: blur(60px);
    }
    .blob-2 {
      position: absolute;
      top: 250px;
      left: -90px;
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.28) 0%, transparent 70%);
      filter: blur(60px);
    }

    .content-layer {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Top Bar */
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      background: linear-gradient(135deg, #06B6D4, #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 18px;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
    }
    .brand-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #FFFFFF, #CBD5E1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .glass-pill-btn {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 700;
      color: #E2E8F0;
    }

    /* Holographic Credit Card Widget */
    .card-preview {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 36px;
      padding: 24px;
      position: relative;
      margin-bottom: 22px;
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.3);
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .card-chip {
      width: 38px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #E2E8F0, #94A3B8);
      position: relative;
    }
    .card-brand {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.8);
    }
    .card-val-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94A3B8;
      margin-bottom: 4px;
    }
    .card-val {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.8px;
      margin-bottom: 18px;
      font-family: 'Space Grotesk', sans-serif;
    }
    .card-foot {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .card-holder {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1.5px;
      color: #CBD5E1;
      text-transform: uppercase;
    }
    .card-expiry {
      font-size: 12px;
      font-family: monospace;
      color: #94A3B8;
    }

    /* Bento 2-Col Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .bento-card {
      background: rgba(18, 24, 38, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 28px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 125px;
    }
    .bento-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bento-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 12px;
      background: rgba(6, 182, 212, 0.15);
      color: #06B6D4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .bento-badge {
      font-size: 11px;
      color: #34D399;
      font-weight: 700;
    }
    .bento-lbl {
      font-size: 12px;
      color: #94A3B8;
      font-weight: 600;
    }
    .bento-num {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }

    /* Glass Feed */
    .glass-feed {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }
    .feed-card {
      background: rgba(18, 24, 38, 0.6);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 22px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .feed-avatar {
      width: 42px;
      height: 42px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .feed-details {
      display: flex;
      flex-direction: column;
      margin-left: 12px;
      flex: 1;
    }
    .feed-name {
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .feed-date {
      font-size: 11px;
      color: #64748B;
    }
    .feed-val {
      font-size: 14px;
      font-weight: 800;
    }

    /* Floating Capsule Dock */
    .dock-pill {
      background: rgba(15, 21, 35, 0.85);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      width: 280px;
      margin: 0 auto;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(6, 182, 212, 0.2);
    }
    .dock-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #64748B;
    }
    .dock-icon.active {
      background: linear-gradient(135deg, #06B6D4, #8B5CF6);
      color: #FFFFFF;
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
    }
  </style>
</head>
<body>
  <div class="bg-mesh">
    <div class="blob-1"></div>
    <div class="blob-2"></div>
  </div>

  <div class="content-layer">
    <!-- Top Bar -->
    <div class="topbar">
      <div class="brand-logo">
        <div class="logo-icon">F</div>
        <div class="brand-name">Finly Neo</div>
      </div>
      <div class="glass-pill-btn">✨ Setembro 2026</div>
    </div>

    <!-- Holographic Card -->
    <div class="card-preview">
      <div class="card-top">
        <div class="card-chip"></div>
        <div class="card-brand">PLATINUM</div>
      </div>
      <div class="card-val-label">Saldo Disponível</div>
      <div class="card-val">R$ 52.840,90</div>
      <div class="card-foot">
        <div class="card-holder">LIVERTON AGUIAR</div>
        <div class="card-expiry">•• / 29</div>
      </div>
    </div>

    <!-- Bento Grid -->
    <div class="bento-grid">
      <div class="bento-card">
        <div class="bento-header">
          <div class="bento-icon-box">📈</div>
          <span class="bento-badge">+18.2%</span>
        </div>
        <div>
          <div class="bento-lbl">Rendimentos</div>
          <div class="bento-num">R$ 1.240,50</div>
        </div>
      </div>

      <div class="bento-card">
        <div class="bento-header">
          <div class="bento-icon-box" style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6;">🎯</div>
          <span class="bento-badge" style="color: #A78BFA;">82% meta</span>
        </div>
        <div>
          <div class="bento-lbl">Reserva Pro</div>
          <div class="bento-num">R$ 41.000,00</div>
        </div>
      </div>
    </div>

    <!-- Transactions Glass Feed -->
    <div class="glass-feed">
      <div class="feed-card">
        <div class="feed-avatar">🍎</div>
        <div class="feed-details">
          <span class="feed-name">Apple Developer Pro</span>
          <span class="feed-date">Hoje, 09:12 • Assinatura</span>
        </div>
        <span class="feed-val" style="color: #F87171;">- R$ 499,00</span>
      </div>

      <div class="feed-card">
        <div class="feed-avatar">⚡</div>
        <div class="feed-details">
          <span class="feed-name">Transferência Recebida Pix</span>
          <span class="feed-date">Ontem, 16:40 • Banco Inter</span>
        </div>
        <span class="feed-val" style="color: #34D399;">+ R$ 2.400,00</span>
      </div>
    </div>

    <!-- Floating Capsule Dock -->
    <div style="margin-top: 10px;">
      <div class="dock-pill">
        <div class="dock-icon active">⊞</div>
        <div class="dock-icon">💳</div>
        <div class="dock-icon">⚡</div>
        <div class="dock-icon">⚙</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Model 3: Sleek Pro Web Dashboard (Desktop 16:9)
const htmlModel3 = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #0B0C10;
      color: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      width: 1440px;
      height: 810px;
      overflow: hidden;
      display: flex;
    }
    
    /* Left Sleek Sidebar */
    .sidebar {
      width: 260px;
      background: #111319;
      border-right: 1px solid rgba(255, 255, 255, 0.07);
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 40px;
    }
    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 16px;
      background: linear-gradient(135deg, #FF6B00, #7C4DFF);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      box-shadow: 0 6px 20px rgba(255, 107, 0, 0.35);
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      font-weight: 600;
      color: #94A3B8;
      text-decoration: none;
      transition: all 0.2s;
    }
    .nav-item.active {
      background: rgba(255, 107, 0, 0.12);
      color: #FF8A00;
      border: 1px solid rgba(255, 107, 0, 0.25);
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #3B82F6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    /* Main Container */
    .main {
      flex: 1;
      padding: 32px 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      overflow: hidden;
    }
    
    /* Top Bar */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header-sub {
      font-size: 14px;
      color: #94A3B8;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .cta-btn {
      background: linear-gradient(135deg, #FF6B00, #FF8A00);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 14px;
      padding: 10px 22px;
      border-radius: 999px;
      border: none;
      box-shadow: 0 4px 16px rgba(255, 107, 0, 0.35);
    }

    /* Bento Grid */
    .bento-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      flex: 1;
    }
    .bento-left {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .bento-right {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Cards */
    .sleek-card {
      background: #14161E;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 32px;
      padding: 24px;
    }
    .metrics-banner {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      background: linear-gradient(160deg, #181B26, #12141C);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 32px;
      padding: 24px 30px;
    }
    .metric-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .metric-lbl {
      font-size: 12px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-val {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    /* Chart Box */
    .chart-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    /* Right Rail */
    .wallet-card {
      background: linear-gradient(135deg, #1E1B4B, #0F172A);
      border: 1px solid rgba(124, 77, 255, 0.3);
      border-radius: 28px;
      padding: 22px;
    }
    .activity-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .activity-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .act-name { font-size: 13px; font-weight: 700; }
    .act-date { font-size: 11px; color: #64748B; }
    .act-val { font-size: 13px; font-weight: 800; }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <div class="sidebar">
    <div>
      <div class="brand">
        <div class="brand-mark">F</div>
        <div class="brand-title">Finly</div>
      </div>
      <div class="nav-list">
        <a href="#" class="nav-item active">⊞ Visão Geral</a>
        <a href="#" class="nav-item">💳 Transações</a>
        <a href="#" class="nav-item">📊 Relatórios & Gráficos</a>
        <a href="#" class="nav-item">🎯 Metas Financeiras</a>
        <a href="#" class="nav-item">📑 Orçamentos</a>
        <a href="#" class="nav-item">⚙ Configurações</a>
      </div>
    </div>
    <div class="user-pill">
      <div class="user-avatar">LA</div>
      <div>
        <div style="font-size: 13px; font-weight: 700;">Liverton Aguiar</div>
        <div style="font-size: 11px; color: #94A3B8;">Plano Finly Pro</div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main">
    <div class="header-row">
      <div>
        <h1 class="header-title">Painel Financeiro Geral</h1>
        <p class="header-sub">Acompanhamento consolidado de liquidez e orçamento mensal</p>
      </div>
      <div class="header-actions">
        <button class="cta-btn">+ Nova Transação</button>
      </div>
    </div>

    <!-- Banner KPI -->
    <div class="metrics-banner">
      <div class="metric-col">
        <span class="metric-lbl">Patrimônio Total</span>
        <span class="metric-val" style="color: #FF8A00;">R$ 284.950,00</span>
      </div>
      <div class="metric-col">
        <span class="metric-lbl">Entradas Mês Atual</span>
        <span class="metric-val" style="color: #34D399;">+ R$ 22.840,00</span>
      </div>
      <div class="metric-col">
        <span class="metric-lbl">Saídas Mês Atual</span>
        <span class="metric-val" style="color: #F87171;">- R$ 8.920,40</span>
      </div>
    </div>

    <!-- Bento Grid -->
    <div class="bento-layout">
      <!-- Left Chart -->
      <div class="sleek-card chart-card">
        <div class="chart-header">
          <div>
            <div style="font-size: 16px; font-weight: 800;">Fluxo de Caixa & Evolução Patrimonial</div>
            <div style="font-size: 12px; color: #94A3B8;">Últimos 6 meses com projeção algorítmica</div>
          </div>
          <span style="font-size: 12px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 6px 14px; border-radius: 999px;">
            ▲ +24.6% Crescimento
          </span>
        </div>
        <svg viewBox="0 0 650 170" width="100%" height="170" fill="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="170" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FF6B00" stop-opacity="0.35"/>
              <stop offset="1" stop-color="#FF6B00" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="M0,130 C100,120 180,60 270,75 C360,90 450,30 550,25 C600,22 630,10 650,5 L650,170 L0,170 Z" fill="url(#areaGrad)"/>
          <path d="M0,130 C100,120 180,60 270,75 C360,90 450,30 550,25 C600,22 630,10 650,5" stroke="#FF8A00" stroke-width="4" stroke-linecap="round"/>
          <circle cx="550" cy="25" r="6" fill="#FFFFFF" stroke="#FF6B00" stroke-width="3"/>
          <circle cx="270" cy="75" r="5" fill="#FFFFFF" stroke="#FF6B00" stroke-width="2"/>
        </svg>
      </div>

      <!-- Right Column -->
      <div class="bento-right">
        <div class="wallet-card">
          <div style="font-size: 12px; font-weight: 700; color: #A78BFA; margin-bottom: 6px;">CARTÃO CORPORATIVO BLACK</div>
          <div style="font-size: 24px; font-weight: 800; font-family: monospace;">•••• 8492</div>
          <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 12px; color: #CBD5E1;">
            <span>Limite: R$ 35.000,00</span>
            <span style="color: #34D399;">Disponível: 82%</span>
          </div>
        </div>

        <div class="sleek-card activity-card">
          <div style="font-size: 15px; font-weight: 800;">Atividades Recentes</div>
          <div class="activity-item">
            <div>
              <div class="act-name">Recebimento Cliente XP</div>
              <div class="act-date">Hoje, 14:15</div>
            </div>
            <div class="act-val" style="color: #34D399;">+ R$ 9.200,00</div>
          </div>
          <div class="activity-item">
            <div>
              <div class="act-name">AWS Cloud Infrastructure</div>
              <div class="act-date">06 Set, 02:00</div>
            </div>
            <div class="act-val" style="color: #F87171;">- R$ 850,20</div>
          </div>
          <div class="activity-item">
            <div>
              <div class="act-name">Aporte CDB Liquidez Diária</div>
              <div class="act-date">04 Set, 10:20</div>
            </div>
            <div class="act-val" style="color: #38BDF8;">+ R$ 4.000,00</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function renderAll() {
  console.log('Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    // 1. Render Mobile Model 1
    console.log('Rendering Model 1 (Dark Obsidian Mobile)...');
    const page1 = await browser.newPage();
    await page1.setViewport({ width: 412, height: 892, deviceScaleFactor: 2 });
    await page1.setContent(htmlModel1, { waitUntil: 'networkidle0' });
    const path1 = `${OUTPUT_DIR}/sleek_model1_dark_obsidian_app.png`;
    await page1.screenshot({ path: path1 });
    await page1.close();
    console.log('Model 1 saved:', path1);

    // 2. Render Mobile Model 2
    console.log('Rendering Model 2 (Neo-Glass Mobile)...');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 412, height: 892, deviceScaleFactor: 2 });
    await page2.setContent(htmlModel2, { waitUntil: 'networkidle0' });
    const path2 = `${OUTPUT_DIR}/sleek_model2_neo_glass_app.png`;
    await page2.screenshot({ path: path2 });
    await page2.close();
    console.log('Model 2 saved:', path2);

    // 3. Render Desktop Model 3
    console.log('Rendering Model 3 (Sleek Pro Web Dashboard)...');
    const page3 = await browser.newPage();
    await page3.setViewport({ width: 1440, height: 810, deviceScaleFactor: 2 });
    await page3.setContent(htmlModel3, { waitUntil: 'networkidle0' });
    const path3 = `${OUTPUT_DIR}/sleek_model3_pro_web_dashboard.png`;
    await page3.screenshot({ path: path3 });
    await page3.close();
    console.log('Model 3 saved:', path3);

    console.log('ALL SLEEK MODELS RENDERED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

renderAll().catch(err => {
  console.error('Fatal Error rendering sleek models:', err);
  process.exit(1);
});
