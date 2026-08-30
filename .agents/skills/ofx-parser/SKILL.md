---
name: ofx-parser
description: >-
  Extracts and transforms bank statements in OFX, QIF, and CSV formats into
  standardized PlannerFin JSON transaction models with automatic category classification.
---

# OFX & Statement Parser Skill

Use this skill when processing raw bank export files from Brazilian and international institutions (Nubank, Itaú, Bradesco, Inter, BB, Caixa, Santander, C6, etc.).

## Supported Transaction Attributes:
- `description`: Cleaned description without arbitrary POS codes.
- `amount`: Absolute numeric value (positive float).
- `type`: `'income'` (credit) or `'expense'` (debit).
- `date`: ISO 8601 `YYYY-MM-DD`.
- `categoryId`: Auto-inferred category ID based on description tokens.
