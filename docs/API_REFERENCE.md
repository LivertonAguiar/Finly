# 🔌 Finly — Referência Completa da API REST

A API do Finly opera via protocolo **HTTP/REST** com payloads em formato JSON e suporte a CORS.

**Base URL Local**: `http://localhost:3001` (ou `http://localhost:3000` em modo unificado).

---

## 1. Autenticação e Usuários

### `POST /api/auth/login`
Realiza a autenticação de um usuário.
* **Body:**
  ```json
  {
    "email": "usuario@exemplo.com",
    "password": "sua-senha-aqui"
  }
  ```
* **Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-default-liverton",
      "name": "Liverton",
      "email": "usuario@exemplo.com",
      "role": "admin"
    }
  }
  ```

---

### `POST /api/auth/register`
Cadastra um novo usuário no sistema.
* **Body:**
  ```json
  {
    "name": "Nome do Usuário",
    "email": "novo@exemplo.com",
    "password": "senha",
    "phone": "85999999999"
  }
  ```

---

## 2. Sincronização de Dados Financeiros

### `GET /api/sync/:userId`
Recupera o estado completo dos dados financeiros de um usuário.
* **Resposta (`200 OK`):**
  ```json
  {
    "user": { ... },
    "transactions": [ ... ],
    "accounts": [ ... ],
    "cards": [ ... ],
    "categories": [ ... ],
    "budgets": [ ... ],
    "goals": [ ... ],
    "invoices": [ ... ],
    "familyMembers": [ ... ],
    "customizations": { ... }
  }
  ```

---

### `POST /api/sync/:userId`
Persiste e atualiza o estado financeiro do usuário em arquivo JSON com backup automático.
* **Body:** O payload completo retornado pelo `GET`.
* **Resposta (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Dados sincronizados com sucesso!",
    "timestamp": "2026-08-31T20:30:00.000Z"
  }
  ```

---

## 3. Verificação de E-mails (SMTP 2FA)

### `POST /api/send-verification-code`
Gera um código OTP de 6 dígitos e envia por e-mail via servidor SMTP Gmail.
* **Body:**
  ```json
  {
    "email": "usuario@exemplo.com"
  }
  ```

---

### `POST /api/verify-code`
Valida o código de verificação recebido pelo usuário.
* **Body:**
  ```json
  {
    "email": "usuario@exemplo.com",
    "code": "123456"
  }
  ```

---

## 4. Health Check

### `GET /api/health`
Verifica o status operacional da API.
* **Resposta (`200 OK`):**
  ```json
  {
    "status": "ok",
    "serverTime": "2026-08-31T20:30:00.000Z"
  }
  ```
