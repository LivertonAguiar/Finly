#!/bin/bash

# ==========================================
# PlannerFin - Script de Deploy na VPS
# ==========================================

echo "🚀 Iniciando Deploy do PlannerFin na VPS..."

# Atualizar pacotes
sudo apt update -y && sudo apt upgrade -y

# Instalar Node.js 20 se não tiver
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Instalar Git e PM2 se não tiver
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# Instalar dependências e compilar
echo "📥 Instalando dependências do projeto..."
npm install

echo "🔨 Compilando o Frontend React (Vite)..."
npm run build

# Iniciar servidor com PM2
echo "⚡ Iniciando aplicação no PM2..."
pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "=========================================="
echo "✅ PlannerFin está online com sucesso!"
echo "🌐 Acesse: http://SEU_IP_VPS:3000"
echo "=========================================="
