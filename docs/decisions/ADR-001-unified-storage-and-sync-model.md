# ADR-001: Modelo de Persistência e Sincronização Híbrida

## Status
Accepted

## Date
2026-08-31

## Contexto
O Finly precisa garantir:
1. **Velocidade Extrema (Zero-Latency)**: O usuário não pode esperar requisições de rede para alternar abas, filtrar meses ou cadastrar transações.
2. **Resiliência Offline (PWA)**: O app deve funcionar mesmo com instabilidades de internet.
3. **Persistência Centralizada Multi-Device**: Os dados precisam ser preservados em servidor para acesso simultâneo em computador e smartphone.

## Decisão
Adotamos uma **Arquitetura Híbrida (LocalStorage Cache-First + Background REST Sync)**:
* Cada mutação no `FinancialContext` atualiza imediatamente o estado React e grava no `localStorage`.
* Em segundo plano com debounce, dispara requisição `POST /api/sync/:userId` que salva em arquivo JSON atômico no servidor.
* Na inicialização da aplicação, o cliente faz `GET /api/sync/:userId` para mesclar os dados mais recentes do servidor.

## Consequências
* Experiência de uso instantânea para o usuário final.
* Facilidade de backup: cada usuário possui um arquivo `server/data/stores/{userId}.json` independente e legível.
