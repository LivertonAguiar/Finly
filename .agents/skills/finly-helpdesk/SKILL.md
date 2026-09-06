---
name: finly-helpdesk
description: Finly Helpdesk & Knowledge Base Specialist. Author, maintain, and audit interactive visual tutorials, step-by-step guides, annotated screenshots/mockups, and customer support documentation for Finly (Web & Android). Use when users ask for help guides, troubleshooting, onboarding, visual tutorials with annotated screens, or customer support automation.
---

# 🎧 Finly Helpdesk & Knowledge Base Engine

This skill defines the standards, structure, and visual methodology for authoring and maintaining Finly's Help Center, interactive tutorials, step-by-step guides, and support materials across both **Web (Desktop/PWA)** and **Android Mobile Native**.

---

## 🎯 Core Principles

1. **Dual-Platform Fidelity (Web vs. Android):**
   - Every guide MUST document the exact user flow for both **Web** (Desktop header, sidebar, top buttons, keyboard shortcuts) and **Android App** (notch safe area, bottom navigation bar, Arc Speed-Dial FAB, physical back gestures).
   - If UI elements or behaviors differ, clearly annotate the difference with platform badges (`💻 Versão Web` / `📱 App Android`).

2. **Visual Step-by-Step with Annotated Callouts:**
   - Don't just provide blocks of text. Provide numbered callout pins (`①`, `②`, `③`), highlighted focal areas, spotlight containers, and contextual pointers.
   - Break complex actions into digestible steps (maximum 3-5 steps per task).

3. **Diátaxis Alignment:**
   - **How-To Guides:** Practical step-by-step problem-solving ("Como lançar uma despesa parcelada no cartão").
   - **Tutorials:** End-to-end learning journeys for newcomers ("Primeiros passos no Finly: configurando contas e orçamentos").
   - **Reference:** Technical and functional reference ("Significado dos status da fatura: Aberta, Fechada, Paga").
   - **Troubleshooting & FAQ:** Diagnoses and quick resolutions ("Por que meu extrato OFX não categorizou automaticamente?").

4. **Tone & Empathy:**
   - Friendly, clear, jargon-free Portuguese (pt-BR) with clear positive reinforcement.
   - Always provide a fallback action ("Ainda precisa de ajuda? Abra um ticket ou fale com nosso suporte").

---

## 📚 Standard Help Center Taxonomy

Every Finly Help Center module should be indexed under these primary domains:

| Domain | Key Topics |
| :--- | :--- |
| **🚀 Primeiros Passos** | Boas-vindas, navegação inicial, saldo consolidado, configuração de perfil. |
| **💸 Transações & Lançamentos** | Despesas, receitas, transferências entre contas, anexos de recibos, parcelamento. |
| **💳 Cartões de Crédito & Faturas** | Cadastro de cartões, limite e melhor dia, pagamento de fatura, extrato da fatura. |
| **🏦 Contas Bancárias & Saldos** | Contas correntes, carteiras de dinheiro, saldo inicial e conciliação. |
| **🎯 Orçamentos & Metas** | Limites mensais por categoria, alertas automáticos (80% e 100%), metas de reserva. |
| **📈 Investimentos & Patrimônio** | Renda fixa, ações, fundos, rendimentos e cálculo de patrimônio líquido. |
| **📥 Importação de Extratos** | Importação OFX, QIF e CSV, conciliação de duplicidades, regras automáticas. |
| **📱 App Android vs Web** | Instalação do APK, notificações nativas, modo tela cheia, atalhos rápidos. |
| **👨‍👩‍👧‍👦 Finly Família** | Compartilhamento familiar, permissões e contas conjuntas. |
| **⚙️ Configurações & Segurança** | Moedas, temas claro/escuro, backup de dados, PIN e biometria. |
| **❓ FAQ & Dúvidas Rápidas** | Perguntas frequentes e resolução imediata de dúvidas. |
| **🎧 Suporte & Helpdesk** | Abertura de chamado, logs de diagnóstico e contato com o desenvolvedor. |

---

## 🖼️ Annotated UI Callout Schema

When rendering visual guides in Finly's UI:
- **Hotspot Pin:** Numbered circle badge (`1`, `2`, `3`) with pulse effect positioned over the interactive component.
- **Spotlight Frame:** Glowing border (`border-purple-500/50` or `border-emerald-500/50`) surrounding the target element.
- **Pointer Arrow:** Contextual direction indicating where to click, tap, or swipe.
- **Action Description:** Single-sentence guidance explaining what happens upon clicking.

---

## 🚀 Step-by-Step Template Pattern

```markdown
### [Título da Tarefa]: Como [Ação Desejada]

**Resumo Rápido:** [1 frase clara explicando o objetivo].
**Tempo estimado:** [ex: 1 minuto].
**Disponível em:** [💻 Web] [📱 Android]

#### 🪜 Passo a Passo:
1. **[Nome do Passo 1]**:
   - 💻 **No computador (Web):** [Instrução com ponto de clique no topo/sidebar]
   - 📱 **No celular (Android):** [Instrução com toque no BottomNav/FAB]
   - 💡 *Dica:* [Dica de atalho ou recomendação prática]
2. **[Nome do Passo 2]**:
   - Preencha [campos obrigatórios]...
3. **[Nome do Passo 3]**:
   - Toque em **Salvar**...

#### ⚠️ Dúvida Comum / Atenção:
- [Explicação de um erro frequente e como evitar]
```
