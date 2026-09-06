---
name: headroom
description: "Context compression for AI agents — 60–95% fewer tokens by compressing tool outputs, logs, files, and conversation history before they reach the model. MCP tools headroom_compress/retrieve/stats plus an optional traffic-compressing proxy. Wraps the open-source headroom-ai; on Windows install via WSL2."
version: 1.0.0
author: Rinu (l3ad3r1) in collaboration with Claude (Anthropic)
license: Apache-2.0
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Context Compression, Token Reduction, MCP, Proxy, LLM, CCR, Cost Optimization, WSL2]
    related_skills: []
prerequisites:
  commands: [python, uv]
  python: ["headroom-ai[mcp]"]
---

# Headroom

**Context compression for AI agents** — reduce the tokens sent to an LLM by
60–95% while preserving meaning, by compressing tool outputs, logs, search
results, RAG chunks, files, and conversation history before they reach the model.
It auto-detects content type (JSON / code / text) and supports CCR
(Compress-Cache-Retrieve): originals are cached locally and fetched on demand.

Upstream: [headroom](https://github.com/chopratejas/headroom) by chopratejas
(Apache-2.0); published on PyPI as `headroom-ai`.

## When to Use

- A tool/command returns a large dump (verbose logs, big JSON, long file
  listings, search results, large files) that would bloat the context window.
- The user asks to compress context, shrink a payload, or save tokens.
- Compress **before** the large content is committed to context.

## Setup

```bash
pip install "headroom-ai[mcp]"      # or [all] for every compressor / extra
```

Register the MCP server (exposes `headroom_compress` / `headroom_retrieve` /
`headroom_stats`):

```bash
headroom mcp install        # auto-configures detected coding agents
# or run the server directly: headroom mcp serve
```

For full **automatic** compression of all traffic, run the proxy and point the
client at it. This routes every API request through a local proxy, so enable it
deliberately:

```bash
headroom proxy --port 8787
ANTHROPIC_BASE_URL=http://127.0.0.1:8787 claude
```

## Tools (MCP, shown as `mcp__headroom__*`)

- `headroom_compress` — compress a blob of context/content
- `headroom_retrieve` — fetch the original uncompressed content (CCR)
- `headroom_stats` — compression statistics / token savings

Use `headroom_compress` on a large output, keep the compressed summary in
context, and call `headroom_retrieve` only when the full original is actually
needed.

CLI extras: `headroom perf` (savings), `headroom output-savings`,
`headroom learn --verbosity`, `headroom update`. Env toggles:
`HEADROOM_OUTPUT_SHAPER=1`, `HEADROOM_UPDATE_CHECK=off`, `HF_HUB_OFFLINE=1`.

## Installation notes & known issues

**Windows source build fails — install inside WSL2 instead.**
`headroom-ai` includes a **Rust extension** (`crates/headroom-py`, built via
maturin/cargo). On Windows there is no prebuilt wheel for recent Python, so
pip/uv fall back to compiling from source — which fails when a GNU `link` (from
Git / coreutils) shadows the MSVC `link.exe` linker (`link: extra operand` →
`could not compile target-lexicon` → `maturin failed`). Rather than untangle the
Windows Rust toolchain, install on the Linux side where wheels build cleanly:

```bash
# inside WSL2 Ubuntu (no sudo needed):
curl -LsSf https://astral.sh/uv/install.sh | sh      # if uv isn't present
uv tool install "headroom-ai[mcp]"                   # -> ~/.local/bin/headroom
```

Then register the MCP server from your Windows client by wrapping into WSL:

```bash
claude mcp add-json headroom \
  '{"command":"wsl.exe","args":["-d","Ubuntu","-e","bash","-lc","export PATH=$HOME/.local/bin:$PATH; exec headroom mcp serve"]}' \
  --scope user
```

On Linux/macOS, `pip install "headroom-ai[mcp]"` works directly — skip the WSL
wrapper and register `headroom mcp serve` straight.

## Credits

Upstream project: [headroom](https://github.com/chopratejas/headroom) by
**chopratejas** (Apache-2.0); distributed on PyPI as `headroom-ai`. This skill
documents and wires up the upstream tool for the Agent Skills format; the source
is **not vendored** — install it from PyPI / the upstream repo.

Skill by **Rinu ([l3ad3r1](https://github.com/l3ad3r1)) in collaboration with
Claude (Anthropic)**.
