---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADRs and glossary in CONTEXT.md) as decisions crystallize.
---

# Grill With Docs

Conduct a relentless interview about a plan, architecture, or design while capturing domain terms in `CONTEXT.md` and key architectural decisions in `docs/adr/`.

This combines the **grilling** interview methodology with active **domain-modeling**.

## 1. The Interview Workflow

Map the problem space as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```markdown
❓ **Q1** - **<question title>**: <question body, multiple choices if applicable>

➡️ **Recomendação**: <your recommended answer and rationale>

---

❓ **Q2** - **<question title>**: <question body, multiple choices if applicable>

➡️ **Recomendação**: <your recommended answer and rationale>
```

- **Recompute frontier each round**: Settled decisions unblock dependent questions. Questions depending on open questions belong to later rounds.
- **Fact-finding vs. Decisions**: Finding facts in the codebase or environment is your job (read files, search codebase). Never ask the user what you can look up yourself. The *decisions* belong to the user.

## 2. Active Domain Modeling & Documentation

### Update `CONTEXT.md` Inline
- When a new domain term, entity, or concept is clarified or resolved during the interview, update `CONTEXT.md` immediately in the project root (or context root).
- `CONTEXT.md` is strictly a glossary of ubiquitous domain language: keep it concise, unambiguous, and free of implementation details.
- Challenge vague or overloaded words immediately (e.g., "Do you mean User, Customer, or Account?").

### Offer ADRs Sparingly
Only create an Architectural Decision Record in `docs/adr/` when **all three** conditions are met:
1. **Hard to reverse**: High cost to undo later.
2. **Surprising without context**: A future contributor would question why it was done this way.
3. **Result of a real trade-off**: Genuine alternatives were evaluated with distinct pros/cons.

If any condition is missing, keep the decision in conversation context.

## 3. Session Completion
The interview is complete when the frontier is empty: every branch is resolved and no assumptions remain unspoken. Confirm shared understanding before proceeding to implementation or specification.
