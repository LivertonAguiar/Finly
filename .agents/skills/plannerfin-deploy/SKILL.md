---
name: plannerfin-deploy
description: >-
  Runbook for compiling, verifying, and deploying the PlannerFin web app and backend mail service.
---

# PlannerFin Deploy & Verification Skill

Use this skill to execute clean builds, check TypeScript typings, and run production daemons.

## Standard Runbook:
1. Build check: `npm run build` (Vite + TypeScript).
2. Preview / Serve: `npm run preview -- --port 3000 --host`.
3. Mail backend: `node server/mailService.js` (Port 3001).
