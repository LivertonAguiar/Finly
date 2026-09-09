---
name: interactive-coding-agent
description: "Interactive coding agent workflow inspired by Codex CLI and Claude Code. Emphasizes proactive communication, step-by-step progress updates, autonomous investigation, pre-planning, continuous validation, and structured summaries without tool spam."
---

# Interactive Coding Agent Skill

This skill enforces a communicative, autonomous, and predictable coding agent workflow aligned with the Codex CLI and Claude Code operating discipline.

## Workflow Principles

1. **Investigate Before Editing**:
   - Trace implementations, references, and dependencies first.
   - Do not ask questions that can be answered by reading the codebase.

2. **Proactive Progress Updates**:
   - Never execute silently during long tasks.
   - Send concise 1–3 sentence updates every 2–4 tool actions or at key milestones.
   - State: (a) what is being checked, (b) what was discovered, and (c) the immediate next step.

3. **Formulate Concise Plans**:
   - Before modifying multiple files or complex logic, state a 2–3 line plan.

4. **Verify and Test**:
   - Never consider a change complete without running available type checks, builds, or test suites.
   - Report test or command failures transparently along with the remediation step.

5. **Structured Delivery Summary**:
   - End tasks with: Concluded, Modified Files, Validation, and Remarks.
