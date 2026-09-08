# Relatório de Auditoria de Segurança: Finly (Local & Produção)

**Data da Auditoria:** 08 de Setembro de 2026  
**Alvos Analisados:**
- **Ambiente Local:** Código-fonte frontend (`React 18 + TypeScript`), backend (`Node.js + Express`), dependências (`npm audit`) e storage.
- **Ambiente de Produção:** `https://finly.lpaguiar.com.br` (infraestrutura Cloudflare + Oracle Cloud VPS).

---

## Sumário Executivo

Foi realizada uma análise abrangente de segurança defensiva baseada no padrão **OWASP Top 10** e nas melhores práticas para aplicações web fullstack (React + Express). A auditoria identificou vulnerabilidades que demandam atenção imediata, com destaque para a **ausência de autenticação e controle de acesso (BOLA/IDOR)** no endpoint de sincronização em nuvem (`/api/user/store`), que permite a leitura e sobrescrita de dados financeiros de qualquer usuário sem necessidade de senha ou token.

Além disso, foram constatadas ausências de **Rate Limiting** em rotas críticas (login e redefinição de senha por e-mail), **CORS com wildcard aberto**, cabeçalhos de segurança HTTP desativados e vulnerabilidades em dependências de terceiros (`xlsx`).

Abaixo está o detalhamento técnico priorizado por criticidade, com referências diretas de código e orientações de correção.

---

## Tabela Resumo dos Achados

| ID | Vulnerabilidade | Severidade | Componente | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | BOLA / IDOR e Leitura/Escrita Desprotegida de Dados Financeiros | **CRÍTICA** | Backend API | Confirmada em Produção |
| **SEC-02** | Ausência de Token Criptográfico de Sessão (JWT/Auth Token) | **CRÍTICA** | Backend API & Sync | Presente no Código |
| **SEC-03** | Falta de Rate Limiting na Recuperação de Senha (Risco de Força Bruta) | **ALTA** | Backend API | Presente no Código |
| **SEC-04** | Credenciais Administrativas Padrão com Senha Fraca no Banco Inicial | **ALTA** | Backend Setup | Presente no Código |
| **SEC-05** | Vulnerabilidades Conhecidas na Biblioteca `xlsx` (Prototype Pollution & ReDoS) | **ALTA** | Dependências | npm audit |
| **SEC-06** | CORS Irrestrito (`Access-Control-Allow-Origin: *`) | **ALTA** | Backend Middleware | Confirmada em Produção |
| **SEC-07** | Ausência de Cabeçalhos de Segurança HTTP (CSP, HSTS, X-Frame-Options) | **MÉDIA** | Servidor Web / API | Confirmada em Produção |
| **SEC-08** | Exposição de Dados Pessoais (PII) Hardcoded no Bundle Frontend | **MÉDIA** | Frontend Bundle | Presente no Código |
| **SEC-09** | Armazenamento de Dados Financeiros em Texto Claro no LocalStorage | **MÉDIA** | Armazenamento Local | Presente no Código |
| **SEC-10** | Limite Excessivo de Payload JSON (20MB) sem Limitação de Requisição | **BAIXA** | Backend Middleware | Presente no Código |

---

## 1. Vulnerabilidades Críticas (Ação Imediata Necessária)

### [SEC-01] BOLA / IDOR: Acesso e Sobrescrita Não Autenticada ao Banco Financeiro
- **Arquivos:** [`server/apiServer.js:283-306`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/server/apiServer.js#L283-L306) e [`server/apiServer.js:309-339`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/server/apiServer.js#L309-L339)
- **Impacto:** *Qualquer pessoa na internet pode ler ou apagar/sobrescrever o banco financeiro de qualquer usuário conhecendo apenas seu `userId`.*
- **Descrição Técnica:**
  Os endpoints `GET /api/user/store` e `POST /api/user/store` aceitam o identificador do usuário via cabeçalho `x-user-id` ou parâmetro `userId` na query/body, sem validar se o solicitante possui uma sessão ativa ou token criptografado correspondente.
- **Evidência em Produção:**
  Uma requisição diagnóstica não autenticada enviada para:
  `GET https://finly.lpaguiar.com.br/api/user/store?userId=usr-default-liverton`
  Retornou **HTTP 200 OK** com o dump completo de contas bancárias, cartões, limites e transações do usuário.
- **Remediação Recomendada:**
  1. Implementar um middleware de autenticação (`requireAuth`) que valide um **JWT (JSON Web Token)** ou cookie seguro de sessão assinado com `APP_SECRET`.
  2. Extrair o `userId` exclusivamente do token validado (`req.user.id`), rejeitando qualquer parâmetro de query ou header não autenticado.

---

### [SEC-02] Ausência de Emissão e Validação de Tokens de Sessão (JWT)
- **Arquivos:** [`server/apiServer.js:171-214`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/server/apiServer.js#L171-L214) e [`src/utils/apiSync.ts:34-37`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/src/utils/apiSync.ts#L34-L37)
- **Impacto:** *O ecossistema cliente-servidor opera baseado em confiança cega de identificadores públicos, inviabilizando a revogação de acessos e auditoria de segurança.*
- **Descrição Técnica:**
  No login (`POST /api/auth/login`), a API valida a senha com timing-safe crypto, porém responde apenas com os dados do usuário, sem emitir um token de autorização (`bearer token` ou `HttpOnly cookie`). O serviço de sincronização `apiSync.ts` simplesmente anexa o `userId` puro em texto nas requisições.
- **Remediação Recomendada:**
  1. Utilizar biblioteca de assinatura de tokens (ex: `jsonwebtoken`) ou os mecanismos nativos do Node `crypto.createHmac`.
  2. Emitir no login um token com tempo de expiração (`exp`), ID do usuário e assinatura criptográfica.
  3. No frontend (`apiSync.ts`), enviar o cabeçalho `Authorization: Bearer <token>`.

---

## 2. Vulnerabilidades de Severidade Alta

### [SEC-03] Falta de Rate Limiting e Risco de Força Bruta no Código de Recuperação
- **Arquivos:** [`server/apiServer.js:342-424`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/server/apiServer.js#L342-L424)
- **Impacto:** *Possibilidade de sequestro de contas por força bruta no código de 6 dígitos e esgotamento da cota de envio SMTP.*
- **Descrição Técnica:**
  - O código de recuperação gerado possui 6 dígitos numéricos (900.000 combinações possíveis) e validade de 15 minutos.
  - A rota `POST /api/verify-code` e `POST /api/reset-password` não impõem limite de tentativas erradas por e-mail ou IP. Um script automatizado pode testar milhares de códigos por minuto dentro da janela de validade.
  - A rota `POST /api/send-recovery-code` não possui limitação de frequência, permitindo ataques de DoS por inundação de e-mails na conta Gmail cadastrada.
- **Remediação Recomendada:**
  1. Instalar e configurar `express-rate-limit`:
     - Limite de envio de e-mails: máx. 3 solicitações por e-mail/IP a cada 15 minutos.
     - Limite de verificação: máx. 5 tentativas com código incorreto antes de invalidar o código e bloquear por 30 minutos.
  2. Registrar o número de tentativas (`attempts: 0`) no mapa `verificationCodes`. Ao atingir 5 tentativas inválidas, deletar o registro imediatamente.

---

### [SEC-04] Credenciais Administrativas Padrão com Senha Fraca no Banco Inicial
- **Arquivo:** [`server/apiServer.js:115-134`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/server/apiServer.js#L115-L134)
- **Impacto:** *Se o arquivo de usuários for reiniciado ou implantado em novo servidor sem arquivo prévio, a conta administrativa é criada com a senha trivial `'123'`.*
- **Descrição Técnica:**
  ```javascript
  {
    id: 'usr-default-liverton',
    name: 'Liverton',
    email: 'liverton.aguiar@hotmail.com',
    password: hashPassword('123'),
    phone: '85985949115',
    role: 'admin',
  }
  ```
- **Remediação Recomendada:**
  1. Remover as contas fixas em código. Caso o banco esteja vazio, não criar credenciais pré-definidas ou gerar uma senha aleatória forte exibida apenas no log de inicialização do console.
  2. Forçar redefinição de senha no primeiro login caso uma conta padrão seja estritamente necessária.

---

### [SEC-05] Vulnerabilidades em Dependência: Biblioteca `xlsx`
- **Arquivo:** [`package.json:39`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/package.json#L39)
- **Impacto:** *Risco de Prototype Pollution e ReDoS na importação de extratos e planilhas de usuários.*
- **Descrição Técnica:**
  O `npm audit` reportou 2 vulnerabilidades de severidade Alta na dependência `xlsx` (`GHSA-4r6h-8v6p-xvw6` e `GHSA-5pgg-2g8v-p4x9`).
- **Remediação Recomendada:**
  1. Avaliar a migração do parser de Excel para alternativas ativamente mantidas e auditadas, como `exceljs` ou sanitizar rigorosamente os objetos importados antes do processamento.

---

### [SEC-06] Configuração de CORS com Wildcard (`*`)
- **Arquivo:** [`server/apiServer.js:33`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/server/apiServer.js#L33)
- **Impacto:** *Qualquer página web externa pode realizar requisições à API em nome do usuário.*
- **Descrição Técnica:**
  `app.use(cors())` sem parâmetros habilita `Access-Control-Allow-Origin: *` em todas as rotas da API.
- **Remediação Recomendada:**
  Restringir as origens permitidas no middleware:
  ```javascript
  const allowedOrigins = [
    'https://finly.lpaguiar.com.br',
    'http://localhost:3000',
    'capacitor://localhost',
    'http://localhost'
  ];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Origem não autorizada por política de CORS.'));
    },
    credentials: true,
  }));
  ```

---

## 3. Vulnerabilidades Médias e de Configuração

### [SEC-07] Ausência de Cabeçalhos de Segurança HTTP (OWASP)
- **Arquivo:** [`server/apiServer.js:29-37`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/server/apiServer.js#L29-L37)
- **Evidência em Produção:**
  No teste em `https://finly.lpaguiar.com.br`, os seguintes cabeçalhos estão ausentes:
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options` (proteção contra Clickjacking)
  - `X-Content-Type-Options: nosniff` (proteção contra MIME-confusion)
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Remediação Recomendada:**
  Integrar o middleware padrão da indústria `helmet`:
  ```bash
  npm install helmet
  ```
  ```javascript
  import helmet from 'helmet';
  app.use(helmet({
    contentSecurityPolicy: false, // ajustar conforme necessidade do Vite
    crossOriginEmbedderPolicy: false,
  }));
  ```

---

### [SEC-08] Dados Pessoais (PII) Hardcoded no Bundle Frontend
- **Arquivo:** [`src/context/AuthContext.tsx:18-25`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/src/context/AuthContext.tsx#L18-L25)
- **Impacto:** *Exposição pública de nome, e-mail pessoal e número de telefone no código JavaScript compilado (`dist/assets/index-*.js`).*
- **Descrição Técnica:**
  O objeto `DEFAULT_ADMIN_USER` contém os dados pessoais do administrador em texto claro no código estático distribuído para todos os visitantes do site.
- **Remediação Recomendada:**
  Remover os dados fixos do frontend e buscá-los exclusivamente da API após autenticação bem-sucedida.

---

### [SEC-09] Armazenamento de Dados Financeiros e Senhas no LocalStorage
- **Arquivos:** [`src/context/FinancialContext.tsx`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/src/context/FinancialContext.tsx) e [`src/context/AuthContext.tsx`](file:///c:/Users/Suporte/Documents/Finly/planner-financeiro/src/context/AuthContext.tsx)
- **Impacto:** *O armazenamento de informações financeiras no `localStorage` não possui criptografia em repouso e fica exposto a qualquer script rodando no domínio ou extensões de navegador.*
- **Remediação Recomendada:**
  1. Manter a camada de PIN/biometria e criptografar o payload no `localStorage` utilizando uma chave derivada da senha/PIN do usuário.

---

## Plano de Remediação Priorizado

1. **Fase 1 (Urgente - Segurança de Dados):**
   - Implementar autenticação baseada em token JWT para `/api/user/store`.
   - Bloquear requisições não autenticadas no backend em produção.
   - Restringir as origens do CORS para apenas domínios autorizados.
2. **Fase 2 (Proteção de Acesso):**
   - Adicionar `express-rate-limit` nas rotas `/api/auth/login`, `/api/send-recovery-code` e `/api/verify-code`.
   - Adicionar limite de 5 tentativas erradas no código de recuperação.
   - Adicionar `helmet` para cabeçalhos de proteção HTTP.
3. **Fase 3 (Limpeza e Hardening):**
   - Remover dados pessoais hardcoded no frontend (`DEFAULT_ADMIN_USER`).
   - Atualizar dependências e tratar vulnerabilidades do `xlsx`.
