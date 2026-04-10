# ADR-001: Split monolithic index.html

## Status

Proposed

## Context

The help center is a single `index.html` file (~4600 lines, ~252 KB uncompressed) containing all CSS, JS, content, and translations inline. This causes:

- **Merge conflicts** when multiple contributors edit simultaneously
- **Cache inefficiency** — any content edit invalidates the entire payload
- **CSP limitations** — inline scripts require `'unsafe-inline'`
- **SEO limitations** — hash-based routing; no per-page titles in source
- **Performance** — full 252 KB must be parsed before first paint

## Options considered

1. **Astro / Eleventy / Docusaurus** — full SSG migration. Best long-term outcome. Highest effort.
2. **Manual split** — extract CSS to `styles.css`, JS to `app.js`, content to JSON/markdown files with a simple build step. Moderate effort, addresses most issues.
3. **Keep as-is** — acceptable for current scale (~1000 users). Defer until pain increases.

## Decision

**Deferred.** Current scale does not justify the migration cost. Revisit when:
- The team grows beyond 1-2 contributors
- Content exceeds 100 articles
- SEO or performance budgets are missed

## Consequences

- Continue making surgical edits to `index.html`
- Accept `'unsafe-inline'` in CSP until split happens
- Hash-based URLs remain the routing strategy
