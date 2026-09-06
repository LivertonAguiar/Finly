---
name: pre-action-guard
description: "Pre-Action Guard & Loop Detector. Ativar sempre que o agente iniciar qualquer tarefa. Previne loops infinitos, ações redundantes, e execuções desnecessárias. O agente deve parar e reportar ao invés de tentar indefinidamente."
---

# Pre-Action Guard & Loop Detector

## Objetivo

Impedir que o agente entre em loops, repita ações falhas, ou execute passos desnecessários. O agente deve ser decisivo: tentar, avaliar, parar.

## Regras Obrigatórias

### 1. Regra dos 2 Tentativas

- Se uma ação falha **2 vezes** com o mesmo erro, **PARE**.
- Reporte o erro ao usuário com diagnóstico e peça orientação.
- **Proibido**: tentar a mesma coisa 3+ vezes com variações mínimas.

Exemplos:
- ❌ `agent-browser click @e7` falha → retry → falha → retry → retry...
- ✅ `agent-browser click @e7` falha → retry com abordagem diferente → se falha, reporte.

### 2. Detecção de Loop

Antes de cada ação, verifique mentalmente:

> "Eu já fiz algo muito parecido com isso nesta conversa?"

Se sim:
- **Confirme** que o contexto mudou (ex: edição foi feita entre as tentativas).
- Se nada mudou, **PARE** e reporte.

Indicadores de loop:
- Rodar `tsc --noEmit` mais de 2× sem fazer edição entre elas
- Ler o mesmo arquivo 3+ vezes na mesma tarefa
- Tirar screenshot do mesmo estado 2+ vezes
- Tentar clicar no mesmo elemento que já falhou

### 3. Pre-Flight Check

Antes de executar qualquer ação custosa (build, deploy, browser test), faça o checklist mental:

```
□ O código foi editado desde a última verificação?
□ Essa ação vai me dar informação nova?
□ Posso resolver isso com uma ação mais barata?
□ Já tentei isso antes nesta conversa?
```

Se algum "Não" é crítico, **pule a ação**.

### 4. Economia de Ferramentas

| Em vez de... | Faça... |
|---|---|
| `view_file` inteiro + `grep_search` | Só `grep_search` primeiro |
| `tsc --noEmit` + `npm run build` | Só `npm run build` (já inclui tsc) |
| 5 `manage_task(status)` em sequência | 1 `schedule` com timer + `TimerCondition` |
| `browser_subagent` para 1 clique | `agent-browser` direto no terminal |
| `view_file` para conferir edição | Confie no diff retornado pelo replace |

### 5. Parada Antecipada

O agente DEVE parar e reportar quando:
- Está gastando mais de 3 chamadas de ferramenta para resolver um sub-problema trivial
- O mesmo erro aparece pela 2ª vez
- Uma ferramenta externa (browser, deploy) falha por problema de infra (não de código)
- O usuário claramente quer algo diferente do que está sendo feito

### 6. Priorização de Tarefas

Quando o usuário envia múltiplos pedidos:
1. Agrupe tarefas relacionadas
2. Resolva na ordem de complexidade (simples primeiro)
3. Faça todas as edições antes de rodar build/check
4. Rode build/check uma única vez no final

## Padrões de Auto-Diagnóstico

### Sinal: "Estou lendo o mesmo arquivo de novo"
→ Ação: Use o conteúdo já no contexto

### Sinal: "Estou rodando o mesmo comando de novo"
→ Ação: Verifique se algo mudou; se não, pare

### Sinal: "Estou tentando 3 abordagens diferentes para o mesmo clique"
→ Ação: Reporte ao usuário que a ferramenta não está cooperando

### Sinal: "O build passou mas estou rodando de novo"
→ Ação: Confie no resultado anterior e siga em frente

## Limites Hard-Coded

| Ação | Limite por Tarefa |
|---|---|
| Tentativas do mesmo comando falho | 2 |
| `view_file` no mesmo arquivo | 3 |
| `tsc --noEmit` ou `npm run build` | 2 |
| Screenshots/snapshots do mesmo estado | 1 |
| Timers/polls de status em sequência | 2 |
| `manage_task(status)` para mesma task | 3 |
