# Finly - Regra Mandatória: Fluxo de Commit, Atualização de APK e Deploy na VPS

Sempre que o usuário solicitar:
- "Realizar Commit, Deploy e Apk Atualizar"
- "Fazer deploy / release"
- Ou ao atingir o ciclo de entrega de novas funcionalidades

O agente Antigravity **DEVE** seguir estritamente a ordem cronológica abaixo, sem pular nenhuma etapa:

---

## Ordem Obrigatória de Execução

### 1. Sincronização & Incremento de Versão
Toda release com APK e deploy **exige** incremento da versão semântica (ex: `1.1.60 -> 1.1.61`):
1. `package.json`: atualizar `"version": "X.X.X"`.
2. `package-lock.json`: atualizar `"version": "X.X.X"` na raiz e no bloco de pacotes.
3. `src/data/releases.ts`:
   - Adicionar o novo registro no topo de `RELEASES` com `version: CURRENT_VERSION` e `highlights`.
   - O registro imediatamente anterior deve ter sua versão convertida para string literal fixa (ex: `'1.1.60'`).
4. `README.md`: atualizar título `# 🚀 Finly \`vX.X.X\`` e badge `version-X.X.X-purple`.
5. `CHANGELOG.md`: adicionar o bloco `## [X.X.X] - AAAA-MM-DD` com as mudanças.
6. `src/data/helpCenterData.ts`: registrar guias ou FAQs alinhados com as mudanças (Regra 1).

### 2. Validação Local & Sincronização de Assets
Executar os comandos de validação na ordem:
1. `npm run check:version` (valida se as 6 fontes de versão estão idênticas).
2. `npm run test:all-debts` (ou suíte completa de testes aplicáveis).
3. `npx tsc --noEmit` (checagem de tipos TypeScript sem emitir erros).
4. `npm run build` (compilação do bundle web de produção).
5. `npm run cap:sync` (sincronização dos assets compilados para o projeto Android do Capacitor).

### 3. Git Commit Semântico & Push
1. `git add .`
2. `git commit -m "feat/fix: <descrição clara> vX.X.X"`
3. `git push origin main`

### 4. Compilação do APK Android no GitHub Actions
1. O push no branch `main` dispara automaticamente o workflow `.github/workflows/build-apk.yml`.
2. O agente **NÃO deve tentar compilar o APK de produção localmente** caso o ambiente não tenha o SDK Android/Java configurado; a compilação oficial é responsabilidade exclusiva do GitHub Actions.
3. O agente deve **monitorar a conclusão** da ação no GitHub (via API `/check-runs` ou timer com checagem de tag `git ls-remote --tags origin vX.X.X`).
4. O deploy na VPS só pode prosseguir após o job do GitHub Actions finalizar com `conclusion: success` e o arquivo `finly-vX.X.X.apk` estar publicado nas Releases do GitHub.

### 5. Deploy Automatizado no Servidor VPS (Oracle Cloud)
1. Executar o script de implantação em produção:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1
   ```
2. O script empacota os arquivos, envia via SCP para a VPS (`147.15.74.236`), reconstrói o container Docker com `docker compose up -d --build` e valida a integridade da versão.
3. Testar via SSH ou HTTP os endpoints da VPS:
   - `http://127.0.0.1:3000/api/app/version`
   - `http://127.0.0.1:3000/app-version.json`
4. Confirmar que a API e o frontend refletem a nova versão `X.X.X`.

---

## Princípio Anti-Falhas
- Nunca execute `deploy-vps.ps1` antes de o GitHub Actions terminar a compilação do APK, pois o script bloqueia caso o link do APK retorne 404.
- Nunca faça push com a mesma versão caso uma release anterior já tenha criado a tag `vX.X.X` no GitHub.
- Sempre preserve e documente em Português (`pt-BR`).
