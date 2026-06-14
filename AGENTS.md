# AGENTS.md — Kaynos Docs

Static help site for `docs.kaynos.net`. No build step: Netlify serves the repo root. Primary artifacts are `index.html` (one ~340KB file), `feed.xml`, `sitemap.xml`, `robots.txt`.

Detailed conventions live in `.cursor/rules/` (auto-loaded) and `CLAUDE.md`. Highlights:

## Commands

| Task | Command |
| --- | --- |
| Local serve | `npm run serve` (http-server on :3000) |
| Tests | `npm install` then `npm test` (Playwright; baseURL defaults to prod) |
| CI run | `npm run test:ci` (asserts against `localhost:3000`) |

## Working here

- **Surgical edits to `index.html`** — never reformat the whole file.
- After editing `feed.xml`/`sitemap.xml`, validate XML and keep URLs consistent with `index.html`. Use the `docs-publish-check` skill.
- Default branch is `main`. Merging a PR → production Netlify deploy.
- **Auto-merge default (this repo only):** after opening a PR, run `gh pr merge <N> --squash --auto --delete-branch`. Don't wait to be asked.
- Credentials-free repo — no secrets.
