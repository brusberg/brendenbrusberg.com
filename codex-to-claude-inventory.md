# Codex / ChatGPT → Claude Code: tool inventory & port plan

Scanned on 2026-11-24 from `~/.codex` (config.toml, auth.json, plugin cache, global state)
and `~/.claude*`.

## 1. What Codex actually has

### Local MCP servers in `~/.codex/config.toml`
| Server | Command | Notes |
|---|---|---|
| `node_repl` | `/Applications/ChatGPT.app/.../cua_node/bin/node_repl` | ChatGPT.app internal; drives browser + computer-use backends (`chrome,iab,mcpapps`) |
| `computer-use` | `Codex Computer Use.app/.../SkyComputerUseClient mcp` | **disabled**; desktop control |

Both are private binaries inside ChatGPT.app. Nothing portable, and Claude already has
equivalents (built-in browser, Claude in Chrome, computer-use).

### Enabled plugins (bundled / primary runtime)
`codex-app-tools`, `browser`, `unified-computer-use`, `computer-use`, `visualize`,
`documents`, `pdf`, `spreadsheets`, `presentations`, `template-creator`.

All OpenAI-shipped. Claude equivalents already available: `anthropic-skills:docx`,
`:pdf`, `:xlsx`, `:pptx`, `anthropic-skills:docs`, visualize, Artifacts.

### Remote plugins cached in `~/.codex/plugins/cache/openai-curated-remote`
`vercel` 0.54.1 · `supabase` 1.0.0 · `github` 0.1.13 · `google-calendar` 1.2.7 ·
`wolfram` (app-69fe0bf6…) · `plugin-management` · `visualize` · `superpowers` · `work-pets`
(a `linear` plugin also shows up in an older Codex project folder)

Of these, only Vercel is a plain HTTP MCP:
```json
{ "mcpServers": { "vercel": { "type": "http", "url": "https://mcp.vercel.com" } } }
```
The rest are **ChatGPT connectors/apps** (`connector_…` / `asdk_app_…` ids). Their auth lives
server-side in the OpenAI account — there is no token on this machine to copy.

### Tool surface seen in Codex state (counts)
- `vercel.*` — 237 tools (projects, deployments, domains, env vars, flags, firewall, sandboxes, CI, logs, observability)
- `github.*` — 92 (repos, PRs, issues, reviews, Actions, file writes)
- `sites.*` — 39 (ChatGPT Sites: create/deploy site versions, custom domains, env vars, DB tables, analytics, worker logs)
- `chatgpt_space.*` — 40 (pages, canvases, presentations, spreadsheets, comments, automations)
- `supabase.*` — 29 (execute_sql, migrations, edge functions, advisors, branches, logs)
- `google_calendar.*` — 15 · `pets.*` 11 · `plugin_management.*` 6 · `safety_settings.*` 5 · `hotline.*` 1

## 2. Keys and credentials found

- `~/.codex/auth.json`: `auth_mode = chatgpt`, OAuth `id/access/refresh` tokens for the ChatGPT
  account, `OPENAI_API_KEY = null`. **No third-party API keys anywhere in `~/.codex`.**
  These tokens only authenticate ChatGPT itself and are not transferable.
- Usable credentials already on this machine:
  - `gh` CLI 2.100.0, logged in as **brusberg**, scopes `gist, read:org, repo, workflow`
  - `git` 2.55.0, `node` v24.20.0, `pnpm` 10.34.5
  - `vercel` and `supabase` CLIs: **not installed**

## 3. Port status (as of 2026-11-24)

| Codex capability | Claude equivalent | Status |
|---|---|---|
| Vercel (237 tools) | Vercel connector | ✅ connected |
| Supabase (29) | Supabase connector | ✅ connected |
| GitHub (92) | `gh` CLI, already authed | ✅ working |
| Google Calendar | Calendar connector | ✅ connected |
| DigitalOcean | DO connector | ✅ connected (account empty) |
| Wolfram / Linear | connectors available | not connected |
| documents/pdf/xlsx/pptx/visualize | built-in skills + Artifacts | ✅ |
| browser / computer-use | built-in browser, Chrome ext, computer-use | ✅ |
| **ChatGPT Sites (`sites.*`)** | **no equivalent** | OpenAI-proprietary hosting |
| ChatGPT Spaces / Pets / Hotline | Artifacts + Claude Docs cover Spaces | — |

## 4. The website

`brusberg/brendenbrusberg.com` — Vite + TypeScript + pnpm, deployed by Vercel's Git
integration from `main`, DNS in AWS Route 53, canonical `www.brendenbrusberg.com`.
Vercel projects: `brendenbrusberg-com` (`prj_G8UOfkyYIWTMJqhRqDRbDrrZQzd5`) and
`brenden-game` (`prj_NXCw6hpcsEMIA6A4zJNiWa9nitVz`), team `team_TchN3O16e6cwBNwaYChMBtJc`.
The `/game` path rewrites to `game-app.brendenbrusberg.com`, also on Vercel (76.76.21.21).
