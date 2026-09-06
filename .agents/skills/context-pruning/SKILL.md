---
name: context-pruning
description: "Economia de Tokens (Context Pruning). Ativar sempre que o agente iniciar qualquer tarefa. Regras para minimizar consumo de tokens: evitar re-leitura de arquivos inteiros, limitar snapshots, comprimir saída de comandos, e priorizar edições cirúrgicas sobre reescrita completa."
---

# Context Pruning — Economia de Tokens

## Objetivo

Reduzir drasticamente o consumo de tokens por tarefa sem sacrificar qualidade. Cada token desperdiçado é latência e custo; cada token útil é progresso.

## Regras Obrigatórias

### 1. Leitura Cirúrgica de Arquivos

- **NUNCA** leia um arquivo inteiro se você já sabe a região que precisa editar.
- Use `StartLine` / `EndLine` no `view_file` para ler somente o trecho relevante (máx 40–60 linhas por vez).
- Se precisa localizar algo, use `grep_search` primeiro, depois leia somente as linhas ao redor do resultado.
- **Proibido**: ler o mesmo arquivo mais de 2× por tarefa sem justificativa.

### 2. Edições Mínimas

- Prefira `replace_file_content` com `TargetContent` o mais curto possível (2–5 linhas).
- Para múltiplas edições não-contíguas, use `multi_replace_file_content` em **uma** chamada.
- **Proibido**: reescrever um arquivo inteiro com `write_to_file(Overwrite=true)` quando `replace_file_content` resolve.

### 3. Comandos com Saída Controlada

- Ao rodar comandos com saída potencialmente longa, limite a saída:
  - `git log -n 5` em vez de `git log`
  - `git diff --stat` antes de `git diff` completo
  - `head -20` / `tail -20` para logs
- Sempre use `WaitMsBeforeAsync` mínimo necessário (não 30000 se 5000 basta).

### 4. Browser / Screenshots

- Não tire screenshot a cada clique — tire somente para validar estado final.
- Use `snapshot -i` (somente elementos interativos) em vez de snapshot completo.
- Encadeie comandos do `agent-browser` em uma única chamada `cmd.exe /c "..."`.

### 5. Reutilização de Contexto

- Se já leu um arquivo nesta conversa, **não releia** — use o conteúdo que já está no contexto.
- Armazene achados importantes em variáveis mentais (ex: "a interface Transaction tem categoryId, não category").
- Ao retomar de compaction, leia o resumo e confie nele antes de re-investigar.

### 6. Respostas ao Usuário

- Seja conciso. Não repita o conteúdo de artefatos no chat.
- Não explique o que código faz linha por linha — explique a decisão e o resultado.
- Use bullet points, não parágrafos.

## Métricas de Sucesso

| Indicador | Alvo |
|---|---|
| Chamadas `view_file` por tarefa simples | ≤ 3 |
| Chamadas `view_file` por tarefa complexa | ≤ 8 |
| Linhas lidas por `view_file` | ≤ 60 |
| Re-leituras do mesmo arquivo | ≤ 1 |
| `write_to_file(Overwrite=true)` em arquivo existente | 0 (usar replace) |

## Anti-Padrões a Evitar

1. ❌ Ler 800 linhas de um arquivo para encontrar 1 string → use `grep_search`
2. ❌ Ler imports + interface + componente inteiro antes de uma edição de 3 linhas
3. ❌ Rodar `tsc --noEmit` 3× seguidas sem mudar nada entre elas
4. ❌ Tirar 5 screenshots durante um fluxo de teste → tire 1 no estado final
5. ❌ Reescrever um componente de 500 linhas para mudar 10 linhas
