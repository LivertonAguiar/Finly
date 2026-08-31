# 🚀 PlannerFin — Guia de Deploy em Produção (VPS)

Este guia cobre a instalação do PlannerFin em servidores **Linux (Ubuntu 22.04 / 24.04 LTS ou Debian 11/12)**.

---

## 1. Deploy Automático com PM2 (Recomendado)

### Passo 1: Conectar na VPS via SSH
```bash
ssh root@SEU_IP_VPS
```

### Passo 2: Clonar o Repositório e Executar o Deploy
```bash
git clone https://github.com/LivertonAguiar/planner-financeiro.git
cd planner-financeiro

chmod +x deploy.sh
./deploy.sh
```

O script `deploy.sh` realiza:
1. Instalação do Node.js 20 LTS e PM2.
2. Instalação das dependências (`npm install`).
3. Compilação otimizada do frontend (`npm run build`).
4. Inicialização do servidor em segundo plano com **PM2**.

---

## 2. Deploy com Docker e Docker Compose

Se o seu servidor tiver Docker instalado:
```bash
git clone https://github.com/LivertonAguiar/planner-financeiro.git
cd planner-financeiro

docker compose up -d --build
```

---

## 3. Configuração de Domínio e SSL HTTPS com Nginx

### Instalar Nginx e Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Criar Configuração do Nginx (`/etc/nginx/sites-available/plannerfin`):
```nginx
server {
    server_name app.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Ativar e Gerar Certificado SSL Gratuito:
```bash
sudo ln -s /etc/nginx/sites-available/plannerfin /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d app.seudominio.com
```
