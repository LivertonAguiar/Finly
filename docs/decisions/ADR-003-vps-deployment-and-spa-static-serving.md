# ADR-003: Servidor Unificado Node.js SPA + API para Deploy em VPS

## Status
Accepted

## Date
2026-08-31

## Contexto
Em servidores VPS, rodar processos separados para servidor web (porta 3000) e API backend (porta 3001) adiciona complexidade desnecessária de portas, proxies e consumo de memória.

## Decisão
Configuramos `server/apiServer.js` como **Servidor Unificado de Produção**:
* Rotas que iniciam com `/api/*` são tratadas pelos controllers da API REST.
* Todas as demais requisições servem os assets estáticos gerados pelo Vite em `dist/` com fallback SPA para `index.html`.
* Disponibilizamos arquivos de suporte completos (`Dockerfile`, `docker-compose.yml`, `ecosystem.config.cjs`, `deploy.sh`).

## Consequências
* Uma única porta aberta (`3000` ou `PORT`) resolve toda a entrega da aplicação.
* Facilita a configuração de Nginx com SSL e simplifica o deploy em 1 comando.
