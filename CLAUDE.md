# Claude Code configuration — Kaynos Docs (static site)

## What this repo is

- Static documentation site deployed on Netlify: publish root is `.` (see `netlify.toml`). Primary artifact is `index.html` plus `feed.xml`, `sitemap.xml`, `robots.txt`.
- Regression checks: Playwright specs in `tests/` with `playwright.config.js` (default `baseURL` targets production `https://docs.kaynos.net`).
- Product and marketing code live in sibling repos: `kaynos`, `kaynos-site`. When content or URLs change, verify consistency across those sites.

## Behavioral rules

- Do what was asked; avoid scope creep.
- Read a file before editing it.
- Prefer minimal edits to large static files; avoid noisy reformatting of generated HTML unless required.
- Do not commit secrets; this repo should stay credentials-free.
- Keep temporary notes outside git or in an agreed scratch path, not the published root.

## Multi-agent and swarm (Claude Code + claude-flow)

Tests use Playwright via `npm test` (requires `npm install` first). The repo has a `package.json` with `@playwright/test`, `http-server`, and `wait-on` as devDependencies. **Claude Code Task subagents** still help parallelize distinct workstreams (e.g. sitemap vs HTML sections vs test updates).

- **Parallel Task usage:** In one assistant turn, spawn separate subagents for: (1) content / HTML structure, (2) `sitemap.xml` / `feed.xml` consistency, (3) Playwright coverage or accessibility checks, when those tasks are independent.
- **Batch todos:** Use a single TodoWrite when tracking multi-step doc updates.
- **No polling:** After spawning, wait for results before more tool calls in the same turn.
- **claude-flow CLI:** Use `npx @claude-flow/cli@latest` for swarm init, memory, hooks, or `doctor --fix` if you integrate claude-flow in this folder; do not use CLI as a substitute for Task-driven edits.

Example swarm init if you add `.claude-flow` here later:

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

### Subagent brief template (paste into every Task)

1. **Goal:** one sentence (for example update section X, fix sitemap URL, extend mobile nav test).
2. **Scope:** `index.html`, `feed.xml`, `sitemap.xml`, `tests/`, etc.
3. **Out of scope:** files owned by another parallel agent.
4. **Done means:** summary of edits plus verification (XML well-formed, Playwright subset, link crawl notes).
5. **Return:** bullets; no secrets.

### When to parallelize

- **HTML content blocks** vs **XML feeds** vs **Playwright specs** can run in parallel when URLs and headings stay consistent across artifacts.
- **Serialize** if every agent must rewrite the same section of `index.html` (assign one owner).

## Power settings (MCP, memory, claude-flow)

- **Docs:** For Playwright config, mobile viewports, or Netlify header semantics, use **current docs** (for example **Context7**) when unsure.
- **Daemon / doctor:** Same as other Kaynos repos: `daemon start` for long sessions, `doctor --fix` for claude-flow issues.
- **Memory namespace:** Use `kaynos-docs` for durable content decisions (`toc-structure`, `canonical-url-policy`).

```bash
npx @claude-flow/cli@latest memory store --key "<key>" --value "<decision>" --namespace kaynos-docs
```

## Verification

- Local static checks: validate XML for `feed.xml` / `sitemap.xml` when you change them (well-formedness, URLs).
- Playwright: `playwright.config.js` and `tests/` are present. Run `npm test` from repo root (after `npm install`). Override `baseURL` for staging or local preview when the task requires it so agents do not assert only against production.

## Netlify

- Config: `netlify.toml` (headers, caching). Treat production deploys per org rules: confirm local or draft verification before prod CLI.

**Large `index.html`:** Prefer surgical edits; avoid wholesale reformatting that obscures diffs and risks merge conflicts for parallel agents.

## File layout reference

| Area        | Location |
|------------|-----------------------|
| Main HTML  | `index.html`          |
| Feed       | `feed.xml`            |
| Sitemap    | `sitemap.xml`         |
| Crawlers   | `robots.txt`          |
| E2E tests  | `tests/`              |

## Linear (issues and projects)

Prefer the **`linear` CLI** in the shell for issue **CRUD**, bulk field updates (state, priority, project, labels), and scripted queries (for example `linear issue query -j`). Use **Linear MCP** only when `linear` is not installed, a GraphQL-only operation is required, or the CLI fails for that task. Canonical workspace rule: `.cursor/rules/linear-cli.mdc`. Never paste API keys or tokens into files or chat.

## Pull requests and production deploys

Use **GitHub pull requests (PRs)** for changes that should go through review. Target **`main`** (this repo's default branch; it is not `master` here). **Merging a PR into `main`** triggers **production** Netlify deploys for the linked docs site (this repo has no in-repo GitHub Actions workflow; Netlify is the primary build path). Treat a merge as shipping docs to production.

## Support

- claude-flow: https://github.com/ruvnet/claude-flow
